from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pathlib import Path
import sys
import os
import json
import re
from collections import defaultdict
from datetime import datetime, timedelta
from dotenv import load_dotenv
import anthropic
from src.pipeline.gdelt import get_gdelt_events
from src.sources import SOURCES, get_sources_payload

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
sys.path.insert(0, str(Path(__file__).parents[2]))

from src.models.database import engine, Entity, Alias, EntityMatch

app = FastAPI(title="SanctionScope API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

# Labels de sources dérivés du registre central (src/sources.py)
# Pour ajouter une source : modifier uniquement src/sources.py
SOURCE_LABELS = {k: v["label"] for k, v in SOURCES.items()}


# ── Limitation de requêtes pour la démo publique ─────────────────────────────
# Protection simple contre un usage abusif du endpoint /ask, qui appelle
# l'API Anthropic à chaque requête. En mémoire (suffisant pour une démo,
# se réinitialise si le serveur redémarre).
_request_log = defaultdict(list)
MAX_REQUESTS_PER_DAY = 5

def check_rate_limit(request: Request):
    ip = request.client.host
    now = datetime.now()
    _request_log[ip] = [t for t in _request_log[ip] if now - t < timedelta(days=1)]

    if len(_request_log[ip]) >= MAX_REQUESTS_PER_DAY:
        raise HTTPException(
            status_code=429,
            detail="Limite quotidienne atteinte pour cette démo (5 questions/jour). Réessayez demain."
        )
    _request_log[ip].append(now)


# ── Sources ──────────────────────────────────────────────────────────────────

@app.get("/sources")
def get_sources():
    return get_sources_payload()


# ── Entités ──────────────────────────────────────────────────────────────────

@app.get("/entities")
def get_entities(source: str = None, entity_type: str = None, search: str = None, limit: int = 100):
    with Session(engine) as session:
        query = session.query(Entity)
        if source:
            query = query.filter(Entity.source == source)
        if entity_type:
            query = query.filter(Entity.entity_type == entity_type)
        if search:
            query = query.filter(Entity.name.ilike(f"%{search}%"))
        entities = query.limit(limit).all()
        return [{"id": e.id, "name": e.name, "type": e.entity_type, "source": e.source, "programs": e.programs, "target_country": e.target_country, } for e in entities]


@app.get("/entities/{entity_id}")
def get_entity(entity_id: int):
    with Session(engine) as session:
        e = session.get(Entity, entity_id)
        if not e:
            return {"error": "Not found"}
        return {
            "id": e.id, "name": e.name, "type": e.entity_type,
            "source": e.source, "programs": e.programs,
            "aliases": [{"alias": a.alias, "type": a.alias_type} for a in e.aliases],
        }


# ── Stats ────────────────────────────────────────────────────────────────────

@app.get("/stats")
def get_stats():
    with Session(engine) as session:
        return {
            "total_ofac":    session.query(Entity).filter_by(source="OFAC").count(),
            "total_un":      session.query(Entity).filter_by(source="UN").count(),
            "total_eu":      session.query(Entity).filter_by(source="EU").count(),
            "total_cn":      session.query(Entity).filter_by(source="CN").count(),
            "total_matches": session.query(EntityMatch).count(),
        }


# ── Analyse : carte des sanctions par pays ───────────────────────────────────
# Utilise Entity.target_country, déjà résolu et stocké en base par
# src/pipeline/resolve_target_country.py (nationality en priorité, sinon
# fallback via le mapping programme → pays). Ne PAS recalculer ici.

@app.get("/analysis/sanctions-map")
def get_sanctions_map():
    with Session(engine) as session:
        entities = session.query(Entity).filter(Entity.target_country.isnot(None)).all()

    result = {}
    for e in entities:
        target = e.target_country
        source = e.source
        if target not in result:
            result[target] = {"target_country": target, "sanctioners": {}, "total": 0}
        if source not in result[target]["sanctioners"]:
            result[target]["sanctioners"][source] = {
                "label": SOURCE_LABELS.get(source, source),
                "count": 0, "programs": set(), "types": {},
            }
        s = result[target]["sanctioners"][source]
        s["count"] += 1
        result[target]["total"] += 1
        for prog in (e.programs or []):
            s["programs"].add(prog)
        etype = e.entity_type or "Unknown"
        s["types"][etype] = s["types"].get(etype, 0) + 1

    for country_data in result.values():
        for src_data in country_data["sanctioners"].values():
            src_data["programs"] = sorted(src_data["programs"])

    return result


@app.get("/analysis/country/{iso2}")
def get_country_entities(iso2: str, source: str = None):
    with Session(engine) as session:
        query = session.query(Entity).filter(Entity.target_country == iso2)
        if source:
            query = query.filter(Entity.source == source)
        entities = query.order_by(Entity.name).all()
        return [{
            "id": e.id,
            "name": e.name,
            "type": e.entity_type,
            "source": e.source,
            "programs": e.programs or [],
        } for e in entities]

# ── Analyse : divergence par pays/programme ──────────────────────────────────
# Recalculé dynamiquement à partir de target_country (source de vérité unique).
# Les notes éditoriales (contexte géopolitique) restent côté frontend, car
# elles ne sont pas dérivables automatiquement des données.

DIVERGENCE_COUNTRIES = ["RU", "IR", "KP", "VE", "CU", "ML"]

@app.get("/analysis/divergence")
def get_divergence_by_country():
    with Session(engine) as session:
        results = []

        for iso2 in DIVERGENCE_COUNTRIES:
            counts = {}
            for src in SOURCES.keys():
                counts[src] = session.query(Entity).filter(
                    Entity.target_country == iso2,
                    Entity.source == src,
                ).count()
            total = sum(counts.values())
            if total == 0:
                continue
            results.append({
                "key": iso2,
                "counts": counts,
                "total": total,
                "divergence_rate": round(max(counts.values()) / total * 100, 1),
            })

        # Cas particulier : terrorisme global, un programme transverse
        # qui ne cible pas un pays unique (pas de target_country pertinent).
        terror_counts = {}
        for src in SOURCES.keys():
            terror_counts[src] = session.query(Entity).filter(
                Entity.source == src,
                Entity.programs.any("SDGT"),
            ).count()
        terror_total = sum(terror_counts.values())
        if terror_total > 0:
            results.append({
                "key": "SDGT",
                "counts": terror_counts,
                "total": terror_total,
                "divergence_rate": round(max(terror_counts.values()) / terror_total * 100, 1),
            })

        return sorted(results, key=lambda r: r["total"], reverse=True)


# ── IA : question libre ──────────────────────────────────────────────────────

@app.get("/ask")
def ask(question: str, request: Request):
    check_rate_limit(request)

    with Session(engine) as session:
        entities_count = session.query(Entity).count()

        program_map = {
            "iran": "IRAN", "iranien": "IRAN", "iranienne": "IRAN",
            "iraniennes": "IRAN", "iraniens": "IRAN",
            "russia": "RUSSIA-EO14024", "russie": "RUSSIA-EO14024", "russe": "RUSSIA-EO14024",
            "corée": "DPRK", "coree": "DPRK", "nord-coréen": "DPRK", "dprk": "DPRK",
            "cuba": "CUBA", "syrie": "SYRIA", "venezuela": "VENEZUELA",
        }

        question_lower = question.lower()
        detected_program = next((v for k, v in program_map.items() if k in question_lower), None)

        stop_words = {"les", "des", "par", "sont", "quels", "quelles", "dans", "pour", "avec", "une", "qui"}
        search_terms = [w for w in question_lower.split() if len(w) > 3 and w not in stop_words]

        relevant = []
        if detected_program:
            results = session.query(Entity).filter(Entity.programs.any(detected_program)).limit(30).all()
            filtered = [e for e in results if any(t in e.name.lower() for t in search_terms if t not in program_map)]
            relevant = filtered if filtered else results[:15]

        if len(relevant) < 10:
            for term in search_terms[:3]:
                if term not in program_map:
                    relevant.extend(session.query(Entity).filter(Entity.name.ilike(f"%{term}%")).limit(10).all())

        seen, unique = set(), []
        for e in relevant:
            if e.id not in seen:
                seen.add(e.id)
                unique.append(e)
        unique = unique[:20]

        context = "\n".join([
            f"- {e.name} ({e.entity_type}, {e.source}, programmes: {', '.join(e.programs or [])})"
            for e in unique
        ])

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

Entités pertinentes trouvées :
{context if context else "Aucune entité directement liée trouvée."}
{gdelt_context}

Question : {question}

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks, avec cette structure exacte :
{{
  "summary": "Résumé en 2-3 phrases",
  "sections": [
    {{
      "title": "Titre de la section",
      "icon": "emoji",
      "content": "Texte de la section",
      "type": "text"
    }}
  ],
  "timeline": [
    {{
      "date": "Année ou date",
      "event": "Description de l'événement",
      "importance": "high|medium|low"
    }}
  ],
  "key_figures": [
    {{
      "name": "Nom",
      "role": "Rôle",
      "source": "OFAC|ONU|général"
    }}
  ],
  "sources": [
    {{
      "label": "Nom de la source",
      "url": "URL si disponible",
      "type": "sanctions|gdelt|general"
    }}
  ]
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    raw = re.sub(r'^```(?:json)?\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    raw = raw.strip()

    json_match = re.search(r'\{.*\}', raw, re.DOTALL)
    if json_match:
        raw = json_match.group(0)

    try:
        structured = json.loads(raw)
        if not isinstance(structured, dict) or "summary" not in structured:
            raise ValueError("Structure inattendue")
    except Exception as e:
        print(f"Parse error: {e}\nRaw: {raw[:200]}")
        structured = {
            "summary": "Erreur de parsing de la réponse IA.",
            "sections": [], "timeline": [], "key_figures": [], "sources": []
        }

    return {
        "question":      question,
        "answer":        structured,
        "entities_used": [{"name": e.name, "source": e.source, "type": e.entity_type} for e in unique],
        "gdelt_events":  gdelt_events[:8],
    }