from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pathlib import Path
import sys
import os
import json
import re
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

# ── Helpers ─────────────────────────────────────────────────────────────────

def normalize(name: str) -> str:
    return " ".join(name.lower().strip().split())

# Mapping programme OFAC/ONU → ISO-2 du pays ciblé
PROGRAM_TO_COUNTRY = {
    "RUSSIA-EO14024": "RU", "CAATSA - RUSSIA": "RU", "RUSSIA-EO14065": "RU", "RUSSIA": "RU",
    "IRAN": "IR", "CAATSA - IRAN": "IR", "IRAN-EO13876": "IR", "IFSR": "IR", "IFCA": "IR", "IRGC": "IR",
    "DPRK": "KP", "DPRK2": "KP", "DPRK3": "KP", "DPRK4": "KP",
    "CUBA": "CU", "CUBA-EO14404": "CU",
    "SYRIA": "SY",
    "VENEZUELA": "VE",
    "BELARUS": "BY", "BELARUS-EO14038": "BY",
    "UKRAINE-EO13662": "UA", "UKRAINE-EO13660": "UA", "UKRAINE-EO13661": "UA", "UKRAINE-EO13685": "UA",
    "MYANMAR-EO14014": "MM",
    "SOMALIA": "SO",
    "SUDAN": "SD",
    "LIBYA": "LY",
    "IRAQ": "IQ",
    "YEMEN": "YE",
    "HAITI": "HT",
    "MALI": "ML",
    "CAR": "CF",
    "DRC": "CD",
    "BALKANS": "RS",
    "AFGHANISTAN": "AF", "TALIBAN": "AF",
    "ZIMBABWE": "ZW",
    "BURUNDI": "BI",
    "ETHIOPIA": "ET",
    "NICARAGUA": "NI",
    "SOUTH SUDAN": "SS",
    # Chine : elle sanctionne surtout des entités américaines
    "CN-COUNTER": "US",
    "CN-EXPORT": "US",
    "CN-SANCTIONS": "US",
    "EU-UKRAINE": "UA", "EU-RUSSIA": "RU", "EU-IRAN": "IR",
    "EU-SYRIA": "SY", "EU-TERROR": None, "EU-DPRK": "KP",
    "EU-DRC": "CD", "EU-AFGHANISTAN": "AF", "EU-MYANMAR": "MM",
    "EU-VENEZUELA": "VE", "EU-CAR": "CF", "EU-LIBYA": "LY",
    "EU-SOMALIA": "SO", "EU-SUDAN": "SD", "EU-TUNISIA": "TN",
    "EU-HAITI": "HT", "EU-MALI": "ML", "EU-YEMEN": "YE",
    "EU-NICARAGUA": "NI", "EU-GUINEA": "GN", "EU-BELARUS": "BY",
    "EU-CYBER": None, "EU-OTHER": None,
    "IRAN-EO13902": "IR",
    "IRAN-EO13846": "IR",
    "IRAN-HR": "IR",
    "IRAN-EO13871": "IR",
    "IRAN-TRA": "IR",
    "IRAQ2": "IQ",
    "VENEZUELA-EO13850": "VE",
    "VENEZUELA-EO13884": "VE",
    "BURMA-EO14014": "MM",
    "DRCONGO": "CD",
    "SUDAN-EO14098": "SD",
    "LIBYA3": "LY",
    "BALKANS-EO14033": "RS",
}

SOURCE_LABELS = {"OFAC": "États-Unis (OFAC)", "UN": "Nations Unies", "CN": "Chine"}


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


# ── Graphe ───────────────────────────────────────────────────────────────────

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
            "id": e.id, "name": e.name, "type": e.entity_type,
            "source": e.source, "programs": e.programs or [],
            "program": (e.programs or ["UNKNOWN"])[0],
        } for e in entities]

        relations = session.query(Relation).filter(
            Relation.source_id.in_(entity_ids),
            Relation.target_id.in_(entity_ids),
        ).all()

        links = [{"source": r.source_id, "target": r.target_id, "type": r.relation_type, "weight": r.weight} for r in relations]
        return {"nodes": nodes, "links": links}


@app.get("/graph/entity/{entity_id}")
def get_entity_graph(entity_id: int):
    from src.pipeline.build_relations import Relation
    with Session(engine) as session:
        center = session.get(Entity, entity_id)
        if not center:
            return {"error": "Not found"}

        relations = session.query(Relation).filter(
            (Relation.source_id == entity_id) | (Relation.target_id == entity_id)
        ).limit(20).all()

        connected_ids = {r.source_id for r in relations} | {r.target_id for r in relations}
        connected_ids.discard(entity_id)
        connected = session.query(Entity).filter(Entity.id.in_(connected_ids)).all()

        nodes = [{
            "id": center.id, "name": center.name, "type": center.entity_type,
            "source": center.source, "programs": center.programs or [], "center": True
        }] + [{
            "id": e.id, "name": e.name, "type": e.entity_type,
            "source": e.source, "programs": e.programs or [], "center": False
        } for e in connected]

        links = [{"source": r.source_id, "target": r.target_id, "weight": r.weight} for r in relations]
        return {"nodes": nodes, "links": links, "center": center.name}


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


# ── Analyse : divergence OFAC vs ONU ────────────────────────────────────────

