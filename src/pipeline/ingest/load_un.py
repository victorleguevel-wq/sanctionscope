from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[3]))

from src.parsers.un import parse_un
from src.models.database import engine, Entity, Alias, Sanction
from sqlalchemy.orm import Session


def load_un():
    entities = parse_un()

    with Session(engine) as session:
        # Supprime et recharge pour avoir les nationalités à jour
        existing = session.query(Entity).filter_by(source="UN").count()
        if existing > 0:
            print(f"{existing} entités ONU en base — rechargement...")
            ids = [e.id for e in session.query(Entity.id).filter_by(source="UN")]
            session.query(Alias).filter(Alias.entity_id.in_(ids)).delete(synchronize_session=False)
            session.query(Sanction).filter(Sanction.entity_id.in_(ids)).delete(synchronize_session=False)
            session.query(Entity).filter_by(source="UN").delete(synchronize_session=False)
            session.commit()

        count = 0
        for e in entities:
            entity = Entity(
                uid=e["uid"],
                name=e["name"],
                entity_type=e["type"],
                source="UN",
                programs=e["programs"],
                nationality=(e["nationalities"][0] if e["nationalities"] else None),
            )
            session.add(entity)
            session.flush()

            for a in e["aliases"]:
                session.add(Alias(
                    entity_id=entity.id,
                    alias=a["name"],
                    alias_type=a["type"],
                ))

            for program in e["programs"]:
                session.add(Sanction(
                    entity_id=entity.id,
                    source="UN",
                    program=program,
                ))

            count += 1
            if count % 200 == 0:
                session.commit()
                print(f"  {count} entités chargées...")

        session.commit()
        print(f"✅ {count} entités ONU chargées.")


if __name__ == "__main__":
    load_un()