import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
} from "react-simple-maps";
import { API_URL } from "../config";

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

const COUNTRY_CONTEXT = {
    UA: { note: "Les entités listées sous 'Ukraine' ne sont pas ukrainiennes — elles opèrent dans les territoires occupés par la Russie (Crimée, Donbass) ou sont liées au conflit russo-ukrainien.", angle: "warning" },
    RU: { note: "La Russie dispose d'un droit de veto au Conseil de sécurité — aucune sanction multilatérale n'est possible. Les 6 000+ entités listées le sont exclusivement par des puissances occidentales.", angle: "info" },
    IR: { note: "L'Iran fait l'objet de sanctions onusiennes liées au nucléaire, mais Washington va bien au-delà. Le retrait américain du JCPOA en 2018 a creusé l'écart entre les listes.", angle: "info" },
    KP: { note: "Cas rare de consensus : l'ONU sanctionne davantage que les États-Unis seuls. Aucun membre permanent n'ayant d'intérêt direct, un accord unanime a été possible.", angle: "success" },
    SY: { note: "Sanctionnée par les États-Unis et l'UE, mais la Russie et la Chine ont bloqué toute résolution onusienne durant le conflit.", angle: "info" },
    CU: { note: "L'embargo américain (depuis 1962) est condamné chaque année par l'Assemblée générale de l'ONU. Aucun équivalent multilatéral.", angle: "warning" },
    BY: { note: "Sanctions post-2020 liées à la répression du mouvement démocratique. Bloquées à l'ONU par la Russie. L'UE a répondu indépendamment.", angle: "info" },
    VE: { note: "Sanctions américaines liées à la crise démocratique. La Chine et la Russie ont bloqué toute action onusienne.", angle: "info" },
};

const ANGLE_STYLES = {
    warning: { bg: "#1a1200", border: "#f59e0b44", text: "#f59e0b", icon: "⚠" },
    info:    { bg: "#0a1220", border: "#3b82f644", text: "#60a5fa", icon: "ℹ" },
    success: { bg: "#0a1a0e", border: "#22c55e44", text: "#22c55e", icon: "✓" },
};

const SECTOR_KEYWORDS = {
    "Énergie & Pétrole": ["oil","gas","petro","energy","refin","fuel","neft"],
    "Banque & Finance":  ["bank","financial","invest","credit","insurance","capital"],
    "Shipping":          ["shipping","tanker","vessel","maritime","transport"],
    "Nucléaire":         ["nuclear","atomic","uranium","isotope"],
    "Militaire":         ["defense","armament","missile","military","weapon"],
    "Tech & Cyber":      ["tech","software","cyber","digital","electronic"],
};
const SECTOR_COLORS = {
    "Énergie & Pétrole": "#f97316",
    "Banque & Finance":  "#3b82f6",
    "Shipping":          "#06b6d4",
    "Nucléaire":         "#8b5cf6",
    "Militaire":         "#ef4444",
    "Tech & Cyber":      "#10b981",
    "Autre":             "#475569",
};

function detectSector(name = "") {
    const l = name.toLowerCase();
    for (const [s, ks] of Object.entries(SECTOR_KEYWORDS)) {
        if (ks.some(k => l.includes(k))) return s;
    }
    return "Autre";
}

function buildSectorStats(entities) {
    const c = {};
    for (const e of entities) {
        const s = detectSector(e.name);
        c[s] = (c[s] || 0) + 1;
    }
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
}