@app.get("/analysis/divergence")
def get_divergence(program: str = "IRAN"):
    with Session(engine) as session:
        ofac_entities = session.query(Entity).filter(Entity.source == "OFAC", Entity.programs.any(program)).all()
        un_entities   = session.query(Entity).filter(Entity.source == "UN",   Entity.programs.any(program)).all()

        ofac_names = {normalize(e.name): e for e in ofac_entities}
        un_names   = {normalize(e.name): e for e in un_entities}

        return {
            "program":        program,
            "ofac_total":     len(ofac_entities),
            "un_total":       len(un_entities),
            "ofac_only":      [{"id": e.id, "name": e.name, "type": e.entity_type, "source": "OFAC"} for name, e in ofac_names.items() if name not in un_names],
            "un_only":        [{"id": e.id, "name": e.name, "type": e.entity_type, "source": "UN"}   for name, e in un_names.items()   if name not in ofac_names],
            "both":           [{"id": e.id, "name": e.name, "type": e.entity_type, "source": "BOTH"} for name, e in ofac_names.items() if name in un_names],
            "divergence_rate": round(len([n for n in ofac_names if n not in un_names]) / max(len(ofac_entities), 1) * 100, 1),
        }


# ── Analyse : vue d'ensemble par programme ───────────────────────────────────

@app.get("/analysis/overview")
def get_overview():
    programs = [
        {"key": "RUSSIA-EO14024",   "label": "Russie",                      "flag": "🇷🇺", "color": "#ef4444"},
        {"key": "CAATSA - RUSSIA",  "label": "Russie (CAATSA)",             "flag": "🇷🇺", "color": "#ef4444"},
        {"key": "IRAN",             "label": "Iran",                         "flag": "🇮🇷", "color": "#f97316"},
        {"key": "DPRK",             "label": "Corée du Nord",                "flag": "🇰🇵", "color": "#8b5cf6"},
        {"key": "CUBA",             "label": "Cuba",                         "flag": "🇨🇺", "color": "#06b6d4"},
        {"key": "SYRIA",            "label": "Syrie",                        "flag": "🇸🇾", "color": "#eab308"},
        {"key": "VENEZUELA",        "label": "Venezuela",                    "flag": "🇻🇪", "color": "#ec4899"},
        {"key": "BELARUS",          "label": "Biélorussie",                  "flag": "🇧🇾", "color": "#f43f5e"},
        {"key": "UKRAINE-EO13662",  "label": "Ukraine (entités pro-russes)", "flag": "🇺🇦", "color": "#3b82f6"},
        {"key": "MYANMAR-EO14014",  "label": "Myanmar",                     "flag": "🇲🇲", "color": "#84cc16"},
        {"key": "SDGT",             "label": "Terrorisme global",            "flag": "⚠️",  "color": "#dc2626"},
        {"key": "CYBER2",           "label": "Cyberattaques",               "flag": "💻", "color": "#7c3aed"},
        {"key": "BALKANS",          "label": "Balkans",                      "flag": "🌍", "color": "#0891b2"},
        {"key": "CAR",              "label": "Centrafrique",                 "flag": "🇨🇫", "color": "#d97706"},
        {"key": "CN-COUNTER",       "label": "Contre-sanctions chinoises",   "flag": "🇨🇳", "color": "#dc2626"},
        {"key": "CN-EXPORT",        "label": "Contrôle exports chinois",     "flag": "🇨🇳", "color": "#b91c1c"},
    ]

    with Session(engine) as session:
        result = []
        for p in programs:
            ofac  = session.query(Entity).filter(Entity.source == "OFAC", Entity.programs.any(p["key"])).count()
            un    = session.query(Entity).filter(Entity.source == "UN",   Entity.programs.any(p["key"])).count()
            cn    = session.query(Entity).filter(Entity.source == "CN",   Entity.programs.any(p["key"])).count()
            total = ofac + un + cn
            if total == 0:
                continue
            result.append({
                **p,
                "ofac": ofac, "un": un, "cn": cn,
                "total": total,
                "divergence": round(max(ofac, un, cn) / total * 100, 1),
            })
        return sorted(result, key=lambda x: x["total"], reverse=True)


# ── Analyse : carte des sanctions par pays ───────────────────────────────────

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

# ── Analyse : données brutes par pays (legacy) ───────────────────────────────

@app.get("/analysis/countries")
def get_countries():
    result = {}
    with Session(engine) as session:
        for e in session.query(Entity).filter(Entity.source.in_(["OFAC", "UN"])).all():
            for program in (e.programs or []):
                country = PROGRAM_TO_COUNTRY.get(program.upper())
                if not country:
                    continue
                if country not in result:
                    result[country] = {"ofac": 0, "un": 0, "cn": 0, "total": 0}
                key = "ofac" if e.source == "OFAC" else "un"
                result[country][key] += 1
                result[country]["total"] += 1

        for e in session.query(Entity).filter_by(source="CN").all():
            nat = e.nationality
            if not nat:
                continue
            if nat not in result:
                result[nat] = {"ofac": 0, "un": 0, "cn": 0, "total": 0}
            result[nat]["cn"] += 1
            result[nat]["total"] += 1

    return result


# ── IA : question libre ──────────────────────────────────────────────────────

@app.get("/ask")
def ask(question: str):
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