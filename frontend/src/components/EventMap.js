import { useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const STATIC_COORDS = {
    "Iran": [53.6880, 32.4279],
    "Tehran": [51.3890, 35.6892],
    "Mashhad": [59.6168, 36.2605],
    "Isfahan": [51.6674, 32.6539],
    "Natanz": [51.9260, 33.5228],
    "Fordow": [50.9940, 34.8849],
    "Arak": [49.8490, 34.0955],
    "Russia": [105.3188, 61.5240],
    "Iraq": [43.6793, 33.2232],
    "Syria": [38.9968, 34.8021],
    "Israel": [34.8516, 31.0461],
    "Saudi Arabia": [45.0792, 23.8859],
    "UAE": [53.8478, 23.4241],
    "Dubai": [55.2708, 25.2048],
    "Qatar": [51.1839, 25.3548],
    "Oman": [57.5523, 21.4735],
    "USA": [-95.7129, 37.0902],
    "China": [104.1954, 35.8617],
    "Hormuz": [56.4681, 26.5765],
    "Germany": [10.4515, 51.1657],
    "France": [2.2137, 46.2276],
    "UK": [-3.4359, 55.3781],
};

function getCoords(ev) {
    const lat = parseFloat(ev.lat);
    const lon = parseFloat(ev.lon);
    if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) return [lon, lat];
    if (!ev.location || ev.location === "nan") return null;
    for (const [name, coords] of Object.entries(STATIC_COORDS)) {
        if (ev.location.includes(name)) return coords;
    }
    return null;
}

function toneColor(goldstein) {
    if (goldstein < -5) return "#ef4444";
    if (goldstein < -2) return "#f97316";
    if (goldstein < 0)  return "#eab308";
    return "#10b981";
}

function toneLabel(goldstein) {
    if (goldstein < -5) return "Critique";
    if (goldstein < -2) return "Négatif";
    if (goldstein < 0)  return "Tension";
    return "Positif";
}

