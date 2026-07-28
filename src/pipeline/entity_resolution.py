from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[2]))

from src.models.database import engine, Entity, EntityMatch
from sqlalchemy.orm import Session
from rapidfuzz import fuzz

def normalize(name: str) -> str:
    """Normalisation basique : minuscules, espaces propres."""
    return " ".join(name.lower().strip().split())

def find_candidates(threshold: float = 85.0) -> list[dict]:
    """
    Compare toutes les entités ONU contre OFAC
    et retourne les paires dont le score de similarité > threshold.
    """
    with Session(engine) as session:
        un_entities = session.query(Entity).filter_by(source="UN").all()
        ofac_entities = session.query(Entity).filter_by(source="OFAC").all()

        ofac_normalized = [
            (e, normalize(e.name)) for e in ofac_entities
        ]

        candidates = []
        for un_entity in un_entities:
            un_name = normalize(un_entity.name)

            best_score = 0
            best_match = None

            for ofac_entity, ofac_name in ofac_normalized:
                score = fuzz.token_sort_ratio(un_name, ofac_name)
                if score > best_score:
                    best_score = score
                    best_match = ofac_entity

            if best_score >= threshold and best_score < 100:
                candidates.append({
                    "un_id": un_entity.id,
                    "un_name": un_entity.name,
                    "ofac_id": best_match.id,
                    "ofac_name": best_match.name,
                    "score": best_score,
                    "type": un_entity.entity_type,
                })

        return sorted(candidates, key=lambda x: x["score"], reverse=True)


def save_candidates(candidates: list[dict]):
    with Session(engine) as session:
        session.query(EntityMatch).filter_by(method="fuzzy").delete()
        for c in candidates:
            session.add(EntityMatch(
                un_id=c["un_id"],
                ofac_id=c["ofac_id"],
                score=int(c["score"]),
                method="fuzzy",
            ))
        session.commit()
        print(f"{len(candidates)} matches sauvegardés.")


def main(threshold: float = 85.0, save: bool = True):
    print("Recherche de candidats... (peut prendre 30-60 secondes)")
    candidates = find_candidates(threshold=threshold)
    print(f"\n{len(candidates)} candidats trouvés (score > {threshold}) :\n")
    for c in candidates[:20]:
        print(f"[{c['score']:5.1f}] {c['un_name']!r:45} <-> {c['ofac_name']!r}")
    if save:
        save_candidates(candidates)


if __name__ == "__main__":
    main()