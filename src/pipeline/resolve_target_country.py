"""
Résout target_country pour toutes les entités et sauvegarde en base.
Logique: nationality en priorité, sinon fallback via PROGRAM_TO_COUNTRY.
"""
from sqlalchemy.orm import Session
from src.models.database import engine, Entity

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
    "CN-COUNTER": "US", "CN-EXPORT": "US", "CN-SANCTIONS": "US",
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


def resolve_target_country(entity):
    if entity.nationality:
        return entity.nationality
    for prog in (entity.programs or []):
        country = PROGRAM_TO_COUNTRY.get(prog.upper())
        if country:
            return country
    return None


def main():
    with Session(engine) as session:
        entities = session.query(Entity).all()
        updated, skipped = 0, 0

        for e in entities:
            resolved = resolve_target_country(e)
            if resolved:
                e.target_country = resolved
                updated += 1
            else:
                skipped += 1

        session.commit()
        print(f"{updated} entités mises à jour, {skipped} sans pays cible résolu.")


if __name__ == "__main__":
    main()
