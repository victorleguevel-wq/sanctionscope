from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pathlib import Path
import sys
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