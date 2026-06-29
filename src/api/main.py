from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pathlib import Path
import sys
import os
from dotenv import load_dotenv
import anthropic
from src.pipeline.gdelt import get_gdelt_events

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
sys.path.insert(0, str(Path(__file__).parents[2]))

from src.models.database import engine, Entity, Alias, EntityMatch

app = FastAPI(title="SanctionScope API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/entities")
def get_entities(
    source: str = None,
    entity_type: str = None,
    search: str = None,
    limit: int = 100
):
    with Session(engine) as session:
        query = session.query(Entity)
        if source:
            query = query.filter(Entity.source == source)
        if entity_type:
            query = query.filter(Entity.entity_type == entity_type)
        if search:
            query = query.filter(Entity.name.ilike(f"%{search}%"))
        entities = query.limit(limit).all()
        return [{
            "id": e.id,
            "name": e.name,
            "type": e.entity_type,
            "source": e.source,
            "programs": e.programs,
        } for e in entities]

@app.get("/entities/{entity_id}")
def get_entity(entity_id: int):
    with Session(engine) as session:
        e = session.get(Entity, entity_id)
        if not e:
            return {"error": "Not found"}
        aliases = [{"alias": a.alias, "type": a.alias_type} for a in e.aliases]
        return {
            "id": e.id,
            "name": e.name,
            "type": e.entity_type,
            "source": e.source,
            "programs": e.programs,
            "aliases": aliases,
        }

@app.get("/graph")
def get_graph(search: str = None, program: str = None, limit: int = 100):
    from src.pipeline.build_relations import Relation
    with Session(engine) as session:
        query = session.query(Entity)
        if search:
            query = query.filter(Entity.name.ilike(f"%{search}%"))
        if program:
            query = query.filter(Entity.programs.any(program))
        entities = query.limit(limit).all()

        entity_ids = {e.id for e in entities}

        nodes = [{
            "id": e.id,
            "name": e.name,
            "type": e.entity_type,
            "source": e.source,
            "programs": e.programs or [],
            "program": (e.programs or ["UNKNOWN"])[0],
        } for e in entities]

        relations = session.query(Relation).filter(
            Relation.source_id.in_(entity_ids),
            Relation.target_id.in_(entity_ids),
        ).all()

        links = [{
            "source": r.source_id,
            "target": r.target_id,
            "type": r.relation_type,
            "weight": r.weight,
        } for r in relations]

        return {"nodes": nodes, "links": links}

@app.get("/stats")
def get_stats():
    with Session(engine) as session:
        return {
            "total_ofac": session.query(Entity).filter_by(source="OFAC").count(),
            "total_un": session.query(Entity).filter_by(source="UN").count(),
            "total_matches": session.query(EntityMatch).count(),
        }


@app.get("/analysis/divergence")
def get_divergence(program: str = "IRAN"):
    with Session(engine) as session:
        # Entités OFAC dans ce programme
        ofac_entities = session.query(Entity).filter(
            Entity.source == "OFAC",
            Entity.programs.any(program)
        ).all()

        # Entités ONU dans ce programme
        un_entities = session.query(Entity).filter(
            Entity.source == "UN",
            Entity.programs.any(program)
        ).all()

        ofac_names = {normalize(e.name): e for e in ofac_entities}
        un_names = {normalize(e.name): e for e in un_entities}

        # OFAC seulement
        ofac_only = [
            {"id": e.id, "name": e.name, "type": e.entity_type, "source": "OFAC"}
            for name, e in ofac_names.items()
            if name not in un_names
        ]

        # ONU seulement
        un_only = [
            {"id": e.id, "name": e.name, "type": e.entity_type, "source": "UN"}
            for name, e in un_names.items()
            if name not in ofac_names
        ]

        # Les deux
        both = [
            {"id": e.id, "name": e.name, "type": e.entity_type, "source": "BOTH"}
            for name, e in ofac_names.items()
            if name in un_names
        ]

        return {
            "program": program,
            "ofac_total": len(ofac_entities),
            "un_total": len(un_entities),
            "ofac_only": ofac_only,
            "un_only": un_only,
            "both": both,
            "divergence_rate": round(len(ofac_only) / max(len(ofac_entities), 1) * 100, 1)
        }

