from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[2]))

from src.models.database import engine, Entity, Base
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import Session, relationship

class Relation(Base):
    __tablename__ = "relations"
    id          = Column(Integer, primary_key=True)
    source_id   = Column(Integer, ForeignKey("entities.id"))
    target_id   = Column(Integer, ForeignKey("entities.id"))
    relation_type = Column(String)  # 'same_program', 'cross_source', 'same_address'
    weight      = Column(Integer, default=1)

Base.metadata.create_all(engine)

def build_relations():
    with Session(engine) as session:
        # Supprime les anciennes relations
        session.query(Relation).delete()
        session.commit()

        entities = session.query(Entity).all()
        count = 0

        # Groupe par programme
        from collections import defaultdict
        program_map = defaultdict(list)
        for e in entities:
            for p in (e.programs or []):
                program_map[p].append(e.id)

        # Crée des liens entre entités du même programme
        # On limite à 3 connexions par entité pour éviter un graphe trop dense
        for program, ids in program_map.items():
            if len(ids) < 2 or len(ids) > 500:
                continue
            for i, id_a in enumerate(ids[:50]):
                for id_b in ids[i+1:i+4]:
                    session.add(Relation(
                        source_id=id_a,
                        target_id=id_b,
                        relation_type="same_program",
                        weight=2,
                    ))
                    count += 1

        session.commit()
        print(f"{count} relations créées.")

if __name__ == "__main__":
    build_relations()