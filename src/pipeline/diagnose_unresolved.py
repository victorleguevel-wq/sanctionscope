"""Liste les programmes les plus fréquents parmi les entités sans target_country."""
from collections import Counter
from sqlalchemy.orm import Session
from src.models.database import engine, Entity

with Session(engine) as session:
    entities = session.query(Entity).filter(Entity.target_country.is_(None)).all()

counter = Counter()
no_program_count = 0

for e in entities:
    if not e.programs:
        no_program_count += 1
        continue
    for prog in e.programs:
        counter[prog.upper()] += 1

print(f"Total entités non résolues: {len(entities)}")
print(f"Dont sans aucun programme: {no_program_count}\n")
print("Top 30 programmes non mappés:")
for prog, count in counter.most_common(30):
    print(f"  {prog}: {count}")
