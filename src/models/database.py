from sqlalchemy import create_engine, Column, Integer, String, Date, Text, ForeignKey, ARRAY
from sqlalchemy.orm import declarative_base, relationship, Session

DATABASE_URL = "postgresql://localhost/sanctionscope"
engine = create_engine(DATABASE_URL)
Base = declarative_base()


class Entity(Base):
    __tablename__ = "entities"
    id          = Column(Integer, primary_key=True)
    uid         = Column(String, unique=True)        # UID source d'origine
    name        = Column(Text, nullable=False)
    entity_type = Column(String)                     # INDIVIDUAL / Entity / Vessel
    source      = Column(String)                     # OFAC, UN, EU...
    programs    = Column(ARRAY(String))              # RUSSIA, IRAN, CUBA...

    aliases     = relationship("Alias", back_populates="entity")
    sanctions   = relationship("Sanction", back_populates="entity")


class Alias(Base):
    __tablename__ = "aliases"
    id        = Column(Integer, primary_key=True)
    entity_id = Column(Integer, ForeignKey("entities.id"))
    alias     = Column(Text)
    alias_type = Column(String)                      # a.k.a., f.k.a...

    entity    = relationship("Entity", back_populates="aliases")


class Sanction(Base):
    __tablename__ = "sanctions"
    id         = Column(Integer, primary_key=True)
    entity_id  = Column(Integer, ForeignKey("entities.id"))
    source     = Column(String)
    program    = Column(String)
    listed_on  = Column(Date)
    reason     = Column(Text)

    entity     = relationship("Entity", back_populates="sanctions")

class EntityMatch(Base):
    __tablename__ = "entity_matches"
    id         = Column(Integer, primary_key=True)
    un_id      = Column(Integer, ForeignKey("entities.id"))
    ofac_id    = Column(Integer, ForeignKey("entities.id"))
    score      = Column(Integer)
    method     = Column(String)   # 'exact' ou 'fuzzy'

def init_db():
    Base.metadata.create_all(engine)
    print("Tables créées.")


if __name__ == "__main__":
    init_db()