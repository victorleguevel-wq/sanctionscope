"""Ajoute la colonne target_country si elle n'existe pas encore."""
from sqlalchemy import text
from src.models.database import engine

with engine.begin() as conn:
    conn.execute(text("""
        ALTER TABLE entities
        ADD COLUMN IF NOT EXISTS target_country VARCHAR
    """))
    conn.execute(text("""
        CREATE INDEX IF NOT EXISTS ix_entities_target_country
        ON entities (target_country)
    """))
    print("Colonne target_country ajoutée.")
