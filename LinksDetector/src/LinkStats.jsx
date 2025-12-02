import { useState } from "react";
import { getLinkStats } from "./api";

export default function LinkStats() {
  const [shortId, setShortId] = useState("");
  const [stats, setStats] = useState(null);

  const handleSearch = async () => {
    const data = await getLinkStats(shortId);
    setStats(data);
  };

  return (
    <div style={{ width: "400px", margin: "auto" }}>
      <h2>Check Link Stats</h2>
      <input
        placeholder="Enter shortId"
        value={shortId}
        onChange={(e) => setShortId(e.target.value)}
        style={{ width: "100%", padding: "10px" }}
      />
      <button
        style={{ width: "100%", marginTop: "10px", padding: "10px" }}
        onClick={handleSearch}
      >
        Search
      </button>

      {stats && (
        <div style={{ marginTop: "20px" }}>
          <p><b>Original URL:</b> {stats.originalUrl}</p>
          <p><b>Click Count:</b> {stats.clicks}</p>
          <p><b>Last Click:</b> {stats.lastClicked || "Never"}</p>
        </div>
      )}
    </div>
  );
}
