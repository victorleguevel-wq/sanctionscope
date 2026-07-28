import requests
import pandas as pd
from io import StringIO
from datetime import datetime, timedelta
import time
import logging

logger = logging.getLogger(__name__)

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

# Durée de vie du cache — les fichiers GDELT sont mis à jour toutes les 15 min,
# pas besoin de retélécharger plus souvent que ça.
CACHE_TTL_SECONDS = 15 * 60

# Cache en mémoire du fichier GDELT brut (partagé entre toutes les requêtes pays).
# Structure : {"df": DataFrame, "fetched_at": timestamp}
_raw_cache = {"df": None, "fetched_at": 0}

# Cache des résultats déjà filtrés par pays, pour éviter de refiltrer un
# DataFrame de plusieurs dizaines de milliers de lignes à chaque appel.
# Structure : {country_code: {"events": [...], "fetched_at": timestamp}}
_country_cache = {}


def _safe_float(value, default=None):
    """Convertit une valeur en float, retourne default si impossible."""
    try:
        f = float(value)
        return f if not pd.isna(f) else default
    except (TypeError, ValueError):
        return default


def _is_cache_valid(fetched_at: float) -> bool:
    return (time.time() - fetched_at) < CACHE_TTL_SECONDS


def _download_and_parse_gdelt() -> pd.DataFrame | None:
    """Télécharge et parse le dernier fichier GDELT. Peut lever une exception."""
    url = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt"
    response = requests.get(url, timeout=10)
    lines = response.text.strip().split("\n")

    csv_url = None
    for line in lines:
        if ".export.CSV.zip" in line:
            csv_url = line.split(" ")[-1].strip()
            break

    if not csv_url:
        return None

    r = requests.get(csv_url, timeout=30)

    import zipfile
    import io
    z = zipfile.ZipFile(io.BytesIO(r.content))
    csv_content = z.read(z.namelist()[0]).decode("latin-1")

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

    return pd.read_csv(StringIO(csv_content), sep="\t", header=None, names=cols, low_memory=False)


def _get_raw_dataframe() -> pd.DataFrame | None:
    """Renvoie le DataFrame GDELT, depuis le cache si encore valide."""
    if _raw_cache["df"] is not None and _is_cache_valid(_raw_cache["fetched_at"]):
        return _raw_cache["df"]

    try:
        df = _download_and_parse_gdelt()
        _raw_cache["df"] = df
        _raw_cache["fetched_at"] = time.time()
        # Un nouveau fichier brut invalide les résultats déjà filtrés par pays
        _country_cache.clear()
        return df
    except Exception as e:
        logger.error(f"Erreur téléchargement/parsing GDELT : {e}")
        # En cas d'échec, on retombe sur l'ancien cache s'il existe, même expiré,
        # plutôt que de renvoyer aucun résultat.
        return _raw_cache["df"]


def _build_events(df: pd.DataFrame, country_code: str) -> list[dict]:
    mask = (
        (df["Actor1CountryCode"] == country_code) |
        (df["Actor2CountryCode"] == country_code) |
        (df["ActionGeo_CountryCode"] == country_code)
    )
    filtered = df[mask].head(20)

    events = []
    for _, row in filtered.iterrows():
        event_code = str(row.get("EventCode", ""))[:3]

        lat = _safe_float(row.get("ActionGeo_Lat"))
        lon = _safe_float(row.get("ActionGeo_Long"))

        if lat is None or lon is None:
            lat = _safe_float(row.get("Actor1Geo_Lat"))
            lon = _safe_float(row.get("Actor1Geo_Long"))

        events.append({
            "date": str(row.get("SQLDATE", "")),
            "actor1": str(row.get("Actor1Name", "")),
            "actor2": str(row.get("Actor2Name", "")),
            "event_type": EVENT_CODES.get(event_code, f"Événement {event_code}"),
            "goldstein": _safe_float(row.get("GoldsteinScale"), default=0.0),
            "tone": _safe_float(row.get("AvgTone"), default=0.0),
            "location": str(row.get("ActionGeo_FullName", "")),
            "url": str(row.get("SOURCEURL", "")),
            "lat": lat,
            "lon": lon,
        })

    return events


def get_gdelt_events(country_keyword: str, days: int = 30) -> list[dict]:
    """Récupère les événements GDELT pour un pays donné, avec cache 15 min."""

    country_code = None
    for keyword, code in COUNTRY_CODES.items():
        if keyword in country_keyword.lower():
            country_code = code
            break

    if not country_code:
        return []

    cached = _country_cache.get(country_code)
    if cached and _is_cache_valid(cached["fetched_at"]):
        return cached["events"]

    df = _get_raw_dataframe()
    if df is None:
        return []

    try:
        events = _build_events(df, country_code)
        _country_cache[country_code] = {"events": events, "fetched_at": time.time()}
        return events
    except Exception as e:
        logger.error(f"Erreur filtrage GDELT pour {country_code} : {e}")
        return cached["events"] if cached else []


if __name__ == "__main__":
    events = get_gdelt_events("iran")
    print(f"{len(events)} événements trouvés")
    for e in events[:5]:
        print(e)