def normalize(name: str) -> str:
    return " ".join(name.lower().strip().split())


@app.get("/ask")
def ask(question: str):
    with Session(engine) as session:
        entities_count = session.query(Entity).count()

        # Détection du pays/programme mentionné
        program_map = {
            "iran": "IRAN", "iranien": "IRAN", "iranienne": "IRAN", "iraniennes": "IRAN", "iraniens": "IRAN",
            "russia": "RUSSIA-EO14024", "russie": "RUSSIA-EO14024", "russe": "RUSSIA-EO14024",
            "corée": "DPRK", "coree": "DPRK", "nord-coréen": "DPRK", "dprk": "DPRK",
            "cuba": "CUBA", "syrie": "SYRIA", "venezuela": "VENEZUELA",
        }

        question_lower = question.lower()
        detected_program = None
        for keyword, program in program_map.items():
            if keyword in question_lower:
                detected_program = program
                break

        # Mots clés de recherche (on exclut les mots trop courts ou trop génériques)
        stop_words = {"les", "des", "par", "sont", "quels", "quelles", "dans", "pour", "avec", "une", "qui"}
        search_terms = [w for w in question_lower.split() if len(w) > 3 and w not in stop_words]

        relevant = []

        # Si un programme est détecté, cherche d'abord dans ce programme
        if detected_program:
            results = session.query(Entity).filter(
                Entity.programs.any(detected_program)
            ).limit(30).all()

            # Filtre par mots clés si possible
            filtered = [e for e in results if any(
                term in e.name.lower() for term in search_terms
                if term not in [k for k in program_map.keys()]
            )]
            relevant = filtered if filtered else results[:15]

        # Complète avec une recherche par nom
        if len(relevant) < 10:
            for term in search_terms[:3]:
                if term not in program_map:
                    results = session.query(Entity).filter(
                        Entity.name.ilike(f"%{term}%")
                    ).limit(10).all()
                    relevant.extend(results)

        # Déduplique
        seen = set()
        unique = []
        for e in relevant:
            if e.id not in seen:
                seen.add(e.id)
                unique.append(e)

        unique = unique[:20]

        context = "\n".join([
            f"- {e.name} ({e.entity_type}, {e.source}, programmes: {', '.join(e.programs or [])})"
            for e in unique
        ])

        # Récupère les événements GDELT récents
        gdelt_events = get_gdelt_events(question)
        gdelt_context = ""
        if gdelt_events:
            gdelt_context = "\n\nÉvénements récents (GDELT - temps réel) :\n"
            for ev in gdelt_events[:8]:
                gdelt_context += f"- [{ev['date']}] {ev['actor1']} / {ev['event_type']} à {ev['location']} (ton: {ev['tone']:.1f})\n"
                if ev['url'] and ev['url'] != 'nan':
                    gdelt_context += f"  Source: {ev['url']}\n"

    prompt = f"""Tu es un expert en géopolitique et en sanctions internationales.
Tu analyses des données réelles issues des listes de sanctions OFAC (américaines) et ONU.

La base de données contient {entities_count} entités sanctionnées.

Entités pertinentes trouvées pour cette question :
{context if context else "Aucune entité directement liée trouvée."}

Question de l'utilisateur : {question}

Réponds de façon structurée en français. Si tu identifies des événements clés, liste-les chronologiquement.
{gdelt_context}

Distingue clairement :
1. Ce qui vient des données de sanctions (base SanctionScope)
2. Ce qui vient des événements récents GDELT (temps réel)
3. Ce qui est contexte général de ta connaissance
Sois précis et factuel."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )

    return {
        "question": question,
        "answer": message.content[0].text,
        "entities_used": [{"name": e.name, "source": e.source, "type": e.entity_type} for e in unique]
    }