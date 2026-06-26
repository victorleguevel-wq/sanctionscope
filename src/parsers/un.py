import xml.etree.ElementTree as ET
from pathlib import Path

RAW_DATA = Path(__file__).parents[2] / "data" / "raw"


def parse_un(filepath: Path = RAW_DATA / "consolidated.xml") -> list[dict]:
    tree = ET.parse(filepath)
    root = tree.getroot()

    entities = []

    for individual in root.findall(".//INDIVIDUAL"):
        uid = individual.findtext("DATAID")
        first_name = individual.findtext("FIRST_NAME") or ""
        second_name = individual.findtext("SECOND_NAME") or ""
        third_name = individual.findtext("THIRD_NAME") or ""
        name = " ".join(filter(None, [first_name, second_name, third_name])).strip()

        nationality = individual.findtext(".//NATIONALITY/VALUE") or ""

        aliases = []
        for aka in individual.findall(".//INDIVIDUAL_ALIAS"):
            aka_name = " ".join(filter(None, [
                aka.findtext("FIRST_NAME") or "",
                aka.findtext("SECOND_NAME") or "",
                aka.findtext("THIRD_NAME") or "",
            ])).strip()
            if aka_name:
                aliases.append({"name": aka_name, "type": "a.k.a."})

        entities.append({
            "uid": f"UN-{uid}",
            "name": name,
            "type": "Individual",
            "programs": ["UN"],
            "aliases": aliases,
            "nationalities": [nationality] if nationality else [],
        })

    for entity in root.findall(".//ENTITY"):
        uid = entity.findtext("DATAID")
        name = entity.findtext("FIRST_NAME") or ""

        aliases = []
        for aka in entity.findall(".//ENTITY_ALIAS"):
            aka_name = aka.findtext("ALIAS_NAME") or ""
            if aka_name:
                aliases.append({"name": aka_name, "type": "a.k.a."})

        entities.append({
            "uid": f"UN-{uid}",
            "name": name,
            "type": "Entity",
            "programs": ["UN"],
            "aliases": aliases,
            "nationalities": [],
        })

    return entities


if __name__ == "__main__":
    entities = parse_un()
    print(f"Total entités ONU : {len(entities)}")
    import json
    print(json.dumps(entities[0], indent=2, ensure_ascii=False))