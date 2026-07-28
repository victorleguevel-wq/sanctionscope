"""
vector_store.py
----------------
Stockage et recherche des chunks embeddes.

Deux implementations :

1. InMemoryVectorStore : tout en RAM, sauvegarde/chargee depuis un fichier
   .npz + .json. Suffisant pour prototyper et pour des corpus de quelques
   milliers de chunks (largement assez pour demarrer : quelques dizaines
   de resolutions ONU / decisions UE representent quelques milliers de
   chunks, pas plus).

2. PgVectorStore : la vraie implementation a utiliser en production dans
   SanctionScope. Elle reutilise la base PostgreSQL DEJA en place pour le
   reste du projet (Entity, Alias, Sanction...) plutot que d'ajouter un
   service de base de donnees vectorielle separe (Pinecone, Weaviate...).
   C'est coherent avec le principe de single source of truth deja applique
   ailleurs dans le projet (registre de sources, target_country resolu
   une seule fois) : une seule base a administrer et sauvegarder.

   Necessite l'extension PostgreSQL "pgvector" :
       CREATE EXTENSION IF NOT EXISTS vector;
   Voir schema.sql pour la definition complete de la table.
"""

from __future__ import annotations
from dataclasses import asdict
import json
import numpy as np

from chunking import Chunk
from embeddings import cosine_similarity


class InMemoryVectorStore:
    """Store vectoriel local, pour prototyper sans dependance a Postgres."""

    def __init__(self):
        self.chunks: list[Chunk] = []
        self.vectors: np.ndarray | None = None

    def add(self, chunks: list[Chunk], vectors: np.ndarray) -> None:
        assert len(chunks) == len(vectors), "chunks et vectors doivent avoir la meme longueur"
        self.chunks.extend(chunks)
        if self.vectors is None:
            self.vectors = vectors
        else:
            self.vectors = np.vstack([self.vectors, vectors])

    def search(self, query_vector: np.ndarray, top_k: int = 5) -> list[tuple[Chunk, float]]:
        """Retourne les top_k chunks les plus proches de query_vector,
        avec leur score de similarite cosinus (1 = identique, 0 = sans rapport)."""
        if self.vectors is None or len(self.chunks) == 0:
            return []
        scores = np.array([cosine_similarity(query_vector, v) for v in self.vectors])
        top_indices = np.argsort(-scores)[:top_k]
        return [(self.chunks[i], float(scores[i])) for i in top_indices]

    def save(self, path_prefix: str) -> None:
        np.save(f"{path_prefix}_vectors.npy", self.vectors)
        with open(f"{path_prefix}_chunks.json", "w", encoding="utf-8") as f:
            json.dump([asdict(c) for c in self.chunks], f, ensure_ascii=False)

    @classmethod
    def load(cls, path_prefix: str) -> "InMemoryVectorStore":
        store = cls()
        store.vectors = np.load(f"{path_prefix}_vectors.npy")
        with open(f"{path_prefix}_chunks.json", encoding="utf-8") as f:
            raw_chunks = json.load(f)
        store.chunks = [Chunk(**c) for c in raw_chunks]
        return store


class PgVectorStore:
    """
    Implementation de production, sur la base PostgreSQL existante de
    SanctionScope. Non testable dans cet environnement (pas de serveur
    Postgres disponible ici) mais directement utilisable dans ton projet:
    il te suffit de fournir une connexion SQLAlchemy existante (le meme
    `engine` que celui deja utilise dans src/models/database.py).

    Voir schema.sql pour la table `document_chunks` correspondante.
    """

    def __init__(self, engine):
        self.engine = engine  # sqlalchemy.Engine, reutilise depuis database.py

    def add(self, chunks: list[Chunk], vectors: np.ndarray) -> None:
        from sqlalchemy import text

        with self.engine.begin() as conn:
            for chunk, vector in zip(chunks, vectors):
                conn.execute(
                    text(
                        """
                        INSERT INTO document_chunks
                            (chunk_id, doc_id, doc_title, source_type,
                             page_number, content, embedding)
                        VALUES
                            (:chunk_id, :doc_id, :doc_title, :source_type,
                             :page_number, :content, :embedding)
                        ON CONFLICT (chunk_id) DO UPDATE SET
                            content = EXCLUDED.content,
                            embedding = EXCLUDED.embedding
                        """
                    ),
                    {
                        "chunk_id": chunk.chunk_id,
                        "doc_id": chunk.doc_id,
                        "doc_title": chunk.doc_title,
                        "source_type": chunk.source_type,
                        "page_number": chunk.page_number,
                        "content": chunk.text,
                        "embedding": vector.tolist(),
                    },
                )

    def search(self, query_vector: np.ndarray, top_k: int = 5, source_type: str | None = None):
        """
        Recherche par distance cosinus via l'operateur pgvector `<=>`.
        Filtrage optionnel par source_type (ex: ne chercher que dans "un").
        """
        from sqlalchemy import text

        filter_clause = "WHERE source_type = :source_type" if source_type else ""
        query = f"""
            SELECT chunk_id, doc_id, doc_title, source_type, page_number, content,
                   1 - (embedding <=> :query_vector) AS similarity
            FROM document_chunks
            {filter_clause}
            ORDER BY embedding <=> :query_vector
            LIMIT :top_k
        """
        params = {"query_vector": query_vector.tolist(), "top_k": top_k}
        if source_type:
            params["source_type"] = source_type

        with self.engine.connect() as conn:
            rows = conn.execute(text(query), params).mappings().all()
        return rows