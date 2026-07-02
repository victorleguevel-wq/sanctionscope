import csv
from pathlib import Path

RAW_DATA = Path(__file__).parents[2] / "data" / "raw"


def parse_china(filepath: Path = RAW_DATA / "china_sanctions.tsv") -> list[dict]:
    entities = []

    with open(filepath, encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for i, row in enumerate(reader):
            name = row.get("Name", "").strip()
            if not name:
                continue

            entity_type = row.get("Type", "").strip()
            if entity_type == "Person":
                entity_type = "Individual"
            elif entity_type in ("Company", "Organization"):
                entity_type = "Entity"

            country = row.get("Country", "").strip()
            topic = row.get("Topics", "").strip()
            list_name = row.get("List", "").strip()
            date = row.get("Date", "").strip()
            summary = row.get("Summary", "").strip()
            alias = row.get("Alias", "").strip()

            # Programme basé sur le topic et la liste
            if "counter" in topic:
                program = "CN-COUNTER"
            elif "export" in topic:
                program = "CN-EXPORT"
            else:
                program = "CN-SANCTIONS"

            aliases = []
            if alias:
                aliases.append({"name": alias, "type": "a.k.a."})
            chinese_name = row.get("Chinese name", "").strip()
            if chinese_name:
                aliases.append({"name": chinese_name, "type": "chinese"})

            entities.append({
                "uid": f"CN-{i+1}",
                "name": name,
                "type": entity_type,
                "programs": [program],
                "aliases": aliases,
                "nationalities": [country] if country else [],
                "summary": summary,
                "listed_on": date,
                "list_name": list_name,
            })

    return entities


if __name__ == "__main__":
    entities = parse_china()
    print(f"Total entités chinoises : {len(entities)}")
    import json
    print(json.dumps(entities[0], indent=2, ensure_ascii=False))