"""
Migration : remplit le champ nationality pour les entités OFAC
en re-parsant sdn.xml et en mettant à jour les enregistrements existants.
"""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[3]))

from src.parsers.ofac import parse_ofac
from src.models.database import engine, Entity
from sqlalchemy.orm import Session
from src.constants import COUNTRY_TO_ISO2



def migrate_ofac_nationality():
    print("Parsing sdn.xml...")
    entities = parse_ofac()

    # Index uid → première nationalité ISO-2
    uid_to_nat = {}
    for e in entities:
        nats = [n for n in (e.get("nationalities") or []) if n]
        if nats:
            iso2 = COUNTRY_TO_ISO2.get(nats[0])
            if iso2:
                uid_to_nat[e["uid"]] = iso2

    print(f"{len(uid_to_nat)} entités avec nationalité connue sur {len(entities)} total")

    updated = 0
    with Session(engine) as session:
        # Traite par batch de 500
        ofac_entities = session.query(Entity).filter_by(source="OFAC").all()
        for entity in ofac_entities:
            if entity.nationality:
                continue  # déjà rempli
            nat = uid_to_nat.get(entity.uid)
            if nat:
                entity.nationality = nat
                updated += 1

        session.commit()
        print(f"✅ {updated} entités OFAC mises à jour avec leur nationalité.")

    # Vérifie le résultat
    with Session(engine) as session:
        cn_count = session.query(Entity).filter_by(source="OFAC", nationality="CN").count()
        ru_count = session.query(Entity).filter_by(source="OFAC", nationality="RU").count()
        ir_count = session.query(Entity).filter_by(source="OFAC", nationality="IR").count()
        print(f"\nTop nationalités OFAC après migration :")
        print(f"  CN (Chine)  : {cn_count}")
        print(f"  RU (Russie) : {ru_count}")
        print(f"  IR (Iran)   : {ir_count}")


if __name__ == "__main__":
    migrate_ofac_nationality()