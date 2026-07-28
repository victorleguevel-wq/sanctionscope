"""
ask_enriched.py
---------------
Version enrichie du module d'analyse libre (/ask) de SanctionScope.

Par rapport a la version actuelle (question -> contexte GDELT -> Claude),
cette version ajoute trois choses discutees :

1. Recherche vectorielle (RAG) dans les documents officiels ingeres
   (resolutions ONU, decisions UE...) en plus des donnees GDELT.
2. Un prompt qui force Claude a distinguer explicitement ce qui vient
   d'un document source (traçable, verifiable) de ce qui vient de sa
   connaissance generale (a verifier par l'utilisateur).
3. Une sortie structuree (JSON) plutot qu'un texte libre, pour que le
   frontend puisse afficher des sections distinctes (resume, sanctions,
   chronologie, sources, niveau de confiance).

Ce fichier est un prototype autonome, pensable comme un remplacement de
la fonction actuelle du endpoint /ask dans src/api/main.py. Il ne modifie
pas le reste de l'API.
"""

from __future__ import annotations
import json
import os

from embeddings import LocalTfidfEmbeddings, VoyageEmbeddings
from vector_store import InMemoryVectorStore


SYSTEM_PROMPT = """Tu es un assistant d'analyse geopolitique specialise dans les
sanctions internationales, integre a la plateforme SanctionScope.

Regles importantes :
1. Tu recois deux types de contexte : des EXTRAITS DE DOCUMENTS OFFICIELS
   (resolutions ONU, decisions UE) et des DONNEES DE LA BASE SanctionScope
   (comptages, programmes de sanction). Toute affirmation qui s'appuie sur
   l'un de ces contextes doit etre marquee [source: document] ou
   [source: base SanctionScope] selon le cas.
2. Si tu completes ta reponse avec ta connaissance generale (non presente
   dans le contexte fourni), tu dois le marquer explicitement
   [source: connaissance generale, a verifier].
3. Ne fabrique jamais de chiffre precis (nombre de sanctions, date) qui ne
   figure pas dans le contexte fourni -- dans ce cas, dis que l'information
   n'est pas disponible dans les donnees actuelles plutot que d'inventer.
4. Reponds UNIQUEMENT en JSON valide, selon le schema suivant, sans texte
   avant ou apres :

{
  "resume_executif": "...",
  "sanctions_concernees": ["..."],
  "chronologie": [{"date": "...", "evenement": "...", "source": "..."}],
  "sources_utilisees": [{"titre": "...", "type": "document|base|connaissance_generale"}],
  "niveau_de_confiance": "eleve|moyen|faible",
  "limites": "..."
}
"""


def retrieve_document_context(question: str, store: InMemoryVectorStore, embedder, top_k: int = 4) -> list[dict]:
    """Recherche les chunks de documents les plus pertinents pour la question."""
    query_vector = embedder.embed_query(question)
    results = store.search(query_vector, top_k=top_k)
    return [
        {
            "doc_title": chunk.doc_title,
            "source_type": chunk.source_type,
            "page": chunk.page_number,
            "text": chunk.text,
            "similarity": round(score, 3),
        }
        for chunk, score in results
    ]


def build_sql_context_stub(question: str) -> str:
    """
    Represente l'etape "contexte SQL" discutee precedemment (requeter
    Entity/Sanction pour le pays mentionne dans la question). Ici en stub
    -- a brancher sur la vraie session SQLAlchemy du projet.
    """
    # Exemple de ce que ferait la vraie version :
    #   country = extract_country(question)
    #   count = session.query(Entity).filter(Entity.target_country == country).count()
    #   return f"Nombre d'entites sanctionnees pour {country} : {count}"
    return "(contexte base SanctionScope non branche dans ce prototype)"


def build_prompt(question: str, document_context: list[dict], sql_context: str) -> str:
    doc_context_str = "\n\n".join(
        f"[Document: {d['doc_title']} ({d['source_type']}), page {d['page']}, "
        f"similarite={d['similarity']}]\n{d['text']}"
        for d in document_context
    )
    return f"""Question de l'utilisateur : {question}

--- EXTRAITS DE DOCUMENTS OFFICIELS (recherche semantique) ---
{doc_context_str or "(aucun document pertinent trouve dans l'index)"}

--- DONNEES DE LA BASE SanctionScope ---
{sql_context}

Reponds selon les regles et le format JSON specifies dans le systeme."""


def call_claude(system_prompt: str, user_prompt: str, model: str = "claude-sonnet-4-6") -> dict:
    """
    Appelle l'API Anthropic. Necessite ANTHROPIC_API_KEY dans l'environnement.
    Non execute dans cette demo (pas de cle API dans ce bac a sable) --
    fonction montree telle qu'elle serait utilisee en production.
    """
    import anthropic

    client = anthropic.Anthropic()  # lit ANTHROPIC_API_KEY dans l'env
    response = client.messages.create(
        model=model,
        max_tokens=1500,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    raw_text = response.content[0].text
    # Le modele est instruit de repondre en JSON pur ; on nettoie par
    # securite au cas ou il ajoute des balises markdown malgre tout.
    cleaned = raw_text.replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned)


def ask(question: str, store: InMemoryVectorStore, embedder) -> dict:
    """Point d'entree complet : retrieval + prompt + appel Claude."""
    document_context = retrieve_document_context(question, store, embedder)
    sql_context = build_sql_context_stub(question)
    prompt = build_prompt(question, document_context, sql_context)

    print("=" * 70)
    print("PROMPT ENVOYE A CLAUDE (apercu) :")
    print("=" * 70)
    print(prompt[:1200], "..." if len(prompt) > 1200 else "")
    print("=" * 70)

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("\n[ANTHROPIC_API_KEY absente -- appel reel non effectue dans cette demo]")
        return {
            "resume_executif": "(demo hors-ligne : pas d'appel Claude reel)",
            "sanctions_concernees": [],
            "chronologie": [],
            "sources_utilisees": [
                {"titre": d["doc_title"], "type": "document"} for d in document_context
            ],
            "niveau_de_confiance": "n/a",
            "limites": "Prototype execute sans cle API -- voir document_context ci-dessus pour verifier que le retrieval fonctionne.",
            "_debug_document_context": document_context,
        }

    return call_claude(SYSTEM_PROMPT, prompt)


if __name__ == "__main__":
    import pickle

    # Charge l'index construit par ingest.py (mode local)
    store = InMemoryVectorStore.load("./index_demo")
    with open("./index_demo_vectorizer.pkl", "rb") as f:
        vectorizer = pickle.load(f)

    embedder = LocalTfidfEmbeddings()
    embedder.vectorizer = vectorizer
    embedder._fitted = True

    question = "Pourquoi l'Iran a-t-il ete sanctionne et comment la levee des sanctions a-t-elle ete organisee ?"
    result = ask(question, store, embedder)

    print("\nREPONSE (structuree) :")
    print(json.dumps(result, ensure_ascii=False, indent=2))