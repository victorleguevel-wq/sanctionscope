import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/stats`).then(r => setStats(r.data));
    axios.get(`${API_URL}/sources`).then(r => setSources(r.data));
  }, []);

  if (!stats) return null;

  const colorFor = key => sources.find(s => s.key === key)?.color || "#64748b";

  const items = [
    {
      label: "OFAC",
      value: stats.total_ofac?.toLocaleString(),
      sublabel: "entités sanctionnées",
      tooltip: "Entités inscrites sur la liste SDN de l'OFAC américain",
      color: colorFor("OFAC"),
    },
    {
      label: "ONU",
      value: stats.total_un?.toLocaleString(),
      sublabel: "entités sanctionnées",
      tooltip: "Entités inscrites sur la liste consolidée des sanctions du Conseil de sécurité de l'ONU",
      color: colorFor("UN"),
    },
    {
      label: "EU",
      value: stats.total_eu?.toLocaleString(),
      sublabel: "entités sanctionnées",
      tooltip: "Entités inscrites sur les listes de sanctions de l'Union Européenne (OpenSanctions)",
      color: colorFor("EU"),
    },
    {
      label: "CN",
      value: stats.total_cn?.toLocaleString(),
      sublabel: "contre-sanctions",
      tooltip: "Entités visées par les contre-sanctions chinoises",
      color: colorFor("CN"),
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