export default function About() {
    const DIVERGENCES = [
        { label: "Russie", ofac: 6364, un: 0, note: "Veto russe au Conseil de sécurité" },
        { label: "Terrorisme global", ofac: 3165, un: 0, note: "Définition américaine non ratifiée par l'ONU" },
        { label: "Iran", ofac: 674, un: 121, note: "Accord nucléaire : positions divergentes" },
        { label: "Corée du Nord", ofac: 69, un: 155, note: "Rare cas de consensus — ONU sanctionne plus" },
        { label: "Venezuela", ofac: 166, un: 0, note: "Sanctions unilatérales américaines" },
        { label: "Cuba", ofac: 77, un: 0, note: "Embargo historique non reconnu par l'ONU" },
    ];

    return (
        <div style={{
            color: "#e2e8f0", overflowY: "auto", height: "100%",
            padding: "48px", maxWidth: "780px", margin: "0 auto",
        }}>

            {/* Titre */}
            <div style={{ marginBottom: "48px" }}>
                <div style={{
                    fontSize: "11px", fontWeight: 700, color: "#64748b",
                    letterSpacing: "0.1em", marginBottom: "12px",
                }}>
                    À PROPOS DU PROJET
                </div>
                <h1 style={{
                    fontSize: "36px", fontWeight: 900, lineHeight: 1.15,
                    letterSpacing: "-1px", marginBottom: "16px",
                }}>
                    Pourquoi les listes de sanctions<br />
                    <span style={{ color: "#3b82f6" }}>ne racontent pas la même histoire</span>
                </h1>
                <p style={{ fontSize: "15px", color: "#94a3b8", lineHeight: 1.8, margin: 0 }}>
                    SanctionScope est un projet de visualisation et d'analyse des sanctions internationales,
                    construit pour rendre lisible un écart qui révèle autant sur la géopolitique mondiale
                    que sur le droit international.
                </p>
            </div>

            {/* Section 1 */}
            <section style={{ marginBottom: "40px" }}>
                <h2 style={{
                    fontSize: "13px", fontWeight: 700, color: "#3b82f6",
                    letterSpacing: "0.08em", marginBottom: "14px",
                }}>
                    QU'EST-CE QU'UNE SANCTION INTERNATIONALE ?
                </h2>
                <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.85, marginBottom: "14px" }}>
                    Une sanction internationale est une mesure coercitive non militaire — gel d'avoirs,
                    interdiction de voyager, embargo commercial — imposée à un État, une organisation
                    ou un individu pour le contraindre à modifier son comportement.
                </p>
                <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.85 }}>
                    Deux institutions dominent ce paysage : l'<strong style={{ color: "#a78bfa" }}>OFAC</strong> (Office of Foreign Assets Control),
                    bras armé du Trésor américain, et le <strong style={{ color: "#60a5fa" }}>Conseil de sécurité de l'ONU</strong>,
                    qui représente le consensus multilatéral. Leurs listes devraient se ressembler.
                    Elles ne se ressemblent presque pas.
                </p>
            </section>

            {/* Chiffre choc */}
            <div style={{
                background: "#0d1220", border: "1px solid #1e3a5f",
                borderRadius: "14px", padding: "28px 32px", marginBottom: "40px",
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", textAlign: "center",
            }}>
                {[
                    { value: "19 122", label: "entités dans la liste OFAC", color: "#a78bfa" },
                    { value: "1 002", label: "entités dans la liste ONU", color: "#60a5fa" },
                    { value: "146", label: "entités présentes dans les deux", color: "#34d399" },
                ].map(s => (
                    <div key={s.value}>
                        <div style={{ fontSize: "32px", fontWeight: 900, color: s.color, letterSpacing: "-1px", marginBottom: "6px" }}>
                            {s.value}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Section 2 */}
            <section style={{ marginBottom: "40px" }}>
                <h2 style={{
                    fontSize: "13px", fontWeight: 700, color: "#3b82f6",
                    letterSpacing: "0.08em", marginBottom: "14px",
                }}>
                    POURQUOI UN ÉCART AUSSI MASSIF ?
                </h2>
                <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.85, marginBottom: "14px" }}>
                    Les sanctions américaines sont décidées par décret présidentiel ou loi du Congrès,
                    sans droit de veto extérieur. L'OFAC peut sanctionner n'importe quelle entité
                    qui menace, selon Washington, la sécurité nationale ou la politique étrangère américaine.
                </p>
                <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.85, marginBottom: "14px" }}>
                    Les sanctions onusiennes, elles, exigent un vote unanime des cinq membres permanents
                    du Conseil de sécurité. La Russie et la Chine disposent d'un droit de veto —
                    ce qui rend impossible toute sanction onusienne contre leurs propres intérêts.
                </p>
                <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.85 }}>
                    L'écart entre les deux listes n'est donc pas un accident technique.
                    C'est une carte des lignes de fracture géopolitiques mondiales.
                </p>
            </section>

            {/* Table divergences */}
            <section style={{ marginBottom: "40px" }}>
                <h2 style={{
                    fontSize: "13px", fontWeight: 700, color: "#3b82f6",
                    letterSpacing: "0.08em", marginBottom: "16px",
                }}>
                    LES DIVERGENCES LES PLUS RÉVÉLATRICES
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {DIVERGENCES.map(d => (
                        <div key={d.label} style={{
                            background: "#0d1220", border: "1px solid #1e2a3a",
                            borderRadius: "10px", padding: "14px 18px",
                            display: "grid", gridTemplateColumns: "120px 80px 80px 1fr", gap: "12px",
                            alignItems: "center",
                        }}>
                            <div style={{ fontSize: "13px", fontWeight: 700 }}>{d.label}</div>
                            <div style={{ fontSize: "12px" }}>
                                <span style={{ color: "#a78bfa", fontWeight: 700 }}>{d.ofac.toLocaleString()}</span>
                                <span style={{ color: "#475569", fontSize: "10px" }}> OFAC</span>
                            </div>
                            <div style={{ fontSize: "12px" }}>
                                <span style={{ color: "#60a5fa", fontWeight: 700 }}>{d.un.toLocaleString()}</span>
                                <span style={{ color: "#475569", fontSize: "10px" }}> ONU</span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#475569", fontStyle: "italic" }}>{d.note}</div>
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: "11px", color: "#334155", marginTop: "10px", fontStyle: "italic" }}>
                    La Corée du Nord est le seul cas où l'ONU sanctionne davantage — preuve qu'un consensus est possible quand aucun membre permanent n'est directement impliqué.
                </div>
            </section>

            {/* Section 3 — Méthodologie */}
            <section style={{ marginBottom: "40px" }}>
                <h2 style={{
                    fontSize: "13px", fontWeight: 700, color: "#3b82f6",
                    letterSpacing: "0.08em", marginBottom: "14px",
                }}>
                    MÉTHODOLOGIE ET SOURCES
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[
                        {
                            source: "OFAC SDN List",
                            url: "https://ofac.treasury.gov/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists",
                            description: "Liste officielle du Trésor américain, parsée depuis le format XML. Mise à jour régulière. Contient 19 122 entrées couvrant individus, organisations, navires et aéronefs.",
                            color: "#a78bfa",
                        },
                        {
                            source: "Liste consolidée ONU",
                            url: "https://www.un.org/securitycouncil/content/un-sc-consolidated-list",
                            description: "Liste du Conseil de sécurité des Nations Unies, parsée depuis le format XML consolidé. Contient 1 002 entrées, uniquement des individus et organisations.",
                            color: "#60a5fa",
                        },
                        {
                            source: "GDELT Project",
                            url: "https://www.gdeltproject.org",
                            description: "Base de données d'événements géopolitiques en temps réel, extraite de milliers de sources médiatiques mondiales. Utilisée pour contextualiser les entités sanctionnées avec l'actualité.",
                            color: "#0891b2",
                        },
                        {
                            source: "API Anthropic (Claude)",
                            url: "https://www.anthropic.com",
                            description: "Synthèse et analyse des données via le modèle Claude. Les descriptions générées sont basées sur les données officielles mais restent des résumés IA — à vérifier avant tout usage professionnel.",
                            color: "#f97316",
                        },
                    ].map(s => (
                        <div key={s.source} style={{
                            background: "#0d1220", border: `1px solid ${s.color}22`,
                            borderLeft: `3px solid ${s.color}`,
                            borderRadius: "8px", padding: "14px 16px",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                <span style={{ fontSize: "13px", fontWeight: 700, color: s.color }}>{s.source}</span>
                                {s.url && (
                                    <a href={s.url} target="_blank" rel="noreferrer"
                                       style={{ fontSize: "11px", color: "#334155", textDecoration: "none" }}>
                                        ↗ source officielle
                                    </a>
                                )}
                            </div>
                            <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.7, margin: 0 }}>
                                {s.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Limites */}
            <section style={{ marginBottom: "48px" }}>
                <h2 style={{
                    fontSize: "13px", fontWeight: 700, color: "#3b82f6",
                    letterSpacing: "0.08em", marginBottom: "14px",
                }}>
                    LIMITES DE L'OUTIL
                </h2>
                <div style={{
                    background: "#0d1220", border: "1px solid #1e2a3a",
                    borderRadius: "10px", padding: "18px 20px",
                }}>
                    {[
                        "Les correspondances entre listes OFAC et ONU sont calculées par similarité de nom normalisé — des doublons ou faux positifs sont possibles.",
                        "La liste de l'Union européenne n'est pas encore intégrée, ce qui limite la comparaison multilatérale.",
                        "Les descriptions générées par IA dans la section Analyser sont des synthèses — elles ne remplacent pas une consultation des sources officielles.",
                        "Les données GDELT sont brutes et peuvent contenir des événements mal géolocalisés ou mal catégorisés.",
                    ].map((limit, i) => (
                        <div key={i} style={{
                            display: "flex", gap: "12px", paddingBottom: i < 3 ? "12px" : 0,
                            marginBottom: i < 3 ? "12px" : 0,
                            borderBottom: i < 3 ? "1px solid #1e2a3a" : "none",
                        }}>
                            <div style={{
                                width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                                background: "#1e2a3a", display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: "10px", color: "#64748b", marginTop: "1px",
                            }}>
                                {i + 1}
                            </div>
                            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.7, margin: 0 }}>
                                {limit}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer about */}
            <div style={{
                borderTop: "1px solid #1e2a3a", paddingTop: "24px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
                <div style={{ fontSize: "12px", color: "#334155" }}>
                    Projet open source — données officielles uniquement
                </div>
                <div style={{ fontSize: "12px", color: "#334155" }}>
                    OFAC · ONU · GDELT · Anthropic
                </div>
            </div>
        </div>
    );
}