"""
Registre central des sources de sanctions.
Pour ajouter une nouvelle source (ex: OFSI) : ajoute une entrée ici,
crée le parser correspondant dans src/parsers/, et un load_X.py dans
src/pipeline/. Rien d'autre à toucher ailleurs.
"""

SOURCES = {
    "OFAC": {
        "label": "États-Unis (OFAC)",
        "color": "#ef4444",
    },
    "UN": {
        "label": "Nations Unies",
        "color": "#3b82f6",
    },
    "EU": {
        "label": "Union Européenne",
        "color": "#22c55e",
    },
    "CN": {
        "label": "Chine",
        "color": "#f59e0b",
    },
}

def get_sources_payload():
    """Format prêt à consommer par le frontend."""
    return [
        {"key": key, "label": v["label"], "color": v["color"]}
        for key, v in SOURCES.items()
    ]