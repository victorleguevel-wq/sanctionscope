"""
embeddings.py
-------------
Abstraction pour transformer un texte en vecteur numerique (embedding).

Deux implementations :

1. VoyageEmbeddings : la vraie implementation a utiliser en production.
   Voyage AI est le fournisseur d'embeddings recommande par Anthropic
   (complementaire a l'API Claude, qui ne fait pas d'embeddings elle-meme).
   Necessite une cle API (VOYAGE_API_KEY) et un acces reseau -- non
   testable dans cet environnement bac a sable, mais c'est le code a
   utiliser tel quel dans ton projet SanctionScope.

2. LocalTfidfEmbeddings : une implementation 100% locale, sans reseau ni
   cle API, basee sur TF-IDF (scikit-learn) plutot que sur un vrai modele
   de langage. Elle ne capture PAS le sens semantique (elle ne saurait pas
   que "Rosatom" est lie a "nucleaire russe" si le mot n'apparait pas
   litteralement) -- mais elle respecte exactement la meme interface, ce
   qui permet de tester tout le pipeline (chunking -> index -> recherche)
   sans dependance externe. A remplacer par VoyageEmbeddings des que tu
   as une cle API et un acces reseau.

Le reste du pipeline (vector_store.py, ask_enriched.py) ne depend jamais
d'une implementation precise : il appelle seulement `.embed(texts)`,
ce qui permet de changer de fournisseur sans toucher au reste du code.
"""

from __future__ import annotations
from typing import Protocol
import numpy as np


class EmbeddingProvider(Protocol):
    def embed(self, texts: list[str]) -> np.ndarray:
        """Retourne un tableau numpy de forme (len(texts), dimension)."""
        ...


class VoyageEmbeddings:
    """
    Implementation de production, via l'API Voyage AI.

    pip install voyageai
    export VOYAGE_API_KEY=...

    Modele recommande pour du texte general multilingue : voyage-3.
    """

    def __init__(self, model: str = "voyage-3"):
        import voyageai  # import local : evite la dependance si non utilisee

        self.client = voyageai.Client()  # lit VOYAGE_API_KEY dans l'env
        self.model = model

    def embed(self, texts: list[str]) -> np.ndarray:
        # input_type="document" pour l'indexation, "query" pour la recherche
        # -- voir embed_query() ci-dessous pour la distinction.
        result = self.client.embed(texts, model=self.model, input_type="document")
        return np.array(result.embeddings)

    def embed_query(self, text: str) -> np.ndarray:
        result = self.client.embed([text], model=self.model, input_type="query")
        return np.array(result.embeddings)[0]


class LocalTfidfEmbeddings:
    """
    Implementation locale, sans reseau, pour developper et tester le
    pipeline de bout en bout dans un environnement sans acces a une API
    d'embeddings. Le vectorizer doit etre "fit" sur l'ensemble des chunks
    avant de pouvoir embedder une nouvelle requete (limite normale du
    TF-IDF, contrairement a un vrai modele d'embeddings qui est pre-entraine
    une fois pour toutes).
    """

    def __init__(self, max_features: int = 4096):
        from sklearn.feature_extraction.text import TfidfVectorizer

        self.vectorizer = TfidfVectorizer(max_features=max_features)
        self._fitted = False

    def fit(self, texts: list[str]) -> None:
        self.vectorizer.fit(texts)
        self._fitted = True

    def embed(self, texts: list[str]) -> np.ndarray:
        if not self._fitted:
            self.fit(texts)
        return self.vectorizer.transform(texts).toarray()

    def embed_query(self, text: str) -> np.ndarray:
        if not self._fitted:
            raise RuntimeError(
                "LocalTfidfEmbeddings doit etre 'fit' sur le corpus avant "
                "d'embedder une requete (appeler .embed() sur les chunks d'abord)."
            )
        return self.vectorizer.transform([text]).toarray()[0]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)