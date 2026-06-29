const HOOK_STATS = [
    {
        value: "19×",
        label: "plus d'entités iraniennes sanctionnées par Washington que par l'ONU",
        color: "#ef4444",
    },
    {
        value: "94%",
        label: "des entités russes sanctionnées le sont uniquement par les États-Unis",
        color: "#f97316",
    },
    {
        value: "146",
        label: "entités reconnues par les deux — le consensus international réel",
        color: "#34d399",
    },
];

const FEATURES = [
    {
        key: "ask",
        icon: "🔍",
        title: "Poser une question",
        description: "Interroge la base en langage naturel. Le système croise les listes de sanctions OFAC/ONU avec les événements géopolitiques du jour et produit une synthèse structurée.",
        tag: "IA + Temps réel",
        color: "#8b5cf6",
        cta: "Analyser →",
    },
    {
        key: "analysis",
        icon: "⚖️",
        title: "Comparer les juridictions",
        description: "Visualise les divergences entre les sanctions américaines et onusiennes pays par pays. Comprends pourquoi Washington et le Conseil de sécurité ne sanctionnent pas les mêmes acteurs.",
        tag: "Analyse comparative",
        color: "#f97316",
        cta: "Comparer →",
    },
];

const EXAMPLES = [
    "Programme nucléaire iranien",
    "Oligarques russes post-2022",
    "Réseaux nord-coréens d'armement",
    "Contournement des sanctions via des sociétés écrans",
];

export default function Home({ onNavigate }) {
    return (
        <div style={{ color: "#e2e8f0", overflowY: "auto", height: "100%" }}>

            {/* Hero */}
            <div style={{
                padding: "80px 48px 60px",
                maxWidth: "860px",
                margin: "0 auto",
                textAlign: "center",
            }}>
                <div style={{
                    display: "inline-block",
                    padding: "4px 14px", borderRadius: "20px",
                    background: "#1e2a3a", border: "1px solid #2d3a4a",
                    fontSize: "12px", color: "#60a5fa", marginBottom: "28px",
                    letterSpacing: "0.05em",
                }}>
                    OFAC · ONU · GDELT · Open source
                </div>

                <h1 style={{
                    fontSize: "52px", fontWeight: 900, lineHeight: 1.1,
                    marginBottom: "24px", letterSpacing: "-1.5px",
                }}>
                    Les États-Unis sanctionnent<br />
                    <span style={{ color: "#3b82f6" }}>seuls ce que l'ONU ne peut pas.</span>
                </h1>

                <p style={{
                    fontSize: "18px", color: "#94a3b8", lineHeight: 1.75,
                    maxWidth: "580px", margin: "0 auto 48px",
                }}>
                    20 000 entités sanctionnées, deux institutions, des agendas divergents.
                    SanctionScope rend ces données lisibles — et les questions géopolitiques qu'elles posent, visibles.
                </p>

                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                    <button onClick={() => onNavigate("ask")} style={{
                        padding: "14px 32px", borderRadius: "10px", border: "none",
                        background: "#3b82f6", color: "#fff",
                        fontSize: "15px", fontWeight: 700, cursor: "pointer",
                    }}>
                        Poser une question →
                    </button>
                    <button onClick={() => onNavigate("analysis")} style={{
                        padding: "14px 32px", borderRadius: "10px",
                        border: "1px solid #2d3748", background: "transparent",
                        color: "#e2e8f0", fontSize: "15px", cursor: "pointer",
                    }}>
                        Voir les divergences
                    </button>
                </div>
            </div>

            {/* Stats-choc */}
            <div style={{
                borderTop: "1px solid #1e2a3a",
                borderBottom: "1px solid #1e2a3a",
                background: "#0d1220",
                padding: "48px",
            }}>
                <div style={{
                    maxWidth: "860px", margin: "0 auto",
                    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px",
                }}>
                    {HOOK_STATS.map(s => (
                        <div key={s.value} style={{ textAlign: "center" }}>
                            <div style={{
                                fontSize: "48px", fontWeight: 900, color: s.color,
                                lineHeight: 1, marginBottom: "12px", letterSpacing: "-2px",
                            }}>
                                {s.value}
                            </div>
                            <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Explication rapide */}
            <div style={{
                maxWidth: "860px", margin: "0 auto",
                padding: "60px 48px 0",
                textAlign: "center",
            }}>
                <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", marginBottom: "16px" }}>
                    POURQUOI CET ÉCART ?
                </h2>
                <p style={{ fontSize: "16px", color: "#94a3b8", lineHeight: 1.8, maxWidth: "640px", margin: "0 auto" }}>
                    Les sanctions américaines sont décidées par le pouvoir exécutif, sans droit de veto.
                    Les sanctions onusiennes exigent l'unanimité du Conseil de sécurité — où la Russie et la Chine siègent.
                    L'écart entre les deux listes est une carte de la géopolitique mondiale.
                </p>
            </div>

            {/* Features */}
            <div style={{ padding: "60px 48px", maxWidth: "860px", margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {FEATURES.map(f => (
                        <div
                            key={f.key}
                            onClick={() => onNavigate(f.key)}
                            style={{
                                background: "#0d1220", border: "1px solid #1e2a3a",
                                borderRadius: "16px", padding: "28px", cursor: "pointer",
                                transition: "border-color 0.2s, transform 0.15s",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = f.color;
                                e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = "#1e2a3a";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            <div style={{ fontSize: "32px", marginBottom: "16px" }}>{f.icon}</div>
                            <div style={{
                                fontSize: "11px", color: f.color, fontWeight: 700,
                                marginBottom: "8px", letterSpacing: "0.1em",
                            }}>
                                {f.tag}
                            </div>
                            <div style={{ fontSize: "17px", fontWeight: 700, marginBottom: "12px" }}>
                                {f.title}
                            </div>
                            <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.7, marginBottom: "20px" }}>
                                {f.description}
                            </div>
                            <div style={{ fontSize: "13px", color: f.color, fontWeight: 600 }}>
                                {f.cta}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Exemples */}
            <div style={{
                padding: "0 48px 60px",
                maxWidth: "860px", margin: "0 auto",
                textAlign: "center",
            }}>
                <div style={{ fontSize: "12px", color: "#475569", marginBottom: "14px", letterSpacing: "0.08em" }}>
                    EXEMPLES DE QUESTIONS
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                    {EXAMPLES.map(q => (
                        <button
                            key={q}
                            onClick={() => onNavigate("ask", q)}
                            style={{
                                padding: "8px 16px", borderRadius: "20px",
                                border: "1px solid #1e2a3a", background: "transparent",
                                color: "#94a3b8", fontSize: "13px", cursor: "pointer",
                                transition: "border-color 0.2s, color 0.2s",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = "#3b82f6";
                                e.currentTarget.style.color = "#60a5fa";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = "#1e2a3a";
                                e.currentTarget.style.color = "#94a3b8";
                            }}
                        >
                            {q} →
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div style={{
                borderTop: "1px solid #1e2a3a", padding: "24px 48px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
                <div style={{ fontSize: "13px", color: "#475569" }}>
                    🌐 SanctionScope
                </div>
                <div style={{ fontSize: "12px", color: "#334155" }}>
                    Sources : OFAC SDN · Consolidated UN List · GDELT · API Anthropic
                </div>
            </div>

        </div>
    );
}