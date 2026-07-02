export default function About() {
    const DIVERGENCES = [
        { label: "Russie", ofac: 6364, un: 0, eu: 320, note: "Veto russe au Conseil de sécurité — l'UE seule rejoint les USA depuis 2022" },
        { label: "Terrorisme global", ofac: 3165, un: 0, eu: 0, note: "Définition américaine non ratifiée par l'ONU" },
        { label: "Iran", ofac: 674, un: 121, eu: 0, note: "Accord nucléaire : positions divergentes" },
        { label: "Corée du Nord", ofac: 69, un: 155, eu: 0, note: "Rare cas de consensus où l'ONU sanctionne plus" },
        { label: "Venezuela", ofac: 166, un: 0, eu: 0, note: "Sanctions unilatérales américaines" },
        { label: "Cuba", ofac: 77, un: 0, eu: 0, note: "Embargo historique non reconnu par l'ONU" },
        { label: "Mali", ofac: 0, un: 0, eu: 0, note: "Sanctions portées quasi exclusivement par l'UE" },
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
                    À PROPOS DE SANCTIONSCOPE
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
                    que sur le droit international. L'outil compare désormais quatre régimes de sanctions —
                    États-Unis (OFAC), ONU, Union Européenne et Chine — et continuera d'accueillir de nouvelles
                    sources pour permettre aux utilisateurs de développer un regard toujours plus critique
                    des différentes politiques internationales.
                </p>
            </div>

            {/* Section 1 */}
            <section style={{ marginBottom: "40px" }}>
                <h2 style={{
                    fontSize: "16px", fontWeight: 700, color: "#3b82f6",
                    letterSpacing: "0.08em", marginBottom: "14px",
                }}>
                    QU'EST-CE QU'UNE SANCTION INTERNATIONALE ?
                </h2>
                <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.85, marginBottom: "14px" }}>
                    Une sanction internationale est une mesure coercitive non militaire (ex : gel d'avoirs,
                    interdiction de voyager, embargo commercial...) imposée à un État, une organisation
                    ou un individu pour le contraindre à modifier son comportement.
                </p>
                <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.85 }}>
                    Quatre acteurs dominent ce paysage : l'<strong style={{ color: "#a78bfa" }}>OFAC</strong> (Office of Foreign Assets Control),
                    bras armé du Trésor américain ; le <strong style={{ color: "#60a5fa" }}>Conseil de sécurité de l'ONU</strong>,
                    qui représente le consensus multilatéral ; l'<strong style={{ color: "#22c55e" }}>Union Européenne</strong>,
                    dont le régime de sanctions s'est particulièrement durci depuis l'invasion de l'Ukraine en 2022 ;
                    et la <strong style={{ color: "#f59e0b" }}>Chine</strong>, qui répond de plus en plus par des
                    contre-sanctions ciblant principalement des entités et individus américains. Leurs listes
                    devraient se recouper largement. Elles se recoupent à peine.
                </p>
            </section>

            {/* Chiffre choc */}
            <div style={{
                background: "#0d1220", border: "1px solid #1e3a5f",
                borderRadius: "14px", padding: "28px 32px", marginBottom: "40px",
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "20px", textAlign: "center",
            }}>
                {[
                    { value: "19 122", label: "entités OFAC", color: "#ef4444" },
                    { value: "1 002", label: "entités ONU", color: "#3b82f6" },
                    { value: "9 283", label: "entités UE", color: "#22c55e" },
                    { value: "330", label: "contre-sanctions Chine", color: "#f59e0b" },
                    { value: "146", label: "entités OFAC ∩ ONU", color: "#7c3aed" },
                ].map(s => (
                    <div key={s.value}>
                        <div style={{ fontSize: "26px", fontWeight: 900, color: s.color, letterSpacing: "-1px", marginBottom: "6px" }}>
                            {s.value}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.5 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Section 2 */}
            <section style={{ marginBottom: "40px" }}>
                <h2 style={{
                    fontSize: "16px", fontWeight: 700, color: "#3b82f6",
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
                    du Conseil de sécurité. La Russie et la Chine disposent d'un droit de veto,
                    ce qui rend impossible toute sanction onusienne contre leurs propres intérêts —
                    ce qui explique en grande partie pourquoi la liste ONU reste si réduite face à celle de l'OFAC.
                </p>
                <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.85, marginBottom: "14px" }}>
                    L'Union Européenne suit un processus intergouvernemental distinct, nécessitant l'unanimité
                    de ses 27 États membres. Ce régime reste globalement aligné avec Washington sur la Russie,
                    l'Iran ou la Syrie, mais avec des listes d'entités souvent différentes en pratique
                    (approche plus restrictive sur les données personnelles, ciblage parfois plus étroit).
                </p>
                <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.85 }}>
                    La Chine, de son côté, ne publie pas une liste de sanctions unilatérales comparable :
                    ses mesures sont très majoritairement des <em>contre-sanctions</em>, en réponse directe
                    aux sanctions occidentales, ciblant des responsables politiques, parlementaires ou entités
                    américaines et européennes. L'écart entre toutes ces listes n'est donc pas un accident
                    technique — c'est une carte des lignes de fracture géopolitiques mondiales.
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
                            display: "grid", gridTemplateColumns: "110px 70px 70px 70px 1fr", gap: "10px",
                            alignItems: "center",
                        }}>
                            <div style={{ fontSize: "13px", fontWeight: 700 }}>{d.label}</div>
                            <div style={{ fontSize: "12px" }}>
                                <span style={{ color: "#ef4444", fontWeight: 700 }}>{d.ofac.toLocaleString()}</span>
                                <span style={{ color: "#475569", fontSize: "10px" }}> OFAC</span>
                            </div>
                            <div style={{ fontSize: "12px" }}>
                                <span style={{ color: "#3b82f6", fontWeight: 700 }}>{d.un.toLocaleString()}</span>
                                <span style={{ color: "#475569", fontSize: "10px" }}> ONU</span>
                            </div>
                            <div style={{ fontSize: "12px" }}>
                                <span style={{ color: "#22c55e", fontWeight: 700 }}>{d.eu.toLocaleString()}</span>
                                <span style={{ color: "#475569", fontSize: "10px" }}> UE</span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#475569", fontStyle: "italic" }}>{d.note}</div>
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: "11px", color: "#334155", marginTop: "10px", fontStyle: "italic" }}>
                    La Corée du Nord est le seul cas où l'ONU sanctionne davantage : preuve qu'un consensus est possible
                    quand aucun membre permanent n'est directement impliqué. À l'inverse, le Mali illustre les cas où
                    l'UE agit seule, sans équivalent significatif côté OFAC ou ONU.
                </div>
            </section>

            {/* Section 3 — Méthodologie */}
            <section style={{ marginBottom: "40px" }}>
                <h2 style={{
                    fontSize: "16px", fontWeight: 700, color: "#3b82f6",
                    letterSpacing: "0.08em", marginBottom: "14px",
                }}>
                    MÉTHODOLOGIE ET SOURCES
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[
                        {
                            source: "OFAC SDN List",
                            url: "https://ofac.treasury.gov/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists",
                            description: "Liste officielle du Trésor américain, parsée depuis le format XML. Mise à jour régulière. Contient 19 122 entrées, comprenant des individus, des organisations, des navires et aéronefs. Ne fournit pas de date de désignation par entité.",
                            color: "#ef4444",
                        },
                        {
                            source: "Liste consolidée ONU",
                            url: "https://www.un.org/securitycouncil/content/un-sc-consolidated-list",
                            description: "Liste du Conseil de sécurité des Nations Unies, parsée depuis le format XML consolidé. Contient 1 002 entrées, uniquement des individus et organisations.",
                            color: "#3b82f6",
                        },
                        {
                            source: "Liste consolidée UE",
                            url: "https://www.sanctionsmap.eu",
                            description: "Liste des mesures restrictives de l'Union Européenne. Contient 9 283 entrées, avec dates de désignation disponibles — seule source du projet permettant une analyse temporelle fiable à ce jour.",
                            color: "#22c55e",
                        },
                        {
                            source: "Contre-sanctions chinoises",
                            url: "https://www.mofa.gov.cn",
                            description: "Mesures de rétorsion annoncées par le Ministère des Affaires étrangères chinois, essentiellement dirigées contre des entités et responsables américains et européens. Contient 330 entrées.",
                            color: "#f59e0b",
                        },
                        {
                            source: "GDELT Project",
                            url: "https://www.gdeltproject.org",
                            description: "Base de données d'événements géopolitiques en temps réel, extraite de milliers de sources médiatiques mondiales. Utilisée pour contextualiser les entités sanctionnées avec l'actualité dans l'onglet Analyser.",
                            color: "#0891b2",
                        },
                        {
                            source: "API Anthropic (Claude)",
                            url: "https://www.anthropic.com",
                            description: "Synthèse et analyse des données via le modèle Claude. Les descriptions, chronologies et résumés générés sont basés sur les données officielles mais restent des synthèses IA : à vérifier avant tout usage professionnel.",
                            color: "#a78bfa",
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
                    fontSize: "16px", fontWeight: 700, color: "#3b82f6",
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
                        "Seule la liste de l'Union Européenne fournit des dates de désignation par entité. OFAC, ONU et Chine n'en fournissent aucune dans les sources publiques utilisées : toute chronologie affichée pour ces sources dans l'onglet Analyser est générée par IA à partir de sa connaissance générale, pas extraite des données structurées.",
                        "L'association d'une entité à un « pays cible » repose sur son champ de nationalité déclaré, ou à défaut sur le programme de sanctions associé — cette résolution automatique peut être imprécise pour les programmes thématiques (terrorisme, cybercriminalité, narcotrafic) qui ne ciblent pas un pays unique.",
                        "Les données chinoises se limitent aux contre-sanctions rendues publiques par le Ministère des Affaires étrangères ; elles ne couvrent pas d'éventuelles mesures non annoncées officiellement.",
                        "Les descriptions et synthèses générées par IA dans la section Analyser sont des résumés, elles ne remplacent pas une consultation des sources officielles.",
                        "Les données GDELT sont brutes et peuvent contenir des événements mal géolocalisés ou mal catégorisés.",
                    ].map((limit, i, arr) => (
                        <div key={i} style={{
                            display: "flex", gap: "12px", paddingBottom: i < arr.length - 1 ? "12px" : 0,
                            marginBottom: i < arr.length - 1 ? "12px" : 0,
                            borderBottom: i < arr.length - 1 ? "1px solid #1e2a3a" : "none",
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
                    Projet open source, données officielles uniquement
                </div>
                <div style={{ fontSize: "12px", color: "#334155" }}>
                    OFAC · ONU · UE · Chine · GDELT · Anthropic
                </div>
            </div>
        </div>
    );
}