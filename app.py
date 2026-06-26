import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import streamlit as st
from sqlalchemy.orm import Session
from src.models.database import engine, Entity, EntityMatch

st.set_page_config(page_title="SanctionScope", page_icon="🌐", layout="wide")

st.title("🌐 SanctionScope")
st.caption("Plateforme d'analyse des sanctions internationales — OFAC · ONU")

# --- Sidebar ---
with st.sidebar:
    st.header("Filtres")
    source_filter = st.multiselect(
        "Source", ["OFAC", "UN"], default=["OFAC", "UN"]
    )
    type_filter = st.multiselect(
        "Type", ["Individual", "Entity", "Vessel", "Aircraft"],
        default=["Individual", "Entity"]
    )
    search = st.text_input("🔍 Rechercher une entité")

# --- Onglets ---
tab1, tab2, tab3 = st.tabs(["Entités", "Matches inter-sources", "Statistiques"])

with tab1:
    st.subheader("Entités sanctionnées")
    with Session(engine) as session:
        query = session.query(Entity)
        if source_filter:
            query = query.filter(Entity.source.in_(source_filter))
        if type_filter:
            query = query.filter(Entity.entity_type.in_(type_filter))
        if search:
            query = query.filter(Entity.name.ilike(f"%{search}%"))

        total = query.count()
        entities = query.limit(200).all()

    st.metric("Entités trouvées", total)

    data = [{
        "Nom": e.name,
        "Type": e.entity_type,
        "Source": e.source,
        "Programmes": ", ".join(e.programs or []),
    } for e in entities]

    st.dataframe(data, use_container_width=True, height=500)

with tab2:
    st.subheader("Entités identifiées dans plusieurs sources")
    st.caption("Matched par fuzzy matching (score > 85) — même entité, orthographes différentes")

    with Session(engine) as session:
        matches = (
            session.query(EntityMatch, Entity, Entity)
            .join(Entity, EntityMatch.un_id == Entity.id)
            .filter(EntityMatch.method == "fuzzy")
            .order_by(EntityMatch.score.desc())
            .all()
        )

        data = []
        for match, un_entity, _ in matches:
            ofac_entity = session.get(Entity, match.ofac_id)
            data.append({
                "Nom ONU": un_entity.name,
                "Nom OFAC": ofac_entity.name if ofac_entity else "?",
                "Score": match.score,
                "Type": un_entity.entity_type,
            })

    st.metric("Matches détectés", len(data))
    st.dataframe(data, use_container_width=True, height=500)

with tab3:
    st.subheader("Vue d'ensemble")

    with Session(engine) as session:
        total_ofac = session.query(Entity).filter_by(source="OFAC").count()
        total_un = session.query(Entity).filter_by(source="UN").count()
        total_matches = session.query(EntityMatch).count()

    col1, col2, col3 = st.columns(3)
    col1.metric("Entités OFAC", f"{total_ofac:,}")
    col2.metric("Entités ONU", f"{total_un:,}")
    col3.metric("Matches inter-sources", total_matches)

    st.divider()
    st.markdown("### À propos")
    st.markdown("""
    **SanctionScope** agrège et relie les listes de sanctions internationales
    pour révéler les divergences entre juridictions.

    Sources actuelles : **OFAC** (US Treasury) · **ONU** (liste consolidée)
    Prochainement : **UE** · **OFSI** (UK)
    """)