function countryColor(data, activeSources, sourceColors) {
    if (!data) return "#1a2438";
    const activeInCountry = Object.keys(data.sanctioners).filter(s => activeSources.includes(s));
    if (activeInCountry.length === 0) return "#1a2438";
    if (activeInCountry.length >= 2) return "#7c3aed";
    return sourceColors[activeInCountry[0]] || "#64748b";
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
    const [sourceFilter, setSourceFilter] = useState(null);
    const [sources, setSources] = useState([]);
    const [activeSources, setActiveSources] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState({ countries: [], entities: [] });
    const [searchOpen, setSearchOpen] = useState(false);
    const searchDebounce = useRef(null);

    // Charge le registre des sources depuis le backend (src/sources.py)
    useEffect(() => {
        axios.get(`${API_URL}/sources`)
            .then(r => {
                setSources(r.data);
                setActiveSources(r.data.map(s => s.key));
            })
            .catch(() => {});
    }, []);

    // Charge les données agrégées par pays
    useEffect(() => {
        axios.get(`${API_URL}/analysis/sanctions-map`)
            .then(r => { setMapData(r.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    // Charge les entités du pays sélectionné
    useEffect(() => {
        if (!selected) { setEntities([]); setSourceFilter(null); return; }
        setEntitiesLoading(true);
        setSourceFilter(null);
        axios.get(`${API_URL}/analysis/country/${selected.target_country}`)
            .then(r => setEntities(r.data))
            .catch(() => setEntities([]))
            .finally(() => setEntitiesLoading(false));
    }, [selected]);

    // Recherche pays / entités (debounce)
    useEffect(() => {
        if (searchDebounce.current) clearTimeout(searchDebounce.current);
        if (!searchQuery || searchQuery.trim().length < 2) {
            setSearchResults({ countries: [], entities: [] });
            return;
        }
        searchDebounce.current = setTimeout(() => {
            const q = searchQuery.trim().toLowerCase();
            const countryMatches = Object.entries(mapData)
                .filter(([iso2]) => (COUNTRY_NAMES[iso2] || iso2).toLowerCase().includes(q))
                .map(([iso2, data]) => ({ iso2, name: COUNTRY_NAMES[iso2] || iso2, total: data.total }))
                .slice(0, 5);
            axios.get(`${API_URL}/entities`, { params: { search: searchQuery, limit: 6 } })
                .then(r => setSearchResults({ countries: countryMatches, entities: r.data }))
                .catch(() => setSearchResults({ countries: countryMatches, entities: [] }));
        }, 300);
        return () => clearTimeout(searchDebounce.current);
    }, [searchQuery, mapData]);

    // Dérivés du registre de sources (recalculés à chaque render, coût négligeable)
    const SOURCE_COLORS = Object.fromEntries(sources.map(s => [s.key, s.color]));
    const SOURCE_LABELS = Object.fromEntries(sources.map(s => [s.key, s.label]));
    const ALL_SOURCES = sources.map(s => s.key);

    function goToCountry(iso2) {
        const data = mapData[iso2];
        if (!data) return;
        setSelected(data);
        setSearchOpen(false);
        setSearchQuery("");
    }

    function toggleSource(src) {
        setActiveSources(prev =>
            prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
        );
    }

    const totalCountries = Object.keys(mapData).length;
    const totalEntities = Object.values(mapData).reduce((s, d) => s + d.total, 0);
    const filteredEntities = sourceFilter ? entities.filter(e => e.source === sourceFilter) : entities;

    return (
        <div style={{ display: "flex", height: "100%", background: "#080c14", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" }}>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>

                {/* Header */}
                <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #1e2a3a", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
                    <div>
                        <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#f1f5f9" }}>
                            Cartographie des sanctions mondiales
                        </h2>
                        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#475569" }}>
                            {loading ? "Chargement..." : `${totalEntities.toLocaleString()} entités sanctionnées · ${totalCountries} pays ciblés`}
                        </p>
                    </div>

                    {/* Recherche */}
                    <div style={{ position: "relative", width: "320px" }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                            onFocus={() => setSearchOpen(true)}
                            placeholder="Rechercher un pays ou une entité..."
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #1e2a3a", background: "#0d1220", color: "#e2e8f0", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                        />
                        {searchOpen && searchQuery.trim().length >= 2 && (
                            <div style={{ position: "absolute", top: "38px", left: 0, right: 0, background: "#0d1220", border: "1px solid #1e2a3a", borderRadius: "8px", maxHeight: "320px", overflowY: "auto", zIndex: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                                {searchResults.countries.length === 0 && searchResults.entities.length === 0 && (
                                    <div style={{ padding: "12px", fontSize: "12px", color: "#475569" }}>Aucun résultat.</div>
                                )}
                                {searchResults.countries.length > 0 && (
                                    <div>
                                        <div style={{ padding: "8px 12px 4px", fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.06em" }}>PAYS</div>
                                        {searchResults.countries.map(c => (
                                            <div key={c.iso2} onClick={() => goToCountry(c.iso2)}
                                                 style={{ padding: "8px 12px", cursor: "pointer", fontSize: "13px", display: "flex", justifyContent: "space-between" }}
                                                 onMouseEnter={e => e.currentTarget.style.background = "#1e2a3a"}
                                                 onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                <span>{c.name}</span>
                                                <span style={{ color: "#475569" }}>{c.total.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {searchResults.entities.length > 0 && (
                                    <div>
                                        <div style={{ padding: "8px 12px 4px", fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.06em" }}>ENTITÉS</div>
                                        {searchResults.entities.map(e => (
                                            <div key={e.id}
                                                 onClick={() => e.target_country && goToCountry(e.target_country)}
                                                 style={{ padding: "8px 12px", cursor: e.target_country ? "pointer" : "default", opacity: e.target_country ? 1 : 0.5 }}
                                                 onMouseEnter={ev => e.target_country && (ev.currentTarget.style.background = "#1e2a3a")}
                                                 onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                                                <div style={{ fontSize: "13px" }}>{e.name}</div>
                                                <div style={{ fontSize: "10px", color: "#64748b" }}>{e.source} {e.target_country ? `· ${COUNTRY_NAMES[e.target_country] || e.target_country}` : "· pays non résolu"}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Filtres sources */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        {ALL_SOURCES.map(src => {
                            const active = activeSources.includes(src);
                            return (
                                <button key={src} onClick={() => toggleSource(src)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px", borderRadius: "6px", border: `1px solid ${active ? SOURCE_COLORS[src] : "#1e2a3a"}`, background: active ? `${SOURCE_COLORS[src]}22` : "#0d1220", color: active ? "#f1f5f9" : "#475569", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}>
                                    <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: SOURCE_COLORS[src], opacity: active ? 1 : 0.3 }} />
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
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#080c14", zIndex: 10 }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🌐</div>
                                <div style={{ color: "#475569", fontSize: "13px" }}>Chargement des données...</div>
                            </div>
                        </div>
                    )}
                    <ComposableMap projection="geoNaturalEarth1" style={{ width: "100%", height: "100%" }}>
                        <ZoomableGroup zoom={position.zoom} center={position.coordinates} onMoveEnd={setPosition} minZoom={0.8} maxZoom={8}>
                            <Geographies geography={GEO_URL}>
                                {({ geographies }) =>
                                    geographies.map(geo => {
                                        const iso2 = ISO_NUM_TO_2[geo.id] || null;
                                        const data = iso2 ? mapData[iso2] : null;
                                        const isSelected = selected?.target_country === iso2;
                                        const color = countryColor(data, activeSources, SOURCE_COLORS);
                                        const opacity = data ? countryOpacity(data, activeSources) : 1;
                                        return (
                                            <Geography key={geo.rsmKey} geography={geo}
                                                       onClick={(e) => { e.stopPropagation(); data && setSelected(data); }}
                                                       onMouseEnter={() => iso2 && setHoveredCountry(iso2)}
                                                       onMouseLeave={() => setHoveredCountry(null)}
                                                       style={{
                                                           default: { fill: color, fillOpacity: isSelected ? 1 : opacity, stroke: isSelected ? "#fff" : "#080c14", strokeWidth: isSelected ? 1.5 : 0.3, outline: "none", cursor: data ? "pointer" : "default", transition: "fill-opacity 0.15s" },
                                                           hover: { fill: data ? color : "#243048", fillOpacity: 1, stroke: "#94a3b8", strokeWidth: 0.8, outline: "none", cursor: data ? "pointer" : "default" },
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
                        <div style={{ position: "absolute", bottom: "16px", left: "16px", background: "#0d1220", border: "1px solid #1e2a3a", borderRadius: "8px", padding: "10px 14px", pointerEvents: "none" }}>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>{COUNTRY_NAMES[hoveredCountry] || hoveredCountry}</div>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                                {mapData[hoveredCountry].total.toLocaleString()} entités · {Object.keys(mapData[hoveredCountry].sanctioners).join(", ")}
                            </div>
                        </div>
                    )}

                    <div style={{ position: "absolute", bottom: "16px", right: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {[
                            { label: "+", action: () => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) })) },
                            { label: "−", action: () => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 0.8) })) },
                            { label: "↺", action: () => setPosition({ coordinates: [15, 20], zoom: 1.2 }) },
                        ].map(({ label, action }) => (
                            <button key={label} onClick={action} style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #1e2a3a", background: "#0d1220", color: "#94a3b8", cursor: "pointer", fontSize: label === "↺" ? "13px" : "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>{label}</button>
                        ))}
                    </div>
                </div>

                {!loading && (
                    <div style={{ borderTop: "1px solid #1e2a3a", padding: "12px 24px", display: "flex", gap: "32px", flexWrap: "wrap" }}>
                        {ALL_SOURCES.map(src => (
                            <div key={src}>
                                <div style={{ fontSize: "18px", fontWeight: 800, color: SOURCE_COLORS[src], lineHeight: 1 }}>
                                    {Object.values(mapData).reduce((s, d) => s + (d.sanctioners[src]?.count || 0), 0).toLocaleString()}
                                </div>
                                <div style={{ fontSize: "11px", color: "#475569", marginTop: "3px" }}>Entités {src}</div>
                            </div>
                        ))}
                        <div>
                            <div style={{ fontSize: "18px", fontWeight: 800, color: "#a78bfa", lineHeight: 1 }}>{totalCountries}</div>
                            <div style={{ fontSize: "11px", color: "#475569", marginTop: "3px" }}>Pays ciblés</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Panel latéral */}
            <div style={{ width: selected ? "380px" : "0", overflow: "hidden", transition: "width 0.25s ease", borderLeft: selected ? "1px solid #1e2a3a" : "none", background: "#0d1220", display: "flex", flexDirection: "column" }}>
                {selected && (
                    <div style={{ padding: "20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column" }}>

                        {/* Titre pays */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                            <div>
                                <div style={{ fontSize: "11px", color: "#475569", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "4px" }}>PAYS CIBLÉ</div>
                                <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#f1f5f9" }}>
                                    {COUNTRY_NAMES[selected.target_country] || selected.target_country}
                                </h3>
                                <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}>
                                    {selected.total.toLocaleString()} entités sanctionnées au total
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "18px", padding: "4px" }}>✕</button>
                        </div>

                        {/* Export CSV */}
                        <button
                            onClick={() => downloadCSV(`sanctions_${selected.target_country}${sourceFilter ? "_" + sourceFilter : ""}.csv`, filteredEntities)}
                            disabled={filteredEntities.length === 0}
                            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #1e2a3a", background: "#0a0e1a", color: filteredEntities.length ? "#e2e8f0" : "#334155", fontSize: "12px", fontWeight: 600, cursor: filteredEntities.length ? "pointer" : "not-allowed", marginBottom: "16px", textAlign: "left" }}
                        >
                            ⬇ Exporter en CSV ({filteredEntities.length.toLocaleString()} entités)
                        </button>

                        {/* Contexte géopolitique */}
                        {COUNTRY_CONTEXT[selected.target_country] && (() => {
                            const ctx = COUNTRY_CONTEXT[selected.target_country];
                            const style = ANGLE_STYLES[ctx.angle];
                            return (
                                <div style={{ background: style.bg, border: `1px solid ${style.border}`, borderLeft: `3px solid ${style.text}`, borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
                                    <div style={{ fontSize: "10px", fontWeight: 700, color: style.text, marginBottom: "5px", letterSpacing: "0.06em" }}>
                                        {style.icon} CONTEXTE GÉOPOLITIQUE
                                    </div>
                                    <p style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.65, margin: 0 }}>
                                        {ctx.note}
                                    </p>
                                </div>
                            );
                        })()}

                        {/* Sanctions par origine */}
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "11px", color: "#475569", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "10px" }}>SANCTIONS PAR ORIGINE</div>
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
                                                <div style={{ width: `${pct}%`, height: "100%", background: SOURCE_COLORS[src] || "#64748b", borderRadius: "2px", opacity: isActiveFilter || !sourceFilter ? 1 : 0.35 }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Secteurs d'activité */}
                        {!entitiesLoading && filteredEntities.length > 0 && (() => {
                            const sectors = buildSectorStats(filteredEntities);
                            const max = sectors[0]?.[1] || 1;
                            return (
                                <div style={{ marginBottom: "16px" }}>
                                    <div style={{ fontSize: "11px", color: "#475569", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "10px" }}>SECTEURS D'ACTIVITÉ</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                                        {sectors.slice(0, 6).map(([sector, count]) => (
                                            <div key={sector}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                                                    <span style={{ fontSize: "11px", color: SECTOR_COLORS[sector] }}>{sector}</span>
                                                    <span style={{ fontSize: "11px", color: "#64748b" }}>{count}</span>
                                                </div>
                                                <div style={{ background: "#1e2a3a", borderRadius: "3px", height: "4px" }}>
                                                    <div style={{ background: SECTOR_COLORS[sector], width: `${(count / max) * 100}%`, height: "4px", borderRadius: "3px" }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Liste entités */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                <div style={{ fontSize: "11px", color: "#475569", fontWeight: 700, letterSpacing: "0.08em" }}>
                                    ENTITÉS {sourceFilter ? `— ${SOURCE_LABELS[sourceFilter] || sourceFilter}` : ""}
                                    <span style={{ color: "#334155", fontWeight: 400 }}> ({filteredEntities.length.toLocaleString()})</span>
                                </div>
                                {sourceFilter && (
                                    <button onClick={() => setSourceFilter(null)} style={{ background: "none", border: "none", color: "#64748b", fontSize: "10px", cursor: "pointer", textDecoration: "underline" }}>Réinitialiser</button>
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