import csv
from pathlib import Path

RAW_DATA = Path(__file__).parents[2] / "data" / "raw"

# Mapping schema OpenSanctions → type interne
SCHEMA_TO_TYPE = {
    "Person":        "Individual",
    "Company":       "Entity",
    "Organization":  "Entity",
    "LegalEntity":   "Entity",
    "Vessel":        "Vessel",
    "Aircraft":      "Aircraft",
    "CryptoWallet":  "Entity",
}

# Extraction du programme depuis sanctions ou program_ids
def extract_program(sanctions: str, program_ids: str, dataset: str) -> str:
    """Déduit le programme EU depuis les champs sanctions/program_ids."""
    s = (sanctions + " " + program_ids).upper()
    if "UKR" in s or "UKRAINE" in s:        return "EU-UKRAINE"
    if "RUS" in s or "RUSSIA" in s:         return "EU-RUSSIA"
    if "SYR" in s or "SYRIA" in s:          return "EU-SYRIA"
    if "IRN" in s or "IRAN" in s:           return "EU-IRAN"
    if "PRK" in s or "DPRK" in s or "KOREA" in s: return "EU-DPRK"
    if "BLR" in s or "BELARUS" in s:        return "EU-BELARUS"
    if "MMR" in s or "MYANMAR" in s:        return "EU-MYANMAR"
    if "LBY" in s or "LIBYA" in s:          return "EU-LIBYA"
    if "SDN" in s or "SUDAN" in s:          return "EU-SUDAN"
    if "SOM" in s or "SOMALIA" in s:        return "EU-SOMALIA"
    if "MLI" in s or "MALI" in s:           return "EU-MALI"
    if "CAF" in s or "CAR" in s:            return "EU-CAR"
    if "COD" in s or "CONGO" in s:          return "EU-DRC"
    if "YEM" in s or "YEMEN" in s:          return "EU-YEMEN"
    if "HTI" in s or "HAITI" in s:          return "EU-HAITI"
    if "NIC" in s or "NICARAGUA" in s:      return "EU-NICARAGUA"
    if "VEN" in s or "VENEZUELA" in s:      return "EU-VENEZUELA"
    if "CUB" in s or "CUBA" in s:           return "EU-CUBA"
    if "TERROR" in s or "ISIL" in s or "AL-QAIDA" in s: return "EU-TERROR"
    if "CYBER" in s:                         return "EU-CYBER"
    if "BURUNDI" in s:                       return "EU-BURUNDI"
    if "GUINEA" in s:                        return "EU-GUINEA"
    if "TUNISI" in s:                        return "EU-TUNISIA"
    if "EGYPT" in s:                         return "EU-EGYPT"
    if "AFGHAN" in s:                        return "EU-AFGHANISTAN"
    return "EU-OTHER"


def parse_eu(filepath: Path = RAW_DATA / "eu_targets.simple.csv") -> list[dict]:
    """Parse le fichier targets.simple.csv d'OpenSanctions (EU sanctions)."""
    entities = []

    with open(filepath, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            name = row.get("name", "").strip()
            if not name:
                continue

            schema      = row.get("schema", "").strip()
            entity_type = SCHEMA_TO_TYPE.get(schema, "Entity")

            # Pays : premier pays listé dans le champ "countries" (séparé par ";")
            countries_raw = row.get("countries", "").strip()
            country = countries_raw.split(";")[0].strip() if countries_raw else None

            # Programme
            sanctions  = row.get("sanctions", "")
            prog_ids   = row.get("program_ids", "")
            dataset    = row.get("dataset", "")
            program    = extract_program(sanctions, prog_ids, dataset)

            # Aliases
            aliases_raw = row.get("aliases", "").strip()
            aliases = []
            if aliases_raw:
                for alias in aliases_raw.split(";"):
                    alias = alias.strip().strip('"')
                    if alias and alias != name:
                        aliases.append({"name": alias, "type": "a.k.a."})

            # Date
            first_seen  = row.get("first_seen", "")[:10] or None  # garde YYYY-MM-DD
            last_change = row.get("last_change", "")[:10] or None

            entities.append({
                "uid":         f"EU-{row.get('id', i)}",
                "name":        name,
                "type":        entity_type,
                "programs":    [program],
                "aliases":     aliases,
                "nationalities": [country] if country else [],
                "listed_on":   first_seen,
                "last_change": last_change,
                "source_url":  "",
            })

    return entities


if __name__ == "__main__":
    import json
    entities = parse_eu()
    print(f"Total entités EU : {len(entities)}")
    # Répartition par programme
    from collections import Counter
    programs = Counter(e["programs"][0] for e in entities)
    for prog, count in programs.most_common():
        print(f"  {prog}: {count}")
    print("\nExemple :")
    print(json.dumps(entities[0], indent=2, ensure_ascii=False))