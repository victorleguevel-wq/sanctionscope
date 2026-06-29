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

export default function DivergenceAnalysis() {
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState("ofac_only");
    const [search, setSearch] = useState("");

    useEffect(() => {
        axios.get("http://localhost:8000/analysis/divergence?program=IRAN")
            .then(r => setData(r.data));
    }, []);

    if (!data) return (
        <div style={{ padding: 40, color: "#64748b" }}>Chargement de l'analyse...</div>
    );

    const ofacSectors = countBySector(data.ofac_only);
    const unSectors = countBySector(data.un_only);
    const maxSector = Math.max(...Object.values(ofacSectors));

    const filtered = (data[activeTab] || []).filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto", color: "#e2e8f0" }}>

            {/* Titre */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
                    Iran — Analyse de la divergence des sanctions
                </h1>
                <p style={{ color: "#94a3b8", fontSize: "15px", lineHeight: 1.6 }}>
                    Les États-Unis sanctionnent l'Iran de façon quasi-unilatérale.
                    Sur <strong style={{ color: "#f97316" }}>{data.ofac_total + data.un_total} entités</strong> sanctionnées au total,
                    seulement <strong style={{ color: "#10b981" }}>{data.both.length}</strong> le sont conjointement par l'OFAC et l'ONU.
                    Ce gap révèle deux stratégies fondamentalement différentes face à Téhéran.
                </p>
            </div>

            {/* Métriques clés */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
                {[
                    { label: "Entités OFAC", value: data.ofac_total, color: "#ef4444", desc: "Sanctions américaines" },
                    { label: "Entités ONU", value: data.un_total, color: "#3b82f6", desc: "Sanctions multilatérales" },
                    { label: "En commun", value: data.both.length, color: "#10b981", desc: "Consensus international" },
                    { label: "Divergence", value: `${data.divergence_rate}%`, color: "#f97316", desc: "Sanctions unilatérales US" },
                ].map(m => (
                    <div key={m.label} style={{
                        background: "#0d1220", border: "1px solid #1e2a3a",
                        borderRadius: "12px", padding: "20px"
                    }}>
                        <div style={{ fontSize: "32px", fontWeight: 800, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: "14px", fontWeight: 600, marginTop: "4px" }}>{m.label}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{m.desc}</div>
                    </div>
                ))}
            </div>

            {/* Graphe par secteur */}
            <div style={{
                background: "#0d1220", border: "1px solid #1e2a3a",
                borderRadius: "12px", padding: "24px", marginBottom: "32px"
            }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px" }}>
                    Répartition par secteur — Sanctions OFAC uniquement
                </h2>
                {Object.entries(ofacSectors)
                    .sort((a, b) => b[1] - a[1])
                    .map(([sector, count]) => (
                        <div key={sector} style={{ marginBottom: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                <span style={{ fontSize: "13px", color: SECTOR_COLORS[sector] }}>{sector}</span>
                                <span style={{ fontSize: "13px", color: "#94a3b8" }}>{count} entités</span>
                            </div>
                            <div style={{ background: "#1e2a3a", borderRadius: "4px", height: "8px" }}>
                                <div style={{
                                    background: SECTOR_COLORS[sector],
                                    width: `${(count / maxSector) * 100}%`,
                                    height: "8px", borderRadius: "4px",
                                    transition: "width 0.5s ease"
                                }} />
                            </div>
                        </div>
                    ))}
            </div>

            {/* Analyse narrative */}
            <div style={{
                background: "#0d1220", border: "1px solid #1e2a3a",
                borderRadius: "12px", padding: "24px", marginBottom: "32px"
            }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
                    💡 Ce que révèlent les données
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ padding: "16px", background: "#0a0e1a", borderRadius: "8px", borderLeft: "3px solid #ef4444" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444", marginBottom: "8px" }}>
                            🇺🇸 Stratégie américaine — Étranglement économique
                        </div>
                        <div style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>
                            L'OFAC cible l'ensemble de l'économie iranienne : banques, pétrole,
                            shipping, crypto-monnaies. L'objectif est de priver Téhéran de tout
                            accès au système financier international.
                        </div>
                    </div>
                    <div style={{ padding: "16px", background: "#0a0e1a", borderRadius: "8px", borderLeft: "3px solid #3b82f6" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", marginBottom: "8px" }}>
                            🌍 Stratégie ONU — Ciblage nucléaire et militaire
                        </div>
                        <div style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>
                            L'ONU se limite aux entités directement liées au programme nucléaire
                            et balistique. Cette approche multilatérale reflète le consensus
                            minimum obtenu avec la Russie et la Chine au Conseil de Sécurité.
                        </div>
                    </div>
                </div>
            </div>

            {/* Liste des entités */}
            <div style={{ background: "#0d1220", border: "1px solid #1e2a3a", borderRadius: "12px", padding: "24px" }}>
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
                    {[
                        { key: "ofac_only", label: `OFAC uniquement (${data.ofac_only.length})`, color: "#ef4444" },
                        { key: "un_only", label: `ONU uniquement (${data.un_only.length})`, color: "#3b82f6" },
                        { key: "both", label: `Les deux (${data.both.length})`, color: "#10b981" },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                            padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                            background: activeTab === tab.key ? tab.color : "#1e2a3a",
                            color: "#e2e8f0", fontSize: "13px", fontWeight: activeTab === tab.key ? 700 : 400,
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
                            borderRadius: "8px", padding: "6px 14px", color: "#e2e8f0", fontSize: "13px"
                        }}
                    />
                </div>

                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {filtered.slice(0, 100).map(e => (
                        <div key={e.id} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "8px 0", borderBottom: "1px solid #1e2a3a"
                        }}>
                            <div>
                                <span style={{ fontSize: "13px" }}>{e.name}</span>
                                <span style={{
                                    marginLeft: "8px", fontSize: "11px", color: "#64748b",
                                    background: "#1e2a3a", padding: "2px 6px", borderRadius: "4px"
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