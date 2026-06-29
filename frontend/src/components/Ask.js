import { useState, useEffect, useRef } from "react";
import axios from "axios";
import EventMap from "./EventMap";

export default function Ask({ initialQuestion = "" }) {
    const [question, setQuestion] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const resultRef = useRef(null);

    useEffect(() => {
        if (initialQuestion) {
            setQuestion(initialQuestion);
            ask(initialQuestion);
        }
    }, [initialQuestion]);

    const suggestions = [
        "Programme nucléaire iranien",
        "Sanctions contre la Russie post-2022",
        "Réseaux nord-coréens sanctionnés",
        "Oligarques russes sanctionnés",
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

    const exportPDF = async () => {
        if (!result || !resultRef.current) return;
        setExporting(true);
        try {
            const { default: jsPDF } = await import("jspdf");
            const { default: html2canvas } = await import("html2canvas");

            const el = resultRef.current;
            const canvas = await html2canvas(el, {
                scale: 2,
                backgroundColor: "#0a0e1a",
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL("image/jpeg", 0.92);
            const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const imgW = pageW - 28; // marges 14mm de chaque côté
            const imgH = (canvas.height * imgW) / canvas.width;

            let y = 14;
            let heightLeft = imgH;

            pdf.addImage(imgData, "JPEG", 14, y, imgW, imgH);
            heightLeft -= pageH - 14;

            while (heightLeft > 0) {
                y = heightLeft - imgH + 14;
                pdf.addPage();
                pdf.addImage(imgData, "JPEG", 14, y, imgW, imgH);
                heightLeft -= pageH - 14;
            }

            const filename = `sanctionscope-${question.slice(0, 40).replace(/\s+/g, "-").toLowerCase()}.pdf`;
            pdf.save(filename);
        } catch (err) {
            console.error("Export PDF échoué :", err);
            alert("Export échoué : " + err.message);
        }
        setExporting(false);
    };

    const IMPORTANCE_COLORS = {
        high: "#ef4444",
        medium: "#f97316",
        low: "#3b82f6",
    };

    const SOURCE_COLORS = {
        sanctions: "#7c3aed",
        gdelt: "#0891b2",
        general: "#64748b",
    };

    return (
        <div style={{ padding: "32px", maxWidth: "960px", margin: "0 auto", color: "#e2e8f0" }}>

            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>🔍 Analyser</h1>
                <p style={{ color: "#64748b", fontSize: "13px" }}>
                    Posez une question — le système agrège sanctions OFAC/ONU + événements GDELT temps réel + synthèse IA
                </p>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                <input
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && ask()}
                    placeholder="Ex: Programme nucléaire iranien"
                    style={{
                        flex: 1, background: "#0d1220", border: "1px solid #2d3748",
                        borderRadius: "10px", padding: "14px 18px", color: "#e2e8f0",
                        fontSize: "15px", outline: "none",
                    }}
                />
                <button onClick={() => ask()} disabled={loading} style={{
                    padding: "14px 28px", borderRadius: "10px", border: "none",
                    background: loading ? "#1e2a3a" : "#3b82f6",
                    color: "#fff", fontSize: "14px", fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                }}>
                    {loading ? "⏳" : "Analyser"}
                </button>
                {result && !loading && (
                    <button
                        onClick={exportPDF}
                        disabled={exporting}
                        title="Exporter l'analyse en PDF"
                        style={{
                            padding: "14px 18px", borderRadius: "10px", border: "1px solid #1e2a3a",
                            background: exporting ? "#1e2a3a" : "#0d1220",
                            color: exporting ? "#64748b" : "#94a3b8",
                            fontSize: "14px", cursor: exporting ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", gap: "6px",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {exporting ? "⏳" : "📄"} {exporting ? "Export..." : "PDF"}
                    </button>
                )}
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
                {suggestions.map(s => (
                    <button key={s} onClick={() => { setQuestion(s); ask(s); }} style={{
                        padding: "6px 14px", borderRadius: "20px", border: "1px solid #1e2a3a",
                        background: "transparent", color: "#64748b", fontSize: "12px", cursor: "pointer",
                    }}>
                        {s}
                    </button>
                ))}
            </div>

            {loading && (
                <div style={{
                    background: "#0d1220", border: "1px solid #1e2a3a",
                    borderRadius: "12px", padding: "48px", textAlign: "center"
                }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</div>
                    <div style={{ color: "#64748b", fontSize: "14px" }}>
                        Interrogation des sanctions · GDELT · Synthèse IA...
                    </div>
                </div>
            )}

            {result && !loading && (() => {
                const ans = typeof result.answer === "string"
                    ? JSON.parse(result.answer)
                    : result.answer;

                if (!ans || typeof ans !== "object") return (
                    <div style={{ color: "#ef4444", padding: "20px" }}>{result.error || "Erreur"}</div>
                );

                return (
                    <div ref={resultRef} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                        {/* En-tête PDF */}
                        <div style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "0 0 12px 0", borderBottom: "1px solid #1e2a3a",
                        }}>
                            <div>
                                <div style={{ fontSize: "13px", fontWeight: 700, color: "#60a5fa" }}>SanctionScope</div>
                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                    Analyse : {question}
                                </div>
                            </div>
                            <div style={{ fontSize: "10px", color: "#475569" }}>
                                {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                            </div>
                        </div>

                        {ans.summary && (
                            <div style={{
                                background: "linear-gradient(135deg, #0d1f3c, #0d1220)",
                                border: "1px solid #1e3a5f", borderRadius: "12px", padding: "20px"
                            }}>
                                <div style={{ fontSize: "11px", color: "#3b82f6", fontWeight: 700, marginBottom: "8px" }}>SYNTHÈSE</div>
                                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#e2e8f0", margin: 0 }}>{ans.summary}</p>
                            </div>
                        )}

                        {result.entities_used?.length > 0 && (
                            <div style={{ background: "#0d1220", border: "1px solid #1e2a3a", borderRadius: "12px", padding: "16px" }}>
                                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, marginBottom: "10px" }}>
                                    DONNÉES — {result.entities_used.length} ENTITÉS SANCTIONNÉES UTILISÉES
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                    {result.entities_used.map((e, i) => (
                                        <span key={i} style={{
                                            padding: "3px 10px", borderRadius: "12px", fontSize: "11px",
                                            background: e.source === "OFAC" ? "#1e1a2e" : "#1a1e2e",
                                            border: `1px solid ${e.source === "OFAC" ? "#7c3aed" : "#1e3a5f"}`,
                                            color: e.source === "OFAC" ? "#a78bfa" : "#60a5fa",
                                        }}>{e.name}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {result.gdelt_events?.length > 0 && <EventMap events={result.gdelt_events} />}

                        {ans.timeline?.length > 0 && (
                            <div style={{ background: "#0d1220", border: "1px solid #1e2a3a", borderRadius: "12px", padding: "20px" }}>
                                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, marginBottom: "20px" }}>CHRONOLOGIE</div>
                                <div style={{ position: "relative" }}>
                                    <div style={{ position: "absolute", left: "60px", top: 0, bottom: 0, width: "2px", background: "#1e2a3a" }} />
                                    {ans.timeline.map((item, i) => (
                                        <div key={i} style={{ display: "flex", gap: "20px", marginBottom: "20px", position: "relative" }}>
                                            <div style={{
                                                width: "50px", flexShrink: 0, textAlign: "right",
                                                fontSize: "12px", fontWeight: 700,
                                                color: IMPORTANCE_COLORS[item.importance] || "#64748b", paddingTop: "2px"
                                            }}>{item.date}</div>
                                            <div style={{
                                                width: "12px", height: "12px", borderRadius: "50%", flexShrink: 0,
                                                background: IMPORTANCE_COLORS[item.importance] || "#64748b",
                                                border: "2px solid #0d1220", marginTop: "2px", zIndex: 1
                                            }} />
                                            <div style={{
                                                flex: 1, padding: "8px 14px", borderRadius: "8px",
                                                background: "#0a0e1a", border: "1px solid #1e2a3a",
                                                fontSize: "13px", lineHeight: 1.5, color: "#94a3b8"
                                            }}>{item.event}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {ans.sections?.length > 0 && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                {ans.sections.map((section, i) => (
                                    <div key={i} style={{
                                        background: "#0d1220", border: "1px solid #1e2a3a",
                                        borderRadius: "12px", padding: "18px"
                                    }}>
                                        <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>
                                            {section.icon} {section.title}
                                        </div>
                                        <div style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>{section.content}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {ans.key_figures?.length > 0 && (
                            <div style={{ background: "#0d1220", border: "1px solid #1e2a3a", borderRadius: "12px", padding: "20px" }}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "14px" }}>
                                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.08em" }}>
                                        ENTITÉS SANCTIONNÉES CITÉES
                                    </div>
                                    <div style={{ fontSize: "10px", color: "#334155", fontStyle: "italic" }}>
                                        descriptions générées par IA — à vérifier
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {ans.key_figures.map((fig, i) => {
                                        const isIndividual = fig.source === "OFAC"
                                            ? fig.role?.toLowerCase().includes("ministre")
                                            || fig.role?.toLowerCase().includes("général")
                                            || fig.role?.toLowerCase().includes("directeur")
                                            || fig.role?.toLowerCase().includes("président")
                                            || !fig.name?.includes(" ")
                                            : true;
                                        // Heuristique simple : si le nom contient "Bank", "Co.", "Corp", "Ltd", "Group" → organisation
                                        const orgKeywords = ["bank", "co.", "corp", "ltd", "group", "company", "holding",
                                            "ministry", "ministère", "organization", "agency", "fund",
                                            "industries", "trading", "international", "enterprise"];
                                        const nameLC = fig.name?.toLowerCase() || "";
                                        const isOrg = orgKeywords.some(k => nameLC.includes(k));
                                        const typeLabel = isOrg ? "Organisation" : "Individu";
                                        const typeBg   = isOrg ? "#0a1a2e" : "#0d1a0d";
                                        const typeColor = isOrg ? "#3b82f6" : "#34d399";

                                        return (
                                            <div key={i} style={{
                                                display: "flex", gap: "14px", alignItems: "flex-start",
                                                padding: "12px 14px", borderRadius: "10px",
                                                background: "#0a0e1a", border: "1px solid #1e2a3a",
                                            }}>
                                                {/* Type badge vertical */}
                                                <div style={{
                                                    fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em",
                                                    color: typeColor, background: typeBg,
                                                    border: `1px solid ${typeColor}33`,
                                                    borderRadius: "4px", padding: "3px 6px",
                                                    flexShrink: 0, marginTop: "1px", whiteSpace: "nowrap",
                                                }}>
                                                    {typeLabel.toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "3px" }}>
                                                        {fig.name}
                                                    </div>
                                                    <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>
                                                        {fig.role}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    fontSize: "10px", padding: "2px 7px", borderRadius: "4px",
                                                    flexShrink: 0,
                                                    background: fig.source === "OFAC" ? "#1e1a2e" : fig.source === "ONU" ? "#0a1a2e" : "#1a1a1a",
                                                    color: fig.source === "OFAC" ? "#a78bfa" : fig.source === "ONU" ? "#60a5fa" : "#64748b",
                                                    border: `1px solid ${fig.source === "OFAC" ? "#7c3aed44" : fig.source === "ONU" ? "#3b82f644" : "#33333344"}`,
                                                }}>
                                                    {fig.source}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {ans.sources?.length > 0 && (
                            <div style={{ background: "#0d1220", border: "1px solid #1e2a3a", borderRadius: "12px", padding: "16px" }}>
                                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, marginBottom: "10px" }}>SOURCES</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {ans.sources.map((src, i) => (
                                        <a key={i}
                                           href={src.url && src.url !== "null" ? src.url : undefined}
                                           target="_blank" rel="noreferrer"
                                           style={{
                                               padding: "4px 12px", borderRadius: "8px", fontSize: "12px",
                                               background: "#0a0e1a",
                                               border: `1px solid ${SOURCE_COLORS[src.type] || "#1e2a3a"}`,
                                               color: SOURCE_COLORS[src.type] || "#64748b",
                                               textDecoration: "none",
                                               cursor: src.url ? "pointer" : "default"
                                           }}>
                                            {src.type === "sanctions" ? "📋" : src.type === "gdelt" ? "📡" : "📚"} {src.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                );
            })()}
        </div>
    );
}