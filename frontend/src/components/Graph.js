import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import axios from "axios";

const PROGRAM_COLORS = {
  "RUSSIA-EO14024": "#ef4444", "RUSSIA-EO14065": "#ef4444", "CAATSA - RUSSIA": "#ef4444",
  "IRAN": "#f97316", "CAATSA - IRAN": "#f97316", "IRAN-EO13876": "#f97316",
  "DPRK": "#8b5cf6", "DPRK3": "#8b5cf6", "DPRK4": "#8b5cf6",
  "CUBA": "#06b6d4", "CUBA-EO14404": "#06b6d4",
  "SYRIA": "#eab308", "VENEZUELA": "#ec4899",
  "BELARUS": "#f43f5e", "BELARUS-EO14038": "#f43f5e",
  "UKRAINE-EO13660": "#3b82f6", "UKRAINE-EO13661": "#3b82f6",
  "UKRAINE-EO13662": "#3b82f6", "UKRAINE-EO13685": "#3b82f6",
};

function getColor(node) {
  if (node.center) return "#ffffff";
  for (const p of (node.programs || [])) {
    if (PROGRAM_COLORS[p]) return PROGRAM_COLORS[p];
  }
  return "#64748b";
}

const PROGRAMS = [
  "", "RUSSIA-EO14024", "CAATSA - RUSSIA", "IRAN", "DPRK",
  "CUBA", "SYRIA", "VENEZUELA", "BELARUS", "UKRAINE-EO13662"
];

