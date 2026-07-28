"""
Point d'entrée unique du pipeline : charge toutes les sources,
puis résout les pays cibles.

Usage : python -m src.pipeline.run_all
"""
from src.pipeline.ingest.load_ofac import load_ofac
from src.pipeline.ingest.load_un import load_un
from src.pipeline.ingest.load_eu import load_eu
from src.pipeline.ingest.load_china import load_china
from src.pipeline.resolve_target_country import main as resolve_target_country


def run_all():
    print("=== 1/2 — Ingestion des sources ===")
    load_ofac()
    load_un()
    load_eu()
    load_china()

    print("\n=== 2/2 — Résolution des pays cibles ===")
    resolve_target_country()

    print("\n✅ Pipeline complet terminé.")


if __name__ == "__main__":
    run_all()