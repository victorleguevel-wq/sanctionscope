import { useState } from "react";
import Graph from "./components/Graph";
import Sidebar from "./components/Sidebar";
import Stats from "./components/Stats";
import "./index.css";

export default function App() {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);

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
                <Stats />
            </header>
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                <Graph search={search} onSelect={setSelected} />
                <Sidebar entity={selected} />
            </div>
        </div>
    );
}