import xml.etree.ElementTree as ET
from pathlib import Path

RAW_DATA = Path(__file__).parents[2] / "data" / "raw"

# Mapping noms de pays ONU → ISO-2
COUNTRY_TO_ISO2 = {
    "Afghan": "AF", "Afghanistan": "AF",
    "Albanian": "AL", "Algeria": "DZ", "Algerian": "DZ",
    "Angolan": "AO", "Armenian": "AM",
    "Bahraini": "BH", "Bangladeshi": "BD",
    "Belarusian": "BY", "Belarus": "BY",
    "Belgian": "BE", "Bolivian": "BO",
    "Bosnian": "BA", "Brazilian": "BR",
    "Bulgarian": "BG", "Burkinabe": "BF",
    "Burundian": "BI", "Burundi": "BI",
    "Cambodian": "KH", "Cameroonian": "CM",
    "Canadian": "CA", "Central African": "CF",
    "Central African Republic": "CF",
    "Chadian": "TD", "Chilean": "CL",
    "Chinese": "CN", "China": "CN",
    "Colombian": "CO", "Congolese": "CD",
    "Democratic Republic of the Congo": "CD",
    "Republic of the Congo": "CG",
    "Costa Rican": "CR", "Croatian": "HR",
    "Cuban": "CU", "Cuba": "CU",
    "Cypriot": "CY", "Czech": "CZ",
    "Danish": "DK", "Djiboutian": "DJ",
    "Dominican": "DO", "Ecuadorian": "EC",
    "Egyptian": "EG", "Egypt": "EG",
    "Eritrean": "ER", "Ethiopian": "ET",
    "Ethiopia": "ET",
    "Finnish": "FI", "French": "FR",
    "Gambian": "GM", "Georgian": "GE",
    "German": "DE", "Ghanaian": "GH",
    "Greek": "GR", "Guatemalan": "GT",
    "Guinean": "GN", "Guinea": "GN",
    "Guinea-Bissau": "GW",
    "Haitian": "HT", "Haiti": "HT",
    "Honduran": "HN", "Hungarian": "HU",
    "Indian": "IN", "Indonesia": "ID", "Indonesian": "ID",
    "Iranian": "IR", "Iran": "IR",
    "Iraqi": "IQ", "Iraq": "IQ",
    "Israeli": "IL", "Italian": "IT",
    "Ivorian": "CI", "Ivory Coast": "CI",
    "Jamaican": "JM", "Japanese": "JP",
    "Jordanian": "JO", "Kazakh": "KZ",
    "Kenyan": "KE", "North Korean": "KP",
    "Korean": "KP", "DPRK": "KP",
    "Kosovar": "XK", "Kuwaiti": "KW",
    "Kyrgyz": "KG", "Lao": "LA",
    "Lebanese": "LB", "Liberian": "LR",
    "Libyan": "LY", "Libya": "LY",
    "Lithuanian": "LT", "Macedonian": "MK",
    "Malawian": "MW", "Malaysian": "MY",
    "Malian": "ML", "Mali": "ML",
    "Mauritanian": "MR", "Mexican": "MX",
    "Moldovan": "MD", "Mongolian": "MN",
    "Montenegrin": "ME", "Moroccan": "MA",
    "Mozambican": "MZ", "Myanmar": "MM",
    "Namibian": "NA", "Nepali": "NP",
    "Dutch": "NL", "New Zealand": "NZ",
    "Nicaraguan": "NI", "Nigerian": "NG",
    "Norwegian": "NO", "Pakistani": "PK",
    "Palestinian": "PS", "Panamanian": "PA",
    "Paraguayan": "PY", "Peruvian": "PE",
    "Filipino": "PH", "Polish": "PL",
    "Portuguese": "PT", "Qatari": "QA",
    "Romanian": "RO", "Russian": "RU",
    "Russia": "RU",
    "Rwandan": "RW", "Rwanda": "RW",
    "Saudi": "SA", "Saudi Arabian": "SA",
    "Senegalese": "SN", "Serbian": "RS",
    "Sierra Leonean": "SL", "Singaporean": "SG",
    "Somali": "SO", "Somalian": "SO", "Somalia": "SO",
    "South African": "ZA", "South Sudanese": "SS",
    "South Sudan": "SS",
    "Spanish": "ES", "Sri Lankan": "LK",
    "Sudanese": "SD", "Sudan": "SD",
    "Swedish": "SE", "Swiss": "CH",
    "Syrian": "SY", "Syria": "SY",
    "Taiwanese": "TW", "Tajik": "TJ",
    "Tanzanian": "TZ", "Thai": "TH",
    "Togolese": "TG", "Tunisian": "TN",
    "Turkish": "TR", "Turkmen": "TM",
    "Ugandan": "UG", "Ukrainian": "UA",
    "Emirati": "AE", "UAE": "AE",
    "United Arab Emirates": "AE",
    "British": "GB", "United Kingdom": "GB",
    "American": "US", "United States": "US",
    "Uzbek": "UZ", "Venezuelan": "VE",
    "Venezuela": "VE",
    "Vietnamese": "VN", "Yemeni": "YE",
    "Yemen": "YE",
    "Zambian": "ZM", "Zimbabwean": "ZW",
    "Zimbabwe": "ZW",
}

