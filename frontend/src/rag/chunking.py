"""
chunking.py
-----------
Extraction de texte depuis des PDF (ou fichiers texte bruts) et decoupage
en "chunks" (morceaux) adaptes a l'indexation vectorielle.

Pourquoi decouper en chunks plutot que d'indexer le document entier ?
- Un embedding represente le sens d'un texte dans un seul vecteur. Plus le
  texte est long, plus ce vecteur devient une moyenne floue de plusieurs
  sujets, et moins la recherche par similarite est precise.
- On veut retrouver le PASSAGE pertinent (ex: le paragraphe qui mentionne
  Rosatom dans une resolution de 40 pages), pas juste "le document entier
  parle du nucleaire".

Strategie retenue : decoupage par nombre de mots avec chevauchement
(overlap). Le chevauchement evite qu'une phrase importante soit coupee en
deux au moment ou l'information utile se trouve juste a la frontiere entre
deux chunks.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path
import re


@dataclass
class Chunk:
    """Un morceau de document, pret a etre embedde et indexe."""
    chunk_id: str          # identifiant unique, ex: "un_res_2231:chunk_3"
    doc_id: str            # identifiant du document source
    doc_title: str         # titre lisible, pour l'affichage / citation
    source_type: str       # "un" | "eu" | "ofac" | "report" | ... (libre)
    text: str              # contenu textuel du chunk
    page_number: int | None = None
    metadata: dict = field(default_factory=dict)


def extract_text_from_pdf(pdf_path: str) -> list[tuple[int, str]]:
    """
    Extrait le texte d'un PDF, page par page.
    Retourne une liste de tuples (numero_page, texte).

    Utilise pypdf (cf. skill pdf-reading) : suffisant pour des documents
    text-heavy comme des resolutions ONU ou des decisions PESC de l'UE.
    Pour des PDF scannes (sans couche texte), il faudrait passer par de
    l'OCR (pytesseract) -- non couvert ici, mais signale car ca arrive
    souvent avec de vieux documents diplomatiques numerises.
    """
    from pypdf import PdfReader

    reader = PdfReader(pdf_path)
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        if text.strip():
            pages.append((i, text))
    return pages


def clean_text(text: str) -> str:
    """Nettoyage leger : espaces multiples, sauts de ligne parasites."""
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def chunk_text(
    text: str,
    chunk_size_words: int = 220,
    overlap_words: int = 40,
) -> list[str]:
    """
    Decoupe un texte en chunks de ~chunk_size_words mots, avec un
    chevauchement de overlap_words mots entre chunks consecutifs.

    220 mots ~ 300 tokens, une taille qui reste precise (peu de sujets
    melanges) tout en gardant assez de contexte pour qu'un embedding
    capture correctement le sens du passage.
    """
    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0
    step = max(chunk_size_words - overlap_words, 1)
    while start < len(words):
        chunk_words = words[start : start + chunk_size_words]
        chunks.append(" ".join(chunk_words))
        if start + chunk_size_words >= len(words):
            break
        start += step
    return chunks


def build_chunks_from_pdf(
    pdf_path: str,
    doc_id: str,
    doc_title: str,
    source_type: str,
    extra_metadata: dict | None = None,
) -> list[Chunk]:
    """Pipeline complet : PDF -> pages -> texte nettoye -> chunks."""
    pages = extract_text_from_pdf(pdf_path)
    chunks: list[Chunk] = []
    chunk_index = 0
    for page_number, raw_text in pages:
        cleaned = clean_text(raw_text)
        for piece in chunk_text(cleaned):
            chunks.append(
                Chunk(
                    chunk_id=f"{doc_id}:chunk_{chunk_index}",
                    doc_id=doc_id,
                    doc_title=doc_title,
                    source_type=source_type,
                    text=piece,
                    page_number=page_number,
                    metadata=extra_metadata or {},
                )
            )
            chunk_index += 1
    return chunks


def build_chunks_from_text_file(
    txt_path: str,
    doc_id: str,
    doc_title: str,
    source_type: str,
    extra_metadata: dict | None = None,
) -> list[Chunk]:
    """
    Meme pipeline que build_chunks_from_pdf, mais pour un fichier texte
    brut (utile en attendant d'avoir de vrais PDF, ou pour des documents
    deja convertis en .txt).
    """
    raw_text = Path(txt_path).read_text(encoding="utf-8")
    cleaned = clean_text(raw_text)
    chunks: list[Chunk] = []
    for i, piece in enumerate(chunk_text(cleaned)):
        chunks.append(
            Chunk(
                chunk_id=f"{doc_id}:chunk_{i}",
                doc_id=doc_id,
                doc_title=doc_title,
                source_type=source_type,
                text=piece,
                page_number=None,
                metadata=extra_metadata or {},
            )
        )
    return chunks