export default function EventMap({ events }) {
    const [position, setPosition] = useState({ coordinates: [50, 28], zoom: 2.5 });
    const [markerTooltip, setMarkerTooltip] = useState(null);
    const [countryTooltip, setCountryTooltip] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    if (!events || events.length === 0) return null;

    const markers = events
        .map(ev => ({ ...ev, coords: getCoords(ev) }))
        .filter(ev => ev.coords);

    const missing = events.length - markers.length;

    return (
        <div
            style={{
                background: "#0d1220",
                border: "1px solid #1e2a3a",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "16px",
            }}
            onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
        >
            {/* Header */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 20px", borderBottom: "1px solid #1e2a3a",
            }}>
                <div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em" }}>
                        🌍 ÉVÉNEMENTS GDELT TEMPS RÉEL
                    </span>
                    <span style={{
                        marginLeft: "10px", fontSize: "11px", color: "#3b82f6",
                        background: "#1e2a3a", padding: "2px 8px", borderRadius: "10px",
                    }}>
                        {markers.length} localisés{missing > 0 ? ` · ${missing} sans coords` : ""}
                    </span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                    {[
                        { label: "+", action: () => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 10) })) },
                        { label: "−", action: () => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) })) },
                        { label: "↺", action: () => setPosition({ coordinates: [50, 28], zoom: 2.5 }) },
                    ].map(({ label, action }) => (
                        <button key={label} onClick={action} style={{
                            width: "28px", height: "28px", borderRadius: "6px", border: "none",
                            background: "#1e2a3a", color: "#94a3b8", cursor: "pointer",
                            fontSize: label === "↺" ? "14px" : "18px", lineHeight: 1,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{label}</button>
                    ))}
                </div>
            </div>

            {/* Carte */}
            <div style={{ position: "relative" }}>
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ scale: 120 }}
                    style={{ width: "100%", height: "320px", background: "#080c14" }}
                >
                    <ZoomableGroup
                        zoom={position.zoom}
                        center={position.coordinates}
                        onMoveEnd={setPosition}
                    >
                        <Geographies geography={GEO_URL}>
                            {({ geographies }) =>
                                geographies.map(geo => (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill="#1a2438"
                                        stroke="#0d1220"
                                        strokeWidth={0.4}
                                        style={{
                                            hover: { fill: "#243048", outline: "none" },
                                            default: { outline: "none" },
                                            pressed: { outline: "none" },
                                        }}
                                        onMouseEnter={() => {
                                            const name = geo.properties.name;
                                            if (name) setCountryTooltip(name);
                                        }}
                                        onMouseLeave={() => setCountryTooltip(null)}
                                    />
                                ))
                            }
                        </Geographies>

                        {markers.map((ev, i) => {
                            const color = toneColor(ev.goldstein);
                            const r = ev.goldstein < -5 ? 5 : ev.goldstein < -2 ? 4 : 3;
                            return (
                                <Marker
                                    key={i}
                                    coordinates={ev.coords}
                                    onMouseEnter={() => { setMarkerTooltip(ev); setCountryTooltip(null); }}
                                    onMouseLeave={() => setMarkerTooltip(null)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {ev.goldstein < -5 && (
                                        <circle r={r + 4} fill={color} fillOpacity={0.15} />
                                    )}
                                    <circle
                                        r={r}
                                        fill={color}
                                        fillOpacity={0.9}
                                        stroke="#0d1220"
                                        strokeWidth={0.8}
                                    />
                                </Marker>
                            );
                        })}
                    </ZoomableGroup>
                </ComposableMap>

                {/* Tooltip événement (marker) */}
                {markerTooltip && (
                    <div style={{
                        position: "absolute", top: "12px", left: "12px",
                        background: "#0d1220", border: `1px solid ${toneColor(markerTooltip.goldstein)}`,
                        borderRadius: "8px", padding: "10px 14px", maxWidth: "260px",
                        pointerEvents: "none", zIndex: 10,
                    }}>
                        <div style={{ fontSize: "11px", color: toneColor(markerTooltip.goldstein), fontWeight: 700, marginBottom: "4px" }}>
                            {toneLabel(markerTooltip.goldstein)} · {markerTooltip.goldstein > 0 ? "+" : ""}{markerTooltip.goldstein?.toFixed(1)}
                        </div>
                        <div style={{ fontSize: "12px", color: "#e2e8f0", marginBottom: "3px" }}>
                            {markerTooltip.event_type}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                            {markerTooltip.location} · {markerTooltip.date}
                        </div>
                        {markerTooltip.actor1 && markerTooltip.actor1 !== "nan" && (
                            <div style={{ fontSize: "11px", color: "#60a5fa", marginTop: "4px" }}>
                                {markerTooltip.actor1}
                                {markerTooltip.actor2 && markerTooltip.actor2 !== "nan" && ` → ${markerTooltip.actor2}`}
                            </div>
                        )}
                    </div>
                )}

                {/* Tooltip pays (géographie) */}
                {countryTooltip && !markerTooltip && (
                    <div style={{
                        position: "fixed",
                        left: mousePos.x + 14,
                        top: mousePos.y - 32,
                        background: "#0d1220",
                        border: "1px solid #1e2a3a",
                        borderRadius: "6px",
                        padding: "5px 10px",
                        fontSize: "12px",
                        color: "#e2e8f0",
                        pointerEvents: "none",
                        zIndex: 1000,
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    }}>
                        {countryTooltip}
                    </div>
                )}

                {/* Légende */}
                <div style={{
                    position: "absolute", bottom: "12px", right: "12px",
                    background: "rgba(13,18,32,0.85)", border: "1px solid #1e2a3a",
                    borderRadius: "6px", padding: "8px 10px",
                    display: "flex", flexDirection: "column", gap: "4px",
                }}>
                    {[
                        { color: "#ef4444", label: "Critique (< −5)" },
                        { color: "#f97316", label: "Négatif (< −2)" },
                        { color: "#eab308", label: "Tension (< 0)" },
                        { color: "#10b981", label: "Positif" },
                    ].map(({ color, label }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                            <span style={{ fontSize: "10px", color: "#64748b" }}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Liste événements */}
            <div style={{ padding: "4px 0" }}>
                {events.slice(0, 6).map((ev, i) => (
                    <div key={i} style={{
                        display: "flex", gap: "12px", padding: "9px 20px",
                        borderTop: "1px solid #1e2a3a", alignItems: "center",
                    }}>
                        <div style={{
                            width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                            background: toneColor(ev.goldstein),
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "12px", color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {ev.actor1 && ev.actor1 !== "nan"
                                    ? <><span style={{ color: "#60a5fa" }}>{ev.actor1}</span>
                                        {ev.actor2 && ev.actor2 !== "nan" && <> → <span style={{ color: "#a78bfa" }}>{ev.actor2}</span></>}
                                        <span style={{ color: "#64748b" }}> · {ev.event_type}</span>
                                    </>
                                    : <span style={{ color: "#64748b" }}>{ev.event_type}</span>
                                }
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                📍 {ev.location !== "nan" ? ev.location : "—"} · {ev.date}
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                            <span style={{
                                fontSize: "11px", padding: "2px 7px", borderRadius: "4px",
                                background: ev.goldstein < 0 ? "#1a0a0a" : "#0a1a0a",
                                color: toneColor(ev.goldstein),
                                fontVariantNumeric: "tabular-nums",
                            }}>
                                {ev.goldstein > 0 ? "+" : ""}{ev.goldstein?.toFixed(1)}
                            </span>
                            {ev.url && ev.url !== "nan" && (
                                <a href={ev.url} target="_blank" rel="noreferrer" style={{
                                    fontSize: "11px", color: "#3b82f6", textDecoration: "none",
                                }}>↗</a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}