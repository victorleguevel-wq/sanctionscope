from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[3]))

from src.parsers.ofac import parse_ofac
from src.models.database import engine, Entity, Alias, Sanction
from sqlalchemy.orm import Session
from src.constants import COUNTRY_TO_ISO2

def load_ofac():
    entities = parse_ofac()

    with Session(engine) as session:
        count = 0
        for e in entities:
            existing = session.query(Entity).filter_by(uid=e["uid"], source="OFAC").first()
            if existing:
                continue

            # Nationalité : premier pays listé, converti en ISO-2
            nat_raw = e["nationalities"][0] if e.get("nationalities") else None
            iso2 = COUNTRY_TO_ISO2.get(nat_raw) if nat_raw else None

            entity = Entity(
                uid=e["uid"],
                name=e["name"],
                entity_type=e["type"],
                source="OFAC",
                programs=e["programs"],
                nationality=iso2,
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
                    source="OFAC",
                    program=program,
                ))

            count += 1
            if count % 500 == 0:
                session.commit()
                print(f"  {count} entités chargées...")

        session.commit()
        print(f"✅ {count} nouvelles entités OFAC chargées.")


if __name__ == "__main__":
    load_ofac()