import { useState } from "react";
import axios from "axios";

export default function Ask() {
    const [question, setQuestion] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const suggestions = [
        "Quelles banques iraniennes sont sanctionnées ?",
        "Qui est Arkady Rotenberg ?",
        "Quelles entreprises nord-coréennes sont sanctionnées ?",
        "Quels navires iraniens sont sur la liste OFAC ?",
    ];

    const ask = async (q) => {
        const query = q || question;
        if (!query.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const { data } = await axios.get("http://localhost:8000/ask", {
                params: { question: query }
            });
            setResult(data);
        } catch (e) {
            setResult({ error: "Erreur lors de la requête." });
        }
        setLoading(false);
    };

    // Convertit le markdown simple en JSX
    const renderAnswer = (text) => {
        return text.split("\n").map((line, i) => {
            if (line.startsWith("# ")) return (
                <h2 key={i} style={{ fontSize: "20px", fontWeight: 800, margin: "20px 0 12px", color: "#60a5fa" }}>
                    {line.slice(2)}
                </h2>
            );
            if (line.startsWith("## ")) return (
                <h3 key={i} style={{ fontSize: "15px", fontWeight: 700, margin: "16px 0 8px", color: "#94a3b8" }}>
                    {line.slice(3)}
                </h3>
            );
            if (line.startsWith("- ") || line.startsWith("* ")) return (
                <div key={i} style={{ padding: "4px 0 4px 16px", borderLeft: "2px solid #1e3a5f", margin: "4px 0", fontSize: "13px" }}>
                    {line.slice(2)}
                </div>
            );
            if (line.startsWith("**") && line.endsWith("**")) return (
                <div key={i} style={{ fontWeight: 700, color: "#e2e8f0", margin: "8px 0", fontSize: "13px" }}>
                    {line.slice(2, -2)}
                </div>
            );
            if (line.trim() === "" || line.trim() === "---") return <div key={i} style={{ height: "8px" }} />;
            return (
                <p key={i} style={{ fontSize: "13px", lineHeight: 1.7, color: "#94a3b8", margin: "4px 0" }}>
                    {line}
                </p>
            );
        });
    };

    return (
        <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto", color: "#e2e8f0" }}>
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
                    🔍 Analyser
                </h1>
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                    Posez une question en langage naturel sur les sanctions internationales.
                </p>
            </div>

            {/* Barre de recherche */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                <input
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && ask()}
                    placeholder="Ex: Quelles banques iraniennes sont sanctionnées ?"
                    style={{
                        flex: 1, background: "#0d1220", border: "1px solid #2d3748",
                        borderRadius: "10px", padding: "14px 18px", color: "#e2e8f0",
                        fontSize: "15px", outline: "none",
                    }}
                />
                <button onClick={() => ask()} disabled={loading} style={{
                    padding: "14px 24px", borderRadius: "10px", border: "none",
                    background: loading ? "#1e2a3a" : "#3b82f6",
                    color: "#fff", fontSize: "14px", fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                }}>
                    {loading ? "..." : "Analyser"}
                </button>
            </div>

            {/* Suggestions */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
                {suggestions.map(s => (
                    <button key={s} onClick={() => { setQuestion(s); ask(s); }} style={{
                        padding: "6px 12px", borderRadius: "8px", border: "1px solid #1e2a3a",
                        background: "transparent", color: "#64748b", fontSize: "12px", cursor: "pointer",
                    }}>
                        {s}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div style={{
                    background: "#0d1220", border: "1px solid #1e2a3a",
                    borderRadius: "12px", padding: "40px", textAlign: "center", color: "#64748b"
                }}>
                    Analyse en cours...
                </div>
            )}

            {/* Résultat */}
            {result && !loading && (
                <div>
                    {/* Entités utilisées */}
                    {result.entities_used?.length > 0 && (
                        <div style={{
                            background: "#0d1220", border: "1px solid #1e2a3a",
                            borderRadius: "12px", padding: "16px", marginBottom: "16px"
                        }}>
                            <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "10px" }}>
                                DONNÉES UTILISÉES — {result.entities_used.length} entités depuis la base SanctionScope
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {result.entities_used.map((e, i) => (
                                    <span key={i} style={{
                                        padding: "3px 10px", borderRadius: "12px", fontSize: "11px",
                                        background: e.source === "OFAC" ? "#1e1a2a" : "#1a1e2a",
                                        border: `1px solid ${e.source === "OFAC" ? "#7c3aed" : "#1e3a5f"}`,
                                        color: e.source === "OFAC" ? "#a78bfa" : "#60a5fa",
                                    }}>
                    {e.name}
                  </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Réponse */}
                    <div style={{
                        background: "#0d1220", border: "1px solid #1e2a3a",
                        borderRadius: "12px", padding: "24px"
                    }}>
                        {renderAnswer(result.answer)}
                    </div>
                </div>
            )}
        </div>
    );
}