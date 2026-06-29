import requests
import pandas as pd
from io import StringIO
from datetime import datetime, timedelta

COUNTRY_CODES = {
    "iran": "IR",
    "iranien": "IR",
    "iranienne": "IR",
    "russia": "RS",
    "russie": "RS",
    "russe": "RS",
    "corée": "KN",
    "ukraine": "UP",
    "chine": "CH",
    "china": "CH",
    "syrie": "SY",
    "venezuela": "VE",
    "cuba": "CU",
}

EVENT_CODES = {
    "010": "Déclaration diplomatique",
    "020": "Appel à la coopération",
    "030": "Approbation",
    "040": "Consultation",
    "050": "Aide humanitaire",
    "060": "Coopération",
    "070": "Fourniture d'aide",
    "080": "Coopération diplomatique",
    "090": "Consultation médicale",
    "100": "Demande",
    "110": "Désapprobation",
    "120": "Rejet",
    "130": "Menace",
    "140": "Protestation",
    "150": "Exhiber la force",
    "160": "Réduction des relations",
    "170": "Coercition",
    "180": "Attaque",
    "190": "Utilisation de la force inconventionnelle",
    "200": "Conflit armé massif",
}

def get_gdelt_events(country_keyword: str, days: int = 30) -> list[dict]:
    """Récupère les événements GDELT pour un pays donné."""

    country_code = None
    for keyword, code in COUNTRY_CODES.items():
        if keyword in country_keyword.lower():
            country_code = code
            break

    if not country_code:
        return []

    try:
        # GDELT 2.0 Events — derniers fichiers disponibles
        url = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt"
        response = requests.get(url, timeout=10)
        lines = response.text.strip().split("\n")

        csv_url = None
        for line in lines:
            if ".export.CSV.zip" in line:
                csv_url = line.split(" ")[-1].strip()
                break

        if not csv_url:
            return []

        # Télécharge et parse le CSV
        r = requests.get(csv_url, timeout=30)

        import zipfile
        import io
        z = zipfile.ZipFile(io.BytesIO(r.content))
        csv_content = z.read(z.namelist()[0]).decode("latin-1")

        # Colonnes GDELT
        cols = [
            "GLOBALEVENTID", "SQLDATE", "MonthYear", "Year", "FractionDate",
            "Actor1Code", "Actor1Name", "Actor1CountryCode", "Actor1KnownGroupCode",
            "Actor1EthnicCode", "Actor1Religion1Code", "Actor1Religion2Code",
            "Actor1Type1Code", "Actor1Type2Code", "Actor1Type3Code",
            "Actor2Code", "Actor2Name", "Actor2CountryCode", "Actor2KnownGroupCode",
            "Actor2EthnicCode", "Actor2Religion1Code", "Actor2Religion2Code",
            "Actor2Type1Code", "Actor2Type2Code", "Actor2Type3Code",
            "IsRootEvent", "EventCode", "EventBaseCode", "EventRootCode",
            "QuadClass", "GoldsteinScale", "NumMentions", "NumSources",
            "NumArticles", "AvgTone", "Actor1Geo_Type", "Actor1Geo_FullName",
            "Actor1Geo_CountryCode", "Actor1Geo_ADM1Code", "Actor1Geo_ADM2Code",
            "Actor1Geo_Lat", "Actor1Geo_Long", "Actor1Geo_FeatureID",
            "Actor2Geo_Type", "Actor2Geo_FullName", "Actor2Geo_CountryCode",
            "Actor2Geo_ADM1Code", "Actor2Geo_ADM2Code", "Actor2Geo_Lat",
            "Actor2Geo_Long", "Actor2Geo_FeatureID", "ActionGeo_Type",
            "ActionGeo_FullName", "ActionGeo_CountryCode", "ActionGeo_ADM1Code",
            "ActionGeo_ADM2Code", "ActionGeo_Lat", "ActionGeo_Long",
            "ActionGeo_FeatureID", "DATEADDED", "SOURCEURL"
        ]

        df = pd.read_csv(StringIO(csv_content), sep="\t", header=None, names=cols, low_memory=False)

        # Filtre par pays
        mask = (
            (df["Actor1CountryCode"] == country_code) |
            (df["Actor2CountryCode"] == country_code) |
            (df["ActionGeo_CountryCode"] == country_code)
        )
        filtered = df[mask].head(20)

        events = []
        for _, row in filtered.iterrows():
            event_code = str(row.get("EventCode", ""))[:3]
            events.append({
                "date": str(row.get("SQLDATE", "")),
                "actor1": str(row.get("Actor1Name", "")),
                "actor2": str(row.get("Actor2Name", "")),
                "event_type": EVENT_CODES.get(event_code, f"Événement {event_code}"),
                "goldstein": float(row.get("GoldsteinScale", 0)),
                "tone": float(row.get("AvgTone", 0)),
                "location": str(row.get("ActionGeo_FullName", "")),
                "url": str(row.get("SOURCEURL", "")),
            })

        return events

    except Exception as e:
        print(f"Erreur GDELT : {e}")
        return []


if __name__ == "__main__":
    events = get_gdelt_events("iran")
    print(f"{len(events)} événements trouvés")
    for e in events[:5]:
        print(e)