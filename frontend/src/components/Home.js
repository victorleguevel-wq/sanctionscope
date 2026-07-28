const HOOK_STATS = [
    {
        value: "5,6×",
        label: "Plus d'entités iraniennes sanctionnées par Washington (674) que par l'ONU (121).",
        color: "#3b82f6",
    },
    {
        value: "0",
        label: "Entité russe sanctionnée par l'ONU, contre 6 261 par les États-Unis et 320 par l'UE.",
        color: "#94a3b8",
    },
    {
        value: "146",
        label: "Entités reconnues à la fois par les États-Unis et l'ONU : le socle du consensus international.",
        color: "#34d399",
    },
];

const FEATURES = [
    {
        key: "analysis",
        icon: "⚖️",
        title: "Comparer",
        description:
            "Mettre en regard les quatre juridictions pour un pays ou un secteur donné et identifier leurs divergences.",
        tag: "02",
        color: "#f59e0b",
        cta: "Comparer →",
    },
    {
        key: "ask",
        icon: "🧠",
        title: "Analyser",
        description:
            "Interroger la base en langage naturel afin de relier sanctions internationales et contexte géopolitique.",
        tag: "03",
        color: "#8b5cf6",
        cta: "Analyser →",
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
            <div
                style={{
                    padding: "80px 48px 60px",
                    maxWidth: "860px",
                    margin: "0 auto",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        display: "inline-block",
                        padding: "4px 14px",
                        borderRadius: "20px",
                        background: "#1e2a3a",
                        border: "1px solid #2d3a4a",
                        fontSize: "12px",
                        color: "#60a5fa",
                        marginBottom: "28px",
                        letterSpacing: "0.05em",
                    }}
                >
                    OFAC · ONU · UE · Chine · GDELT · Open source
                </div>

                <h1
                    style={{
                        fontSize: "52px",
                        fontWeight: 900,
                        lineHeight: 1.1,
                        marginBottom: "24px",
                        letterSpacing: "-1.5px",
                    }}
                >
                    Les listes de sanctions racontent
                    <br />
                    <span style={{ color: "#3b82f6" }}>
                        des visions différentes du monde.
                    </span>
                </h1>

                <p
                    style={{
                        fontSize: "18px",
                        color: "#94a3b8",
                        lineHeight: 1.75,
                        maxWidth: "620px",
                        margin: "0 auto 48px",
                    }}
                >
                    Quatre juridictions répondent aux mêmes événements par des
                    listes de sanctions largement différentes. Une entité peut
                    être visée par Washington et absente de toute liste
                    onusienne. Une autre peut figurer sur la liste de l'ONU sans
                    jamais apparaître dans un registre américain.
                    SanctionScope compare ces listes et rend ces écarts
                    visibles.
                </p>

                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        justifyContent: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        onClick={() => onNavigate("explore")}
                        style={{
                            padding: "14px 32px",
                            borderRadius: "10px",
                            border: "none",
                            background: "#3b82f6",
                            color: "#fff",
                            fontSize: "15px",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        Explorer les données →
                    </button>

                    <button
                        onClick={() => onNavigate("analysis")}
                        style={{
                            padding: "14px 32px",
                            borderRadius: "10px",
                            border: "1px solid #2d3748",
                            background: "transparent",
                            color: "#e2e8f0",
                            fontSize: "15px",
                            cursor: "pointer",
                        }}
                    >
                        Comparer les juridictions
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div
                style={{
                    borderTop: "1px solid #1e2a3a",
                    borderBottom: "1px solid #1e2a3a",
                    background: "#0d1220",
                    padding: "48px",
                }}
            >
                <div
                    style={{
                        maxWidth: "860px",
                        margin: "0 auto",
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "40px",
                    }}
                >
                    {HOOK_STATS.map((s) => (
                        <div
                            key={s.value}
                            style={{ textAlign: "center" }}
                        >
                            <div
                                style={{
                                    fontSize: "48px",
                                    fontWeight: 900,
                                    color: s.color,
                                    lineHeight: 1,
                                    marginBottom: "12px",
                                    letterSpacing: "-2px",
                                }}
                            >
                                {s.value}
                            </div>

                            <div
                                style={{
                                    fontSize: "13px",
                                    color: "#64748b",
                                    lineHeight: 1.6,
                                }}
                            >
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Explication rapide */}
            <div
                style={{
                    maxWidth: "860px",
                    margin: "0 auto",
                    padding: "60px 48px 0",
                    textAlign: "center",
                }}
            >
                <h2
                    style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#64748b",
                        letterSpacing: "0.1em",
                        marginBottom: "16px",
                    }}
                >
                    POURQUOI CES ÉCARTS ?
                </h2>

                <p
                    style={{
                        fontSize: "16px",
                        color: "#94a3b8",
                        lineHeight: 1.8,
                        maxWidth: "720px",
                        margin: "0 auto",
                    }}
                >
                    Les sanctions américaines sont décidées par le pouvoir
                    exécutif. Les sanctions des Nations unies exigent un vote
                    unanime du Conseil de sécurité, où la Russie et la Chine
                    disposent chacune d'un droit de veto. L'Union européenne
                    suit un processus intergouvernemental distinct, tandis que
                    la Chine privilégie généralement des contre-sanctions
                    ciblées. Les différences entre ces quatre listes ne sont pas
                    des erreurs de mesure&nbsp;: elles reflètent des choix
                    politiques.
                </p>
            </div>

            {/* Features */}
            <div
                style={{
                    padding: "60px 48px",
                    maxWidth: "1000px",
                    margin: "0 auto",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "16px",
                    }}
                >
                    {FEATURES.map((f) => (
                        <div
                            key={f.key}
                            onClick={() => onNavigate(f.key)}
                            style={{
                                background: "#0d1220",
                                border: "1px solid #1e2a3a",
                                borderRadius: "16px",
                                padding: "28px",
                                cursor: "pointer",
                                transition:
                                    "border-color 0.2s, transform 0.15s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = f.color;
                                e.currentTarget.style.transform =
                                    "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "#1e2a3a";
                                e.currentTarget.style.transform =
                                    "translateY(0)";
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: f.color,
                                    fontWeight: 700,
                                    marginBottom: "12px",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                {f.tag}
                            </div>

                            <div
                                style={{
                                    fontSize: "32px",
                                    marginBottom: "16px",
                                }}
                            >
                                {f.icon}
                            </div>

                            <div
                                style={{
                                    fontSize: "18px",
                                    fontWeight: 700,
                                    marginBottom: "12px",
                                }}
                            >
                                {f.title}
                            </div>

                            <div
                                style={{
                                    fontSize: "13px",
                                    color: "#64748b",
                                    lineHeight: 1.7,
                                    marginBottom: "20px",
                                }}
                            >
                                {f.description}
                            </div>

                            <div
                                style={{
                                    fontSize: "13px",
                                    color: f.color,
                                    fontWeight: 600,
                                }}
                            >
                                {f.cta}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Exemples */}
            <div
                style={{
                    padding: "0 48px 60px",
                    maxWidth: "860px",
                    margin: "0 auto",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        fontSize: "12px",
                        color: "#475569",
                        marginBottom: "14px",
                        letterSpacing: "0.08em",
                    }}
                >
                    EXEMPLES DE QUESTIONS
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        justifyContent: "center",
                    }}
                >
                    {EXAMPLES.map((q) => (
                        <button
                            key={q}
                            onClick={() => onNavigate("ask", q)}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "20px",
                                border: "1px solid #1e2a3a",
                                background: "transparent",
                                color: "#94a3b8",
                                fontSize: "13px",
                                cursor: "pointer",
                                transition:
                                    "border-color 0.2s, color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "#3b82f6";
                                e.currentTarget.style.color = "#60a5fa";
                            }}
                            onMouseLeave={(e) => {
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
            <div
                style={{
                    borderTop: "1px solid #1e2a3a",
                    padding: "24px 48px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                }}
            >
                <div
                    style={{
                        fontSize: "13px",
                        color: "#475569",
                    }}
                >
                    🌐 SanctionScope
                </div>

                <div
                    style={{
                        fontSize: "12px",
                        color: "#334155",
                    }}
                >
                    Sources : OFAC SDN · Consolidated UN List · EU Consolidated
                    List · MOFA China · GDELT · API Anthropic
                </div>
            </div>
        </div>
    );
}


