import { useState, useEffect } from "react";
import axios from "axios";

export default function Stats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:8000/stats").then(r => setStats(r.data));
  }, []);

  if (!stats) return null;

  const items = [
    {
      label: "OFAC",
      value: stats.total_ofac?.toLocaleString(),
      sublabel: "entités sanctionnées",
      tooltip: "Entités inscrites sur la liste SDN de l'OFAC américain",
      color: "#ef4444",
    },
    {
      label: "ONU",
      value: stats.total_un?.toLocaleString(),
      sublabel: "entités sanctionnées",
      tooltip: "Entités inscrites sur la liste consolidée des sanctions du Conseil de sécurité de l'ONU",
      color: "#3b82f6",
    },
    {
      label: "EU",
      value: stats.total_eu?.toLocaleString(),
      sublabel: "entités sanctionnées",
      tooltip: "Entités inscrites sur les listes de sanctions de l'Union Européenne (OpenSanctions)",
      color: "#22c55e",
    },
    {
      label: "CN",
      value: stats.total_cn?.toLocaleString(),
      sublabel: "contre-sanctions",
      tooltip: "Entités visées par les contre-sanctions chinoises",
      color: "#f59e0b",
    },
    {
      label: "Matches",
      value: stats.total_matches?.toLocaleString(),
      sublabel: "entités en commun",
      tooltip: "Entités présentes à la fois dans les listes OFAC et ONU",
      color: "#a78bfa",
    },
  ];

  return (
      <div style={{ display: "flex", gap: "24px", marginLeft: "auto" }}>
        {items.map(s => (
            <div
                key={s.label}
                title={s.tooltip}
                style={{ textAlign: "center", cursor: "help" }}
            >
              <div style={{ fontSize: "18px", fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", fontWeight: 600 }}>
                {s.label}
              </div>
              <div style={{ fontSize: "10px", color: "#475569", marginTop: "1px" }}>
                {s.sublabel}
              </div>
            </div>
        ))}
      </div>
  );
}