def nationality_to_iso2(nat: str) -> str | None:
    if not nat:
        return None
    # Essai direct
    iso = COUNTRY_TO_ISO2.get(nat.strip())
    if iso:
        return iso
    # Essai sur le premier mot (ex: "Democratic Republic..." → pas utile, mais "Russian Federation" → "Russian")
    first_word = nat.strip().split()[0]
    return COUNTRY_TO_ISO2.get(first_word)


def parse_un(filepath: Path = RAW_DATA / "consolidated.xml") -> list[dict]:
    tree = ET.parse(filepath)
    root = tree.getroot()
    entities = []

    for individual in root.findall(".//INDIVIDUAL"):
        uid = individual.findtext("DATAID")
        first_name  = individual.findtext("FIRST_NAME")  or ""
        second_name = individual.findtext("SECOND_NAME") or ""
        third_name  = individual.findtext("THIRD_NAME")  or ""
        name = " ".join(filter(None, [first_name, second_name, third_name])).strip()

        nat_raw = individual.findtext(".//NATIONALITY/VALUE") or ""
        iso2 = nationality_to_iso2(nat_raw)
        un_list_type = individual.findtext("UN_LIST_TYPE") or "UN"

        aliases = []
        for aka in individual.findall(".//INDIVIDUAL_ALIAS"):
            aka_name = " ".join(filter(None, [
                aka.findtext("FIRST_NAME")  or "",
                aka.findtext("SECOND_NAME") or "",
                aka.findtext("THIRD_NAME")  or "",
            ])).strip()
            if aka_name:
                aliases.append({"name": aka_name, "type": "a.k.a."})

        entities.append({
            "uid": f"UN-{uid}",
            "name": name,
            "type": "Individual",
            "programs": [un_list_type.upper()],
            "aliases": aliases,
            "nationalities": [iso2] if iso2 else [],
        })

    for entity in root.findall(".//ENTITY"):
        uid  = entity.findtext("DATAID")
        name = entity.findtext("FIRST_NAME") or ""
        un_list_type = entity.findtext("UN_LIST_TYPE") or "UN"

        aliases = []
        for aka in entity.findall(".//ENTITY_ALIAS"):
            aka_name = aka.findtext("ALIAS_NAME") or ""
            if aka_name:
                aliases.append({"name": aka_name, "type": "a.k.a."})

        entities.append({
            "uid": f"UN-{uid}",
            "name": name,
            "type": "Entity",
            "programs": [un_list_type.upper()],
            "aliases": aliases,
            "nationalities": [],
        })

    return entities


if __name__ == "__main__":
    entities = parse_un()
    print(f"Total entités ONU : {len(entities)}")
    with_nat = [e for e in entities if e["nationalities"]]
    print(f"Avec nationalité : {len(with_nat)}")
    import json
    print(json.dumps(entities[0], indent=2, ensure_ascii=False))