export default function Graph({ search, onSelect }) {
  const svgRef = useRef();
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [program, setProgram] = useState("");
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, node: null });

  const loadProgramGraph = useCallback(async (prog) => {
    setProgram(prog);
    setLoading(true);
    setSelected(null);
    const params = { limit: 60 };
    if (prog) params.program = prog;
    const { data } = await axios.get("http://localhost:8000/graph", { params });
    setGraphData(data);
    setLoading(false);
  }, []);

  const loadEntityGraph = useCallback(async (entity) => {
    setSelected(entity);
    setLoading(true);
    setResults([]);
    onSelect(entity);
    const { data } = await axios.get(`http://localhost:8000/graph/entity/${entity.id}`);
    setGraphData(data);
    setLoading(false);
  }, [onSelect]);

  useEffect(() => { loadProgramGraph(""); }, [loadProgramGraph]);

  useEffect(() => {
    if (!search || search.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await axios.get("http://localhost:8000/entities", { params: { search, limit: 8 } });
      setResults(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!graphData) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const g = svg.append("g");

    svg.call(d3.zoom().scaleExtent([0.1, 4]).on("zoom", e => g.attr("transform", e.transform)));

    const nodes = graphData.nodes.map(d => ({ ...d }));
    const links = graphData.links.map(d => ({ ...d }));

    const degree = {};
    nodes.forEach(n => degree[n.id] = 0);
    links.forEach(l => {
      degree[l.source] = (degree[l.source] || 0) + 1;
      degree[l.target] = (degree[l.target] || 0) + 1;
    });

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-250))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide(d => d.center ? 30 : 20));

    const link = g.append("g").selectAll("line").data(links).join("line")
        .attr("stroke", "#1e3a5f").attr("stroke-width", 1.5).attr("stroke-opacity", 0.5);

    const node = g.append("g").selectAll("g").data(nodes).join("g")
        .call(d3.drag()
            .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
            .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
            .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
        )
        .on("mouseover", (e, d) => {
          setTooltip({ visible: true, x: e.clientX + 12, y: e.clientY - 20, node: d });
        })
        .on("mousemove", (e) => {
          setTooltip(t => ({ ...t, x: e.clientX + 12, y: e.clientY - 20 }));
        })
        .on("mouseout", () => setTooltip(t => ({ ...t, visible: false })))
        .on("click", async (e, d) => {
          e.stopPropagation();
          const { data: full } = await axios.get(`http://localhost:8000/entities/${d.id}`);
          onSelect(full);
          if (!d.center) loadEntityGraph(d);
          node.selectAll("circle").attr("opacity", n =>
              links.some(l =>
                  (l.source.id === d.id && l.target.id === n.id) ||
                  (l.target.id === d.id && l.source.id === n.id) ||
                  n.id === d.id
              ) ? 1 : 0.2
          );
        });

    node.append("circle")
        .attr("r", d => d.center ? 18 : 6 + (degree[d.id] || 0) * 1.5)
        .attr("fill", d => getColor(d))
        .attr("fill-opacity", d => d.center ? 1 : 0.85)
        .attr("stroke", d => d.center ? "#fff" : "#0a0e1a")
        .attr("stroke-width", d => d.center ? 3 : 1)
        .style("cursor", "pointer");

    node.append("text")
        .text(d => d.name.length > 20 ? d.name.slice(0, 20) + "…" : d.name)
        .attr("x", d => d.center ? 22 : 9 + (degree[d.id] || 0) * 1.5)
        .attr("y", 4)
        .attr("font-size", d => d.center ? "12px" : "9px")
        .attr("font-weight", d => d.center ? "700" : "400")
        .attr("fill", d => d.center ? "#fff" : "#94a3b8")
        .style("pointer-events", "none");

    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
  }, [graphData, loadEntityGraph, onSelect]);

  return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

        {/* Tooltip React */}
        {tooltip.visible && tooltip.node && (
            <div style={{
              position: "fixed", left: tooltip.x, top: tooltip.y,
              background: "#0d1220", border: "1px solid #1e2a3a",
              borderRadius: "8px", padding: "10px 14px", fontSize: "12px",
              color: "#e2e8f0", pointerEvents: "none", zIndex: 1000,
              maxWidth: "220px", lineHeight: 1.5, boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
            }}>
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>{tooltip.node.name}</div>
              <div style={{ color: "#64748b" }}>{tooltip.node.type} · {tooltip.node.source}</div>
              {tooltip.node.programs?.length > 0 && (
                  <div style={{ color: "#60a5fa", marginTop: "4px" }}>
                    {tooltip.node.programs.slice(0, 2).join(", ")}
                  </div>
              )}
            </div>
        )}

        {/* Filtres */}
        <div style={{
          position: "absolute", top: 12, right: 12, zIndex: 10,
          display: "flex", gap: "6px", flexWrap: "wrap", maxWidth: "420px", justifyContent: "flex-end"
        }}>
          {PROGRAMS.map(p => (
              <button key={p} onClick={() => loadProgramGraph(p)} style={{
                padding: "4px 10px", borderRadius: "12px", border: "none",
                background: program === p ? (PROGRAM_COLORS[p] || "#3b82f6") : "#1e2a3a",
                color: "#e2e8f0", fontSize: "11px", cursor: "pointer",
                fontWeight: program === p ? 700 : 400,
              }}>
                {p || "Tous"}
              </button>
          ))}
        </div>

        {/* Résultats recherche */}
        {results.length > 0 && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 320, zIndex: 20,
              background: "#0d1220", border: "1px solid #1e2a3a",
              borderRadius: "10px", margin: "8px", overflow: "hidden"
            }}>
              <div style={{ padding: "8px 14px", fontSize: "11px", color: "#64748b", borderBottom: "1px solid #1e2a3a" }}>
                {results.length} résultat(s) — clique pour explorer les connexions
              </div>
              {results.map(e => (
                  <div key={e.id} onClick={() => loadEntityGraph(e)}
                       style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #0a0e1a", display: "flex", justifyContent: "space-between" }}
                       onMouseEnter={ev => ev.currentTarget.style.background = "#1e2a3a"}
                       onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600 }}>{e.name}</div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        {e.type} · {e.source} · {(e.programs || []).slice(0, 2).join(", ")}
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", color: "#3b82f6" }}>Explorer →</span>
                  </div>
              ))}
            </div>
        )}

        {/* Entité centrale */}
        {selected && (
            <div style={{
              position: "absolute", top: 12, left: 12, zIndex: 10,
              background: "#0d1220", border: "1px solid #1e2a3a",
              borderRadius: "10px", padding: "10px 14px", maxWidth: "240px"
            }}>
              <div style={{ fontWeight: 700, marginBottom: "4px", color: "#60a5fa", fontSize: "13px" }}>
                {selected.name}
              </div>
              <div style={{ color: "#64748b", fontSize: "11px" }}>
                Clique sur un nœud pour l'explorer
              </div>
              <button onClick={() => { setSelected(null); loadProgramGraph(program); }} style={{
                marginTop: "8px", fontSize: "11px", color: "#64748b",
                background: "none", border: "none", cursor: "pointer", padding: 0
              }}>← Vue d'ensemble</button>
            </div>
        )}

        {!selected && !loading && (
            <div style={{
              position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
              background: "#0d1220", border: "1px solid #1e2a3a", borderRadius: "10px",
              padding: "8px 18px", fontSize: "12px", color: "#64748b", zIndex: 10,
              textAlign: "center", pointerEvents: "none", whiteSpace: "nowrap"
            }}>
              Recherche une entité · Clique pour explorer · Scroll pour zoomer
            </div>
        )}

        {loading && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center", background: "#0a0e1a99", zIndex: 5
            }}>
              <div style={{ color: "#64748b" }}>Chargement...</div>
            </div>
        )}

        <svg ref={svgRef} width="100%" height="100%" />
      </div>
  );
}