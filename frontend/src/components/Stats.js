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
      tooltip: "Entités inscrites sur la liste SDN (Specially Designated Nationals) de l'OFAC américain",
      color: "#a78bfa",
    },
    {
      label: "ONU",
      value: stats.total_un?.toLocaleString(),
      sublabel: "entités sanctionnées",
      tooltip: "Entités inscrites sur la liste consolidée des sanctions du Conseil de sécurité de l'ONU",
      color: "#60a5fa",
    },
    {
      label: "Matches",
      value: stats.total_matches?.toLocaleString(),
      sublabel: "entités en commun",
      tooltip: "Entités présentes à la fois dans les listes OFAC et ONU (correspondances par nom normalisé)",
      color: "#34d399",
    },
  ];

  return (
      <div style={{ display: "flex", gap: "24px", marginLeft: "auto" }}>
        {items.map(s => (
            <div
                key={s.label}
                title={s.tooltip}
                style={{ textAlign: "center", cursor: "help", position: "relative" }}
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