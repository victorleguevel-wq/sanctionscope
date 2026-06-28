import { useState, useEffect } from "react";
import axios from "axios";

export default function Stats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:8000/stats").then(r => setStats(r.data));
  }, []);

  if (!stats) return null;

  return (
    <div style={{ display: "flex", gap: "24px", marginLeft: "auto" }}>
      {[
        { label: "OFAC", value: stats.total_ofac?.toLocaleString() },
        { label: "ONU", value: stats.total_un?.toLocaleString() },
        { label: "Matches", value: stats.total_matches?.toLocaleString() },
      ].map(s => (
        <div key={s.label} style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#60a5fa" }}>{s.value}</div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
