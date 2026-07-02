import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
} from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const COUNTRY_NAMES = {
    IR: "Iran", RU: "Russie", KP: "Corée du Nord", CU: "Cuba",
    SY: "Syrie", VE: "Venezuela", BY: "Biélorussie", MM: "Myanmar",
    SD: "Soudan", SO: "Somalie", LY: "Libye", IQ: "Irak",
    AF: "Afghanistan", ZW: "Zimbabwe", BI: "Burundi", CF: "Rép. Centrafricaine",
    CD: "RD Congo", ET: "Éthiopie", HT: "Haïti", ML: "Mali",
    NI: "Nicaragua", SS: "Soudan du Sud", YE: "Yémen", UA: "Ukraine",
    US: "États-Unis", RS: "Serbie / Balkans",
};

const ISO_NUM_TO_2 = {
    "004": "AF", "050": "BD", "112": "BY", "068": "BO", "108": "BI",
    "140": "CF", "170": "CO", "180": "CD", "192": "CU", "818": "EG",
    "231": "ET", "332": "HT", "368": "IQ", "364": "IR", "408": "KP",
    "418": "LA", "434": "LY", "466": "ML", "104": "MM", "558": "NI",
    "706": "SO", "728": "SS", "760": "SY", "800": "UG", "804": "UA",
    "858": "UY", "862": "VE", "887": "YE", "716": "ZW", "643": "RU",
    "840": "US", "156": "CN", "076": "BR", "356": "IN", "276": "DE",
    "250": "FR", "826": "GB", "392": "JP", "410": "KR", "682": "SA",
    "784": "AE", "586": "PK", "566": "NG", "024": "AO", "288": "GH",
    "688": "RS",
};

const SOURCE_COLORS = { OFAC: "#ef4444", UN: "#3b82f6", CN: "#f59e0b", EU: "#22c55e" };
const SOURCE_LABELS = { OFAC: "États-Unis (OFAC)", UN: "Nations Unies", CN: "Chine", EU: "Union Européenne" };
const ALL_SOURCES = ["OFAC", "UN", "EU", "CN"];

function countryColor(data, activeSources) {
    if (!data) return "#1a2438";
    const sources = Object.keys(data.sanctioners).filter(s => activeSources.includes(s));
    if (sources.length === 0) return "#1a2438";
    if (sources.length >= 2) return "#7c3aed";
    return SOURCE_COLORS[sources[0]] || "#64748b";
}

function countryOpacity(data, activeSources) {
    if (!data) return 1;
    const total = Object.entries(data.sanctioners)
        .filter(([src]) => activeSources.includes(src))
        .reduce((s, [, d]) => s + d.count, 0);
    if (total === 0) return 1;
    if (total > 500) return 1;
    if (total > 100) return 0.85;
    if (total > 20)  return 0.65;
    return 0.45;
}

