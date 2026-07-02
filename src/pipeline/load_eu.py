from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[2]))

from src.parsers.eu import parse_eu
from src.models.database import engine, Entity, Alias, Sanction
from sqlalchemy.orm import Session
from datetime import date


def load_eu(filepath: Path = None):
    kwargs = {"filepath": filepath} if filepath else {}
    entities = parse_eu(**kwargs)

    with Session(engine) as session:
        # Supprime les anciennes entités EU pour permettre le rechargement propre
        existing = session.query(Entity).filter_by(source="EU").count()
        if existing > 0:
            print(f"{existing} entités EU déjà en base — suppression pour rechargement...")
            ids = [e.id for e in session.query(Entity.id).filter_by(source="EU")]
            session.query(Alias).filter(Alias.entity_id.in_(ids)).delete(synchronize_session=False)
            session.query(Sanction).filter(Sanction.entity_id.in_(ids)).delete(synchronize_session=False)
            session.query(Entity).filter_by(source="EU").delete(synchronize_session=False)
            session.commit()

        count = 0
        for e in entities:
            entity = Entity(
                uid=e["uid"],
                name=e["name"],
                entity_type=e["type"],
                source="EU",
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
                listed = None
                if e.get("listed_on"):
                    try:
                        listed = date.fromisoformat(e["listed_on"])
                    except ValueError:
                        pass
                session.add(Sanction(
                    entity_id=entity.id,
                    source="EU",
                    program=program,
                    listed_on=listed,
                ))

            count += 1
            if count % 500 == 0:
                session.commit()
                print(f"  {count} entités chargées...")

        session.commit()
        print(f"✅ {count} entités EU chargées en base.")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=Path, help="Chemin vers targets.simple.csv")
    args = parser.parse_args()
    load_eu(filepath=args.file)