import { useState, useEffect } from "react";
import axios from "axios";

const SECTOR_KEYWORDS = {
    "Énergie & Pétrole": ["oil", "gas", "petro", "energy", "refin", "fuel"],
    "Banque & Finance": ["bank", "financial", "investment", "credit", "insurance"],
    "Shipping & Transport": ["shipping", "tanker", "vessel", "maritime", "transport"],
    "Nucléaire": ["nuclear", "atomic", "uranium", "isotope", "radiation"],
    "Militaire": ["defense", "armament", "missile", "military", "shahid", "industries group"],
};

function detectSector(name) {
    const lower = name.toLowerCase();
    for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
        if (keywords.some(k => lower.includes(k))) return sector;
    }
    return "Autre";
}

function countBySector(entities) {
    const counts = {};
    for (const e of entities) {
        const sector = detectSector(e.name);
        counts[sector] = (counts[sector] || 0) + 1;
    }
    return counts;
}

const SECTOR_COLORS = {
    "Énergie & Pétrole": "#f97316",
    "Banque & Finance": "#3b82f6",
    "Shipping & Transport": "#06b6d4",
    "Nucléaire": "#8b5cf6",
    "Militaire": "#ef4444",
    "Autre": "#64748b",
};

function ProgramDetail({ program, onBack }) {
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState("ofac_only");
    const [search, setSearch] = useState("");

    useEffect(() => {
        axios.get(`http://localhost:8000/analysis/divergence?program=${program.key}`)
            .then(r => setData(r.data));
    }, [program.key]);

    if (!data) return (
        <div style={{ padding: 40, color: "#64748b", textAlign: "center" }}>
            Chargement...
        </div>
    );

    const ofacSectors = countBySector(data.ofac_only);
    const maxSector = Math.max(...Object.values(ofacSectors), 1);
    const filtered = (data[activeTab] || []).filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto", color: "#e2e8f0" }}>

            <button onClick={onBack} style={{
                background: "none", border: "none", color: "#64748b",
                cursor: "pointer", fontSize: "13px", marginBottom: "20px", padding: 0
            }}>
                ← Retour à la vue d'ensemble
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <span style={{ fontSize: "32px" }}>{program.flag}</span>
                <h1 style={{ fontSize: "26px", fontWeight: 800 }}>{program.label}</h1>
            </div>
            <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "28px" }}>
                Analyse comparative des sanctions OFAC (américaines) vs ONU (multilatérales)
            </p>

            {/* Métriques */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
                {[
                    { label: "Entités OFAC", value: data.ofac_total, color: "#ef4444" },
                    { label: "Entités ONU", value: data.un_total, color: "#3b82f6" },
                    { label: "En commun", value: data.both.length, color: "#10b981" },
                    { label: "Divergence", value: `${data.divergence_rate}%`, color: program.color || "#f97316" },
                ].map(m => (
                    <div key={m.label} style={{
                        background: "#0d1220", border: "1px solid #1e2a3a",
                        borderRadius: "12px", padding: "16px"
                    }}>
                        <div style={{ fontSize: "28px", fontWeight: 800, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{m.label}</div>
                    </div>
                ))}
            </div>

            {/* Secteurs */}
            {Object.keys(ofacSectors).length > 0 && (
                <div style={{
                    background: "#0d1220", border: "1px solid #1e2a3a",
                    borderRadius: "12px", padding: "20px", marginBottom: "20px"
                }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, marginBottom: "16px" }}>
                        RÉPARTITION PAR SECTEUR — SANCTIONS OFAC
                    </div>
                    {Object.entries(ofacSectors).sort((a, b) => b[1] - a[1]).map(([sector, count]) => (
                        <div key={sector} style={{ marginBottom: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                <span style={{ fontSize: "12px", color: SECTOR_COLORS[sector] }}>{sector}</span>
                                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{count}</span>
                            </div>
                            <div style={{ background: "#1e2a3a", borderRadius: "4px", height: "6px" }}>
                                <div style={{
                                    background: SECTOR_COLORS[sector],
                                    width: `${(count / maxSector) * 100}%`,
                                    height: "6px", borderRadius: "4px"
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Liste entités */}
            <div style={{ background: "#0d1220", border: "1px solid #1e2a3a", borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
                    {[
                        { key: "ofac_only", label: `OFAC uniquement (${data.ofac_only.length})`, color: "#ef4444" },
                        { key: "un_only", label: `ONU uniquement (${data.un_only.length})`, color: "#3b82f6" },
                        { key: "both", label: `Les deux (${data.both.length})`, color: "#10b981" },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                            padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                            background: activeTab === tab.key ? tab.color : "#1e2a3a",
                            color: "#e2e8f0", fontSize: "12px", fontWeight: activeTab === tab.key ? 700 : 400,
                        }}>
                            {tab.label}
                        </button>
                    ))}
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Filtrer..."
                        style={{
                            marginLeft: "auto", background: "#1e2a3a", border: "1px solid #2d3748",
                            borderRadius: "8px", padding: "6px 12px", color: "#e2e8f0", fontSize: "12px"
                        }}
                    />
                </div>

                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {filtered.slice(0, 100).map(e => (
                        <div key={e.id} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "7px 0", borderBottom: "1px solid #1e2a3a"
                        }}>
                            <div>
                                <span style={{ fontSize: "13px" }}>{e.name}</span>
                                <span style={{
                                    marginLeft: "8px", fontSize: "11px", color: "#64748b",
                                    background: "#1e2a3a", padding: "1px 6px", borderRadius: "4px"
                                }}>
                  {detectSector(e.name)}
                </span>
                            </div>
                            <span style={{
                                fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
                                background: e.type === "Individual" ? "#1e3a5f" : "#1e2a3a",
                                color: e.type === "Individual" ? "#60a5fa" : "#94a3b8"
                            }}>
                {e.type}
              </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function DivergenceAnalysis() {
    const [overview, setOverview] = useState(null);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        axios.get("http://localhost:8000/analysis/overview").then(r => setOverview(r.data));
    }, []);

    if (selected) return <ProgramDetail program={selected} onBack={() => setSelected(null)} />;

    return (
        <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto", color: "#e2e8f0" }}>

            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>
                    ⚖️ Comparer les sanctions
                </h1>
                <p style={{ color: "#64748b", fontSize: "13px" }}>
                    Vue d'ensemble des régimes de sanctions par pays — divergences entre OFAC (américain) et ONU (multilatéral)
                </p>
            </div>

            {!overview ? (
                <div style={{ color: "#64748b", textAlign: "center", padding: 40 }}>Chargement...</div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                    {overview.map(p => (
                        <div
                            key={p.key}
                            onClick={() => setSelected(p)}
                            style={{
                                background: "#0d1220", border: "1px solid #1e2a3a",
                                borderRadius: "14px", padding: "24px", cursor: "pointer",
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = p.color}
                            onMouseLeave={e => e.currentTarget.style.borderColor = "#1e2a3a"}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{ fontSize: "24px" }}>{p.flag}</span>
                                    <div>
                                        <div style={{ fontSize: "16px", fontWeight: 700 }}>{p.label}</div>
                                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                            {p.total} entités sanctionnées
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: "20px", fontWeight: 800, color: p.color
                                }}>
                                    {p.divergence}%
                                </div>
                            </div>

                            {/* Barre OFAC vs ONU */}
                            <div style={{ marginBottom: "12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                                    <span>OFAC : {p.ofac}</span>
                                    <span>ONU : {p.un}</span>
                                    {p.cn > 0 && <span>CN : {p.cn}</span>}
                                </div>
                                <div style={{ background: "#1e2a3a", borderRadius: "4px", height: "6px", display: "flex", overflow: "hidden" }}>
                                    <div style={{
                                        background: "#ef4444",
                                        width: `${p.total > 0 ? (p.ofac / p.total) * 100 : 0}%`,
                                        height: "6px"
                                    }} />
                                    <div style={{
                                        background: "#3b82f6",
                                        width: `${p.total > 0 ? (p.un / p.total) * 100 : 0}%`,
                                        height: "6px"
                                    }} />
                                    {p.cn > 0 && <div style={{
                                        background: "#dc2626",
                                        width: `${p.total > 0 ? (p.cn / p.total) * 100 : 0}%`,
                                        height: "6px"
                                    }} />}
                                </div>
                            </div>

                            <div style={{ fontSize: "12px", color: p.color, fontWeight: 600 }}>
                                {p.divergence > 90 ? "Sanctions quasi-unilatérales américaines" :
                                    p.divergence > 50 ? "Forte divergence US/ONU" :
                                        "Consensus international relatif"} →
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}