function downloadCSV(filename, rows) {
    if (!rows.length) return;
    const headers = ["id", "name", "type", "source", "programs"];
    const csvLines = [
        headers.join(","),
        ...rows.map(r => headers.map(h => {
            let val = r[h];
            if (Array.isArray(val)) val = val.join("; ");
            val = String(val ?? "").replace(/"/g, '""');
            return `"${val}"`;
        }).join(","))
    ];
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function SanctionsMap() {
    const [mapData, setMapData] = useState({});
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [position, setPosition] = useState({ coordinates: [15, 20], zoom: 1.2 });
    const [hoveredCountry, setHoveredCountry] = useState(null);

    const [entities, setEntities] = useState([]);
    const [entitiesLoading, setEntitiesLoading] = useState(false);
    const [sourceFilter, setSourceFilter] = useState(null); // filtre dans le panel

    // NOUVEAU — filtres actifs sur la carte (USA / ONU / Chine / EU)
    const [activeSources, setActiveSources] = useState(ALL_SOURCES);

    // NOUVEAU — recherche globale
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState({ countries: [], entities: [] });
    const [searchOpen, setSearchOpen] = useState(false);
    const searchDebounce = useRef(null);

    useEffect(() => {
        axios.get("http://localhost:8000/analysis/sanctions-map")
            .then(r => { setMapData(r.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selected) {
            setEntities([]);
            setSourceFilter(null);
            return;
        }
        setEntitiesLoading(true);
        setSourceFilter(null);
        axios.get(`http://localhost:8000/analysis/country/${selected.target_country}`)
            .then(r => setEntities(r.data))
            .catch(() => setEntities([]))
            .finally(() => setEntitiesLoading(false));
    }, [selected]);

    // NOUVEAU — recherche debouncée (pays locaux + entités via API)
    useEffect(() => {
        if (searchDebounce.current) clearTimeout(searchDebounce.current);

        if (!searchQuery || searchQuery.trim().length < 2) {
            setSearchResults({ countries: [], entities: [] });
            return;
        }

        searchDebounce.current = setTimeout(() => {
            const q = searchQuery.trim().toLowerCase();

            const countryMatches = Object.entries(mapData)
                .filter(([iso2]) => {
                    const name = (COUNTRY_NAMES[iso2] || iso2).toLowerCase();
                    return name.includes(q) || iso2.toLowerCase().includes(q);
                })
                .map(([iso2, data]) => ({ iso2, name: COUNTRY_NAMES[iso2] || iso2, total: data.total }))
                .slice(0, 5);

            axios.get(`http://localhost:8000/entities`, { params: { search: searchQuery, limit: 6 } })
                .then(r => setSearchResults({ countries: countryMatches, entities: r.data }))
                .catch(() => setSearchResults({ countries: countryMatches, entities: [] }));
        }, 300);

        return () => clearTimeout(searchDebounce.current);
    }, [searchQuery, mapData]);

    function goToCountry(iso2) {
        const data = mapData[iso2];
        if (!data) return;
        setSelected(data);
        setSearchOpen(false);
        setSearchQuery("");
        // petit zoom/centrage approximatif — react-simple-maps ne fournit pas les centroïdes directement,
        // donc on garde le zoom courant et on laisse l'utilisateur repérer visuellement le pays sélectionné (surligné en blanc).
    }

    function toggleSource(src) {
        setActiveSources(prev =>
            prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
        );
    }

    const totalCountries = Object.keys(mapData).length;
    const totalEntities = Object.values(mapData).reduce((s, d) => s + d.total, 0);

    const filteredEntities = sourceFilter
        ? entities.filter(e => e.source === sourceFilter)
        : entities;

    return (
        <div style={{
            display: "flex", height: "100%", background: "#080c14", color: "#e2e8f0",
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>

                {/* Header */}
                <div style={{
                    padding: "20px 24px 16px",
                    borderBottom: "1px solid #1e2a3a",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    gap: "20px", flexWrap: "wrap",
                }}>
                    <div>
                        <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#f1f5f9" }}>
                            Cartographie des sanctions mondiales
                        </h2>
                        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#475569" }}>
                            {loading ? "Chargement..." : `${totalEntities.toLocaleString()} entités sanctionnées · ${totalCountries} pays ciblés`}
                        </p>
                    </div>

                    {/* NOUVEAU — barre de recherche */}
                    <div style={{ position: "relative", width: "320px" }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                            onFocus={() => setSearchOpen(true)}
                            placeholder="Rechercher un pays ou une entité..."
                            style={{
                                width: "100%", padding: "8px 12px", borderRadius: "8px",
                                border: "1px solid #1e2a3a", background: "#0d1220",
                                color: "#e2e8f0", fontSize: "13px", outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                        {searchOpen && searchQuery.trim().length >= 2 && (
                            <div style={{
                                position: "absolute", top: "38px", left: 0, right: 0,
                                background: "#0d1220", border: "1px solid #1e2a3a",
                                borderRadius: "8px", maxHeight: "320px", overflowY: "auto",
                                zIndex: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                            }}>
                                {searchResults.countries.length === 0 && searchResults.entities.length === 0 && (
                                    <div style={{ padding: "12px", fontSize: "12px", color: "#475569" }}>
                                        Aucun résultat.
                                    </div>
                                )}
                                {searchResults.countries.length > 0 && (
                                    <div>
                                        <div style={{ padding: "8px 12px 4px", fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.06em" }}>
                                            PAYS
                                        </div>
                                        {searchResults.countries.map(c => (
                                            <div key={c.iso2}
                                                 onClick={() => goToCountry(c.iso2)}
                                                 style={{
                                                     padding: "8px 12px", cursor: "pointer", fontSize: "13px",
                                                     display: "flex", justifyContent: "space-between",
                                                 }}
                                                 onMouseEnter={e => e.currentTarget.style.background = "#1e2a3a"}
                                                 onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                            >
                                                <span>{c.name}</span>
                                                <span style={{ color: "#475569" }}>{c.total.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {searchResults.entities.length > 0 && (
                                    <div>
                                        <div style={{ padding: "8px 12px 4px", fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.06em" }}>
                                            ENTITÉS
                                        </div>
                                        {searchResults.entities.map(e => (
                                            <div key={e.id}
                                                 onClick={() => e.target_country && goToCountry(e.target_country)}
                                                 style={{
                                                     padding: "8px 12px", cursor: e.target_country ? "pointer" : "default",
                                                     opacity: e.target_country ? 1 : 0.5,
                                                 }}
                                                 onMouseEnter={ev => e.target_country && (ev.currentTarget.style.background = "#1e2a3a")}
                                                 onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
                                            >
                                                <div style={{ fontSize: "13px" }}>{e.name}</div>
                                                <div style={{ fontSize: "10px", color: "#64748b" }}>
                                                    {e.source} {e.target_country ? `· ${COUNTRY_NAMES[e.target_country] || e.target_country}` : "· pays non résolu"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* NOUVEAU — filtres par source (boutons togglables) + légende */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        {ALL_SOURCES.map(src => {
                            const active = activeSources.includes(src);
                            return (
                                <button
                                    key={src}
                                    onClick={() => toggleSource(src)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "6px",
                                        padding: "5px 10px", borderRadius: "6px",
                                        border: `1px solid ${active ? SOURCE_COLORS[src] : "#1e2a3a"}`,
                                        background: active ? `${SOURCE_COLORS[src]}22` : "#0d1220",
                                        color: active ? "#f1f5f9" : "#475569",
                                        fontSize: "11px", cursor: "pointer", fontWeight: 600,
                                    }}
                                >
                                    <div style={{
                                        width: "8px", height: "8px", borderRadius: "2px",
                                        background: SOURCE_COLORS[src],
                                        opacity: active ? 1 : 0.3,
                                    }} />
                                    {src}
                                </button>
                            );
                        })}
                        <div style={{ width: "1px", height: "18px", background: "#1e2a3a", margin: "0 4px" }} />
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#7c3aed" }} />
                            <span style={{ fontSize: "11px", color: "#64748b" }}>Multi</span>
                        </div>
                    </div>
                </div>

                {/* Carte */}
                <div style={{ flex: 1, position: "relative" }} onClick={() => setSearchOpen(false)}>
                    {loading && (
                        <div style={{
                            position: "absolute", inset: 0, display: "flex",
                            alignItems: "center", justifyContent: "center",
                            background: "#080c14", zIndex: 10,
                        }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🌐</div>
                                <div style={{ color: "#475569", fontSize: "13px" }}>Chargement des données...</div>
                            </div>
                        </div>
                    )}

                    <ComposableMap projection="geoNaturalEarth1" style={{ width: "100%", height: "100%" }}>
                        <ZoomableGroup
                            zoom={position.zoom}
                            center={position.coordinates}
                            onMoveEnd={setPosition}
                            minZoom={0.8}
                            maxZoom={8}
                        >
                            <Geographies geography={GEO_URL}>
                                {({ geographies }) =>
                                    geographies.map(geo => {
                                        const iso2 = ISO_NUM_TO_2[geo.id] || null;
                                        const data = iso2 ? mapData[iso2] : null;
                                        const isSelected = selected?.target_country === iso2;
                                        const color = countryColor(data, activeSources);
                                        const opacity = data ? countryOpacity(data, activeSources) : 1;

                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                onClick={(e) => { e.stopPropagation(); data && setSelected(data); }}
                                                onMouseEnter={() => iso2 && setHoveredCountry(iso2)}
                                                onMouseLeave={() => setHoveredCountry(null)}
                                                style={{
                                                    default: {
                                                        fill: color,
                                                        fillOpacity: isSelected ? 1 : opacity,
                                                        stroke: isSelected ? "#fff" : "#080c14",
                                                        strokeWidth: isSelected ? 1.5 : 0.3,
                                                        outline: "none",
                                                        cursor: data ? "pointer" : "default",
                                                        transition: "fill-opacity 0.15s",
                                                    },
                                                    hover: {
                                                        fill: data ? color : "#243048",
                                                        fillOpacity: 1,
                                                        stroke: "#94a3b8",
                                                        strokeWidth: 0.8,
                                                        outline: "none",
                                                        cursor: data ? "pointer" : "default",
                                                    },
                                                    pressed: { outline: "none" },
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Geographies>
                        </ZoomableGroup>
                    </ComposableMap>

                    {hoveredCountry && mapData[hoveredCountry] && !selected && (
                        <div style={{
                            position: "absolute", bottom: "16px", left: "16px",
                            background: "#0d1220", border: "1px solid #1e2a3a",
                            borderRadius: "8px", padding: "10px 14px", pointerEvents: "none",
                        }}>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>
                                {COUNTRY_NAMES[hoveredCountry] || hoveredCountry}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                                {mapData[hoveredCountry].total.toLocaleString()} entités sanctionnées
                                · {Object.keys(mapData[hoveredCountry].sanctioners).join(", ")}
                            </div>
                        </div>
                    )}

                    <div style={{
                        position: "absolute", bottom: "16px", right: "16px",
                        display: "flex", flexDirection: "column", gap: "4px",
                    }}>
                        {[
                            { label: "+", action: () => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) })) },
                            { label: "−", action: () => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 0.8) })) },
                            { label: "↺", action: () => setPosition({ coordinates: [15, 20], zoom: 1.2 }) },
                        ].map(({ label, action }) => (
                            <button key={label} onClick={action} style={{
                                width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #1e2a3a",
                                background: "#0d1220", color: "#94a3b8", cursor: "pointer",
                                fontSize: label === "↺" ? "13px" : "18px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{label}</button>
                        ))}
                    </div>
                </div>

                {!loading && (
                    <div style={{ borderTop: "1px solid #1e2a3a", padding: "12px 24px", display: "flex", gap: "32px" }}>
                        {[
                            { label: "Entités OFAC", value: Object.values(mapData).reduce((s, d) => s + (d.sanctioners.OFAC?.count || 0), 0), color: "#ef4444" },
                            { label: "Entités ONU",  value: Object.values(mapData).reduce((s, d) => s + (d.sanctioners.UN?.count  || 0), 0), color: "#3b82f6" },
                            { label: "Entités EU",   value: Object.values(mapData).reduce((s, d) => s + (d.sanctioners.EU?.count  || 0), 0), color: "#22c55e" },
                            { label: "Entités CN",   value: Object.values(mapData).reduce((s, d) => s + (d.sanctioners.CN?.count  || 0), 0), color: "#f59e0b" },
                            { label: "Pays ciblés",  value: totalCountries, color: "#a78bfa" },
                        ].map(({ label, value, color }) => (
                            <div key={label}>
                                <div style={{ fontSize: "18px", fontWeight: 800, color, lineHeight: 1 }}>{value.toLocaleString()}</div>
                                <div style={{ fontSize: "11px", color: "#475569", marginTop: "3px" }}>{label}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Panel latéral */}
            <div style={{
                width: selected ? "380px" : "0", overflow: "hidden",
                transition: "width 0.25s ease",
                borderLeft: selected ? "1px solid #1e2a3a" : "none",
                background: "#0d1220", display: "flex", flexDirection: "column",
            }}>
                {selected && (
                    <div style={{ padding: "20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column" }}>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                            <div>
                                <div style={{ fontSize: "11px", color: "#475569", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "4px" }}>
                                    PAYS CIBLÉ
                                </div>
                                <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#f1f5f9" }}>
                                    {COUNTRY_NAMES[selected.target_country] || selected.target_country}
                                </h3>
                                <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}>
                                    {selected.total.toLocaleString()} entités sanctionnées au total
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)} style={{
                                background: "none", border: "none", color: "#475569",
                                cursor: "pointer", fontSize: "18px", padding: "4px",
                            }}>✕</button>
                        </div>

                        {/* NOUVEAU — bouton export CSV */}
                        <button
                            onClick={() => downloadCSV(
                                `sanctions_${selected.target_country}${sourceFilter ? "_" + sourceFilter : ""}.csv`,
                                filteredEntities
                            )}
                            disabled={filteredEntities.length === 0}
                            style={{
                                padding: "8px 12px", borderRadius: "6px",
                                border: "1px solid #1e2a3a", background: "#0a0e1a",
                                color: filteredEntities.length ? "#e2e8f0" : "#334155",
                                fontSize: "12px", fontWeight: 600, cursor: filteredEntities.length ? "pointer" : "not-allowed",
                                marginBottom: "20px", textAlign: "left",
                            }}
                        >
                            ⬇ Exporter en CSV ({filteredEntities.length.toLocaleString()} entités)
                        </button>

                        <div style={{ marginBottom: "20px" }}>
                            <div style={{ fontSize: "11px", color: "#475569", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "10px" }}>
                                SANCTIONS PAR ORIGINE
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {Object.entries(selected.sanctioners).map(([src, data]) => {
                                    const pct = Math.round(data.count / selected.total * 100);
                                    const isActiveFilter = sourceFilter === src;
                                    return (
                                        <div key={src} onClick={() => setSourceFilter(isActiveFilter ? null : src)} style={{ cursor: "pointer" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: SOURCE_COLORS[src] || "#64748b" }} />
                                                    <span style={{ fontSize: "13px", color: isActiveFilter ? "#f1f5f9" : "#e2e8f0", fontWeight: isActiveFilter ? 700 : 400 }}>
                                                        {SOURCE_LABELS[src] || src}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>{data.count.toLocaleString()}</span>
                                            </div>
                                            <div style={{ height: "3px", background: "#1e2a3a", borderRadius: "2px", overflow: "hidden" }}>
                                                <div style={{
                                                    width: `${pct}%`, height: "100%",
                                                    background: SOURCE_COLORS[src] || "#64748b", borderRadius: "2px",
                                                    opacity: isActiveFilter || !sourceFilter ? 1 : 0.35,
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                <div style={{ fontSize: "11px", color: "#475569", fontWeight: 700, letterSpacing: "0.08em" }}>
                                    ENTITÉS {sourceFilter ? `— ${SOURCE_LABELS[sourceFilter] || sourceFilter}` : ""}
                                    <span style={{ color: "#334155", fontWeight: 400 }}> ({filteredEntities.length.toLocaleString()})</span>
                                </div>
                                {sourceFilter && (
                                    <button onClick={() => setSourceFilter(null)} style={{
                                        background: "none", border: "none", color: "#64748b",
                                        fontSize: "10px", cursor: "pointer", textDecoration: "underline",
                                    }}>Réinitialiser</button>
                                )}
                            </div>

                            {entitiesLoading && <div style={{ fontSize: "12px", color: "#475569", padding: "12px 0" }}>Chargement des entités...</div>}
                            {!entitiesLoading && filteredEntities.length === 0 && <div style={{ fontSize: "12px", color: "#475569", padding: "12px 0" }}>Aucune entité trouvée.</div>}

                            {!entitiesLoading && filteredEntities.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto", maxHeight: "300px", paddingRight: "4px" }}>
                                    {filteredEntities.map(e => (
                                        <div key={e.id} style={{ padding: "8px 10px", borderRadius: "6px", background: "#0a0e1a", border: "1px solid #1e2a3a" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                                                <span style={{ fontSize: "12px", color: "#e2e8f0", fontWeight: 600 }}>{e.name}</span>
                                                <span style={{ fontSize: "9px", color: SOURCE_COLORS[e.source] || "#64748b", fontWeight: 700, whiteSpace: "nowrap" }}>{e.source}</span>
                                            </div>
                                            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                                                {e.type}{e.programs?.length > 0 && ` · ${e.programs.join(", ")}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}