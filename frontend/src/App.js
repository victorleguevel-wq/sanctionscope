import { useState } from "react";
import Graph from "./components/Graph";
import Sidebar from "./components/Sidebar";
import Stats from "./components/Stats";
import DivergenceAnalysis from "./components/DivergenceAnalysis";
import "./index.css";
import Ask from "./components/Ask";

export default function App() {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);
    const [page, setPage] = useState("graph");

    return (
        <div style={{ display: "flex", height: "100vh", flexDirection: "column" }}>
            <header style={{
                padding: "16px 24px",
                borderBottom: "1px solid #1e2a3a",
                display: "flex",
                alignItems: "center",
                gap: "24px",
                background: "#0d1220",
            }}>
                <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#60a5fa" }}>
                    🌐 SanctionScope
                </h1>

                {/* Navigation */}
                <div style={{ display: "flex", gap: "8px" }}>
                    {[
                        { key: "graph", label: "Graphe" },
                        { key: "analysis", label: "Analyse Iran" },
                        { key: "ask", label: "🔍 Analyser" },
                    ].map(p => (
                        <button key={p.key} onClick={() => setPage(p.key)} style={{
                            padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                            background: page === p.key ? "#3b82f6" : "#1e2a3a",
                            color: "#e2e8f0", fontSize: "13px", fontWeight: page === p.key ? 700 : 400,
                        }}>
                            {p.label}
                        </button>
                    ))}
                </div>

                {page === "graph" && (
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher une entité..."
                        style={{
                            background: "#1e2a3a",
                            border: "1px solid #2d3748",
                            borderRadius: "8px",
                            padding: "8px 16px",
                            color: "#e2e8f0",
                            width: "300px",
                            fontSize: "14px",
                        }}
                    />
                )}
                <Stats />
            </header>

            <div style={{ flex: 1, overflow: "auto" }}>
                {page === "graph" ? (
                    <div style={{ display: "flex", height: "100%" }}>
                        <Graph search={search} onSelect={setSelected} />
                        <Sidebar entity={selected} />
                    </div>
                ) : page === "analysis" ? (
                    <DivergenceAnalysis />
                ) : (
                    <Ask />
                )}
            </div>
        </div>
    );
}