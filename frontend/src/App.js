import { useState } from "react";
import Stats from "./components/Stats";
import SanctionsMap from "./components/SanctionsMap";
import Ask from "./components/Ask";
import Home from "./components/Home";
import About from "./components/About";
import "./index.css";

export default function App() {
    const [page, setPage] = useState("home");
    const [initialQuestion, setInitialQuestion] = useState("");

    const navigate = (p, question = "") => {
        setPage(p);
        if (question) setInitialQuestion(question);
    };

    return (
        <div style={{ display: "flex", height: "100vh", flexDirection: "column", background: "#0a0e1a" }}>

            {page !== "home" && (
                <header style={{
                    padding: "12px 24px",
                    borderBottom: "1px solid #1e2a3a",
                    display: "flex", alignItems: "center", gap: "20px",
                    background: "#0d1220", flexShrink: 0,
                }}>
                    <button onClick={() => setPage("home")} style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "18px", fontWeight: 700, color: "#60a5fa",
                    }}>
                        🌐 SanctionScope
                    </button>

                    <div style={{ display: "flex", gap: "6px" }}>
                        {[
                            { key: "ask",      label: "🔍 Analyser" },
                            { key: "analysis", label: "⚖️ Comparer" },
                            { key: "about",    label: "À propos" },
                        ].map(p => (
                            <button key={p.key} onClick={() => setPage(p.key)} style={{
                                padding: "6px 14px", borderRadius: "8px", border: "none",
                                cursor: "pointer",
                                background: page === p.key ? "#1e3a5f" : "transparent",
                                color: page === p.key ? "#60a5fa" : "#64748b",
                                fontSize: "13px", fontWeight: page === p.key ? 700 : 400,
                            }}>
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ marginLeft: "auto" }}>
                        <Stats />
                    </div>
                </header>
            )}

            <div style={{ flex: 1, overflow: "auto" }}>
                {page === "home"     ? <Home onNavigate={navigate} /> :
                    page === "analysis" ? <SanctionsMap />:
                        page === "about"    ? <About /> :
                            <Ask initialQuestion={initialQuestion} />}
            </div>
        </div>
    );
}