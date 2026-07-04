import { useState, useRef, useEffect } from "react";

const IMPORTANCE_COLORS = {
    high:   { dot: "#ef4444", label: "#ef4444", bg: "#1a0808" },
    medium: { dot: "#f97316", label: "#f97316", bg: "#1a0f08" },
    low:    { dot: "#3b82f6", label: "#3b82f6", bg: "#08111a" },
};

function parseYear(dateStr) {
    if (!dateStr) return null;
    const m = String(dateStr).match(/\d{4}/);
    return m ? parseInt(m[0]) : null;
}

export default function Timeline({ items = [] }) {
    const [selected, setSelected] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState(0);
    const trackRef = useRef(null);
    const isDragging = useRef(false);
    const dragStart = useRef(0);
    const offsetStart = useRef(0);

    // Filtre les items avec une année parseable
    const dated = items
        .map(item => ({ ...item, year: parseYear(item.date) }))
        .filter(item => item.year !== null)
        .sort((a, b) => a.year - b.year);

    if (dated.length === 0) return null;

    const minYear = dated[0].year;
    const maxYear = dated[dated.length - 1].year;
    const span = Math.max(maxYear - minYear, 1);

    const BASE_WIDTH = 900;
    const totalWidth = BASE_WIDTH * zoom;
    const PADDING = 60;
    const usable = totalWidth - PADDING * 2;

    const xFor = year => PADDING + ((year - minYear) / span) * usable;

    // Drag
    const onMouseDown = e => {
        isDragging.current = true;
        dragStart.current = e.clientX;
        offsetStart.current = offset;
        e.preventDefault();
    };
    const onMouseMove = e => {
        if (!isDragging.current) return;
        const delta = e.clientX - dragStart.current;
        const maxOffset = Math.max(0, totalWidth - BASE_WIDTH);
        setOffset(Math.max(0, Math.min(maxOffset, offsetStart.current - delta)));
    };
    const onMouseUp = () => { isDragging.current = false; };

    // Wheel zoom
    const onWheel = e => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 0.87;
        setZoom(z => Math.max(1, Math.min(8, z * factor)));
    };

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, []);

    // Années à afficher sur l'axe
    const tickCount = Math.min(12, Math.max(4, Math.floor(zoom * 4)));
    const tickYears = [];
    for (let i = 0; i <= tickCount; i++) {
        tickYears.push(Math.round(minYear + (span / tickCount) * i));
    }

    const SVG_H = 180;
    const AXIS_Y = 110;

    return (
        <div style={{
            background: "#0d1220", border: "1px solid #1e2a3a",
            borderRadius: "12px", padding: "20px", userSelect: "none",
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.08em" }}>
                        CHRONOLOGIE
                    </span>
                    <span style={{ fontSize: "10px", color: "#334155", fontStyle: "italic" }}>
                        générée par IA · scroll pour zoomer · glisser pour naviguer
                    </span>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {/* Légende */}
                    {[["high","Majeur"],["medium","Notable"],["low","Contexte"]].map(([k, l]) => (
                        <div key={k} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: IMPORTANCE_COLORS[k].dot }} />
                            <span style={{ fontSize: "10px", color: "#475569" }}>{l}</span>
                        </div>
                    ))}
                    <div style={{ width: 1, height: 14, background: "#1e2a3a", margin: "0 4px" }} />
                    {/* Zoom controls */}
                    {[["−", 0.7], ["+", 1.4]].map(([label, f]) => (
                        <button key={label} onClick={() => setZoom(z => Math.max(1, Math.min(8, z * f)))} style={{
                            width: 24, height: 24, borderRadius: 6, border: "1px solid #1e2a3a",
                            background: "#0a0e1a", color: "#94a3b8", cursor: "pointer",
                            fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{label}</button>
                    ))}
                    <button onClick={() => { setZoom(1); setOffset(0); setSelected(null); }} style={{
                        height: 24, padding: "0 8px", borderRadius: 6, border: "1px solid #1e2a3a",
                        background: "#0a0e1a", color: "#64748b", cursor: "pointer", fontSize: 10,
                    }}>Reset</button>
                </div>
            </div>

            {/* Frise SVG */}
            <div
                ref={trackRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                style={{
                    overflowX: "hidden", cursor: zoom > 1 ? "grab" : "default",
                    borderRadius: 8, background: "#080c14",
                    border: "1px solid #1e2a3a",
                }}
            >
                <svg
                    width={BASE_WIDTH}
                    height={SVG_H}
                    style={{ display: "block" }}
                >
                    <g transform={`translate(${-offset}, 0)`}>
                        {/* Axe */}
                        <line
                            x1={PADDING} y1={AXIS_Y}
                            x2={totalWidth - PADDING} y2={AXIS_Y}
                            stroke="#1e3a5f" strokeWidth={2}
                        />

                        {/* Ticks années */}
                        {tickYears.map(y => {
                            const x = xFor(y);
                            return (
                                <g key={y}>
                                    <line x1={x} y1={AXIS_Y - 4} x2={x} y2={AXIS_Y + 4} stroke="#2d4a6a" strokeWidth={1} />
                                    <text x={x} y={AXIS_Y + 18} textAnchor="middle" fontSize={10} fill="#475569">{y}</text>
                                </g>
                            );
                        })}

                        {/* Événements */}
                        {dated.map((item, i) => {
                            const x = xFor(item.year);
                            const colors = IMPORTANCE_COLORS[item.importance] || IMPORTANCE_COLORS.low;
                            const isAbove = i % 2 === 0;
                            const stemY1 = isAbove ? AXIS_Y - 10 : AXIS_Y + 10;
                            const stemY2 = isAbove ? AXIS_Y - 50 : AXIS_Y + 50;
                            const isSelected = selected?.date === item.date && selected?.event === item.event;

                            return (
                                <g key={i} onClick={() => setSelected(isSelected ? null : item)} style={{ cursor: "pointer" }}>
                                    {/* Tige */}
                                    <line
                                        x1={x} y1={stemY1} x2={x} y2={stemY2}
                                        stroke={isSelected ? colors.dot : "#1e3a5f"}
                                        strokeWidth={isSelected ? 2 : 1}
                                        strokeDasharray={isSelected ? "none" : "3,2"}
                                    />
                                    {/* Point */}
                                    <circle
                                        cx={x} cy={AXIS_Y}
                                        r={isSelected ? 8 : item.importance === "high" ? 6 : 4}
                                        fill={colors.dot}
                                        fillOpacity={isSelected ? 1 : 0.85}
                                        stroke={isSelected ? "#fff" : "#080c14"}
                                        strokeWidth={isSelected ? 2 : 1}
                                    />
                                    {/* Halo sélection */}
                                    {isSelected && (
                                        <circle cx={x} cy={AXIS_Y} r={14} fill={colors.dot} fillOpacity={0.15} />
                                    )}
                                    {/* Label date */}
                                    <text
                                        x={x} y={isAbove ? stemY2 - 6 : stemY2 + 14}
                                        textAnchor="middle" fontSize={9}
                                        fontWeight={700}
                                        fill={isSelected ? colors.label : "#475569"}
                                    >
                                        {item.date}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </div>

            {/* Panneau détail */}
            {selected && (() => {
                const colors = IMPORTANCE_COLORS[selected.importance] || IMPORTANCE_COLORS.low;
                return (
                    <div style={{
                        marginTop: "12px",
                        background: colors.bg,
                        border: `1px solid ${colors.dot}44`,
                        borderLeft: `3px solid ${colors.dot}`,
                        borderRadius: "10px", padding: "14px 18px",
                        display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px",
                    }}>
                        <div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: colors.dot, marginBottom: "6px", letterSpacing: "0.06em" }}>
                                {selected.date} · {selected.importance === "high" ? "Événement majeur" : selected.importance === "medium" ? "Événement notable" : "Contexte"}
                            </div>
                            <div style={{ fontSize: "14px", color: "#e2e8f0", lineHeight: 1.6 }}>
                                {selected.event}
                            </div>
                            <div style={{ fontSize: "10px", color: "#334155", marginTop: "8px", fontStyle: "italic" }}>
                                Généré par IA — à vérifier auprès des sources primaires
                            </div>
                        </div>
                        <button onClick={() => setSelected(null)} style={{
                            background: "none", border: "none", color: "#475569",
                            cursor: "pointer", fontSize: 16, flexShrink: 0, padding: 0,
                        }}>✕</button>
                    </div>
                );
            })()}

            {/* Mini-liste des événements majeurs */}
            <div style={{ marginTop: "14px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {dated.filter(i => i.importance === "high").map((item, i) => (
                    <button key={i} onClick={() => setSelected(item)} style={{
                        padding: "3px 10px", borderRadius: "20px", fontSize: "11px",
                        border: `1px solid ${selected?.event === item.event ? "#ef4444" : "#1e2a3a"}`,
                        background: selected?.event === item.event ? "#1a0808" : "transparent",
                        color: selected?.event === item.event ? "#ef4444" : "#64748b",
                        cursor: "pointer",
                    }}>
                        {item.date}
                    </button>
                ))}
            </div>
        </div>
    );
}