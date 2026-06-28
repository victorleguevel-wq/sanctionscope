export default function Sidebar({ entity }) {
  if (!entity) return (
    <div style={{
      width: "300px", borderLeft: "1px solid #1e2a3a",
      padding: "24px", color: "#64748b", fontSize: "14px"
    }}>
      <p>Cliquez sur un nœud pour voir les détails</p>
    </div>
  );

  const colors = { OFAC: "#ef4444", UN: "#3b82f6", EU: "#10b981" };

  return (
    <div style={{
      width: "300px", borderLeft: "1px solid #1e2a3a",
      padding: "24px", overflowY: "auto", background: "#0d1220"
    }}>
      <div style={{
        display: "inline-block", padding: "2px 10px",
        background: colors[entity.source] || "#64748b",
        borderRadius: "12px", fontSize: "11px", marginBottom: "12px"
      }}>
        {entity.source}
      </div>

      <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", lineHeight: 1.4 }}>
        {entity.name}
      </h2>

      <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "16px" }}>
        {entity.type}
      </div>

      {entity.programs?.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>PROGRAMMES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {entity.programs.map(p => (
              <span key={p} style={{
                padding: "2px 8px", background: "#1e2a3a",
                borderRadius: "4px", fontSize: "12px"
              }}>{p}</span>
            ))}
          </div>
        </div>
      )}

      {entity.aliases?.length > 0 && (
        <div>
          <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
            ALIASES ({entity.aliases.length})
          </div>
          {entity.aliases.slice(0, 8).map((a, i) => (
            <div key={i} style={{
              padding: "6px 0", borderBottom: "1px solid #1e2a3a",
              fontSize: "12px", color: "#94a3b8"
            }}>
              {a.alias}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
