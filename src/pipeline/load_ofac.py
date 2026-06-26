from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[2]))

from src.parsers.ofac import parse_ofac
from src.models.database import engine, Entity, Alias, Sanction
from sqlalchemy.orm import Session

def load_ofac():
    entities = parse_ofac()

    with Session(engine) as session:
        count = 0
        for e in entities:
            # Évite les doublons si on relance
            existing = session.query(Entity).filter_by(uid=e["uid"], source="OFAC").first()
            if existing:
                continue

            entity = Entity(
                uid=e["uid"],
                name=e["name"],
                entity_type=e["type"],
                source="OFAC",
                programs=e["programs"],
            )
            session.add(entity)
            session.flush()  # pour obtenir entity.id

            for a in e["aliases"]:
                session.add(Alias(
                    entity_id=entity.id,
                    alias=a["name"],
                    alias_type=a["type"],
                ))

            for program in e["programs"]:
                session.add(Sanction(
                    entity_id=entity.id,
                    source="OFAC",
                    program=program,
                ))

            count += 1

        session.commit()
        print(f"{count} entités chargées dans PostgreSQL.")

if __name__ == "__main__":
    load_ofac()