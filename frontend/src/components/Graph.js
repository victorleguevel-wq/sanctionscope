import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";

const PROGRAM_COLORS = {
  "RUSSIA-EO14024": "#ef4444",
  "RUSSIA-EO14065": "#ef4444",
  "CAATSA - RUSSIA": "#ef4444",
  "IRAN": "#f97316",
  "CAATSA - IRAN": "#f97316",
  "IRAN-EO13876": "#f97316",
  "DPRK": "#8b5cf6",
  "DPRK3": "#8b5cf6",
  "DPRK4": "#8b5cf6",
  "CUBA": "#06b6d4",
  "CUBA-EO14404": "#06b6d4",
  "SYRIA": "#eab308",
  "VENEZUELA": "#ec4899",
  "BELARUS": "#f43f5e",
  "BELARUS-EO14038": "#f43f5e",
  "UKRAINE-EO13660": "#3b82f6",
  "UKRAINE-EO13661": "#3b82f6",
  "UKRAINE-EO13662": "#3b82f6",
  "UKRAINE-EO13685": "#3b82f6",
};

const DEFAULT_COLOR = "#64748b";

function getColor(node) {
  for (const program of (node.programs || [])) {
    if (PROGRAM_COLORS[program]) return PROGRAM_COLORS[program];
  }
  return DEFAULT_COLOR;
}

export default function Graph({ search, onSelect }) {
  const svgRef = useRef();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState("");

  useEffect(() => {
    const fetchAndDraw = async () => {
      setLoading(true);
      try {
        const params = { limit: 120 };
        if (search) params.search = search;
        if (program) params.program = program;
        const { data } = await axios.get("http://localhost:8000/graph", { params });
        draw(data.nodes, data.links);
      } catch(e) {
        console.error(e);
      }
      setLoading(false);
    };
    const timer = setTimeout(fetchAndDraw, 400);
    return () => clearTimeout(timer);
  }, [search, program]);

  const draw = (nodes, links) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Légende
    const legend = svg.append("g").attr("transform", "translate(20, 20)");
    Object.entries(PROGRAM_COLORS).forEach(([prog, color], i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      row.append("circle").attr("r", 5).attr("fill", color);
      row.append("text")
          .attr("x", 12).attr("y", 4)
          .attr("font-size", "11px")
          .attr("fill", "#94a3b8")
          .text(prog);
    });

    const g = svg.append("g");

    svg.call(d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", e => g.attr("transform", e.transform))
    );

    // Calcule le degré de chaque nœud (nombre de connexions)
    const degree = {};
    nodes.forEach(n => degree[n.id] = 0);
    links.forEach(l => {
      degree[l.source] = (degree[l.source] || 0) + 1;
      degree[l.target] = (degree[l.target] || 0) + 1;
    });

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(80))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide(d => 8 + (degree[d.id] || 0) * 2));

    const link = g.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "#1e3a5f")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.4);

    const node = g.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(d3.drag()
            .on("start", (e, d) => {
              if (!e.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x; d.fy = d.y;
            })
            .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
            .on("end", (e, d) => {
              if (!e.active) simulation.alphaTarget(0);
              d.fx = null; d.fy = null;
            })
        )
        .on("click", async (e, d) => {
          const { data } = await axios.get(`http://localhost:8000/entities/${d.id}`);
          onSelect(data);
          // Highlight
          node.selectAll("circle").attr("opacity", n => {
            const linked = links.some(l =>
                (l.source.id === d.id && l.target.id === n.id) ||
                (l.target.id === d.id && l.source.id === n.id) ||
                n.id === d.id
            );
            return linked ? 1 : 0.2;
          });
        });

    node.append("circle")
        .attr("r", d => 5 + (degree[d.id] || 0) * 1.5)
        .attr("fill", d => getColor(d))
        .attr("fill-opacity", 0.85)
        .attr("stroke", "#0a0e1a")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer");

    node.append("text")
        .text(d => d.name.length > 22 ? d.name.slice(0, 22) + "…" : d.name)
        .attr("x", d => 7 + (degree[d.id] || 0) * 1.5)
        .attr("y", 4)
        .attr("font-size", "9px")
        .attr("fill", "#94a3b8")
        .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
          .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
  };

  return (
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Filtres programmes */}
        <div style={{
          position: "absolute", top: 16, right: 16, zIndex: 10,
          display: "flex", gap: "8px", flexWrap: "wrap", maxWidth: "400px",
          justifyContent: "flex-end"
        }}>
          {["", "RUSSIA-EO14024", "CAATSA - RUSSIA", "IRAN", "DPRK", "CUBA", "SYRIA", "VENEZUELA", "BELARUS", "UKRAINE-EO13662"].map(p => (
              <button key={p} onClick={() => setProgram(p)} style={{
                padding: "4px 10px", borderRadius: "12px", border: "none",
                background: program === p ? (PROGRAM_COLORS[p] || "#3b82f6") : "#1e2a3a",
                color: "#e2e8f0", fontSize: "11px", cursor: "pointer",
                fontWeight: program === p ? 700 : 400,
              }}>
                {p || "Tous"}
              </button>
          ))}
        </div>

        {loading && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "#64748b", fontSize: "14px", background: "#0a0e1a99"
            }}>
              Chargement du graphe...
            </div>
        )}
        <svg ref={svgRef} width="100%" height="100%" />
      </div>
  );
}