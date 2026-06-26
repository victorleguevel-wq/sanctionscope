import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"ofac": "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/XML"}
RAW_DATA = Path(__file__).parents[2] / "data" / "raw"


def parse_ofac(filepath: Path = RAW_DATA / "sdn.xml") -> list[dict]:
    tree = ET.parse(filepath)
    root = tree.getroot()

    entities = []

    for entry in root.findall("ofac:sdnEntry", NS):
        # Infos de base
        uid = entry.findtext("ofac:uid", namespaces=NS)
        last_name = entry.findtext("ofac:lastName", namespaces=NS, default="")
        first_name = entry.findtext("ofac:firstName", namespaces=NS, default="")
        sdn_type = entry.findtext("ofac:sdnType", namespaces=NS)

        # Programmes (RUSSIA, IRAN, etc.)
        programs = [
            p.text for p in entry.findall("ofac:programList/ofac:program", NS)
        ]

        # Aliases
        aliases = []
        for aka in entry.findall("ofac:akaList/ofac:aka", NS):
            aka_last = aka.findtext("ofac:lastName", namespaces=NS, default="")
            aka_first = aka.findtext("ofac:firstName", namespaces=NS, default="")
            aka_type = aka.findtext("ofac:type", namespaces=NS)
            aliases.append({
                "name": f"{aka_last} {aka_first}".strip(),
                "type": aka_type
            })

        # Nationalités / pays
        nationalities = [
            n.findtext("ofac:country", namespaces=NS)
            for n in entry.findall("ofac:nationalityList/ofac:nationality", NS)
        ]

        entities.append({
            "uid": uid,
            "name": f"{last_name} {first_name}".strip(),
            "type": sdn_type,
            "programs": programs,
            "aliases": aliases,
            "nationalities": nationalities,
        })

    return entities


if __name__ == "__main__":
    entities = parse_ofac()
    print(f"Total entités : {len(entities)}")
    print(f"\nExemple — première entité :")
    import json
    print(json.dumps(entities[0], indent=2, ensure_ascii=False))