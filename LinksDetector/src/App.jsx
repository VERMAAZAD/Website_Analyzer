import { useEffect, useState } from "react";


import { getDomainStats, getRecentFlows } from "./api";

import StatsCards from "./components/StatsCards";
import FlowChart from "./components/FlowChart";
import OutboundChart from "./components/OutboundChart";
import RecentTable from "./components/RecentTable";

export default function App() {
  const [stats, setStats] = useState(null);
  const [flows, setFlows] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const domainStats = await getDomainStats();
        const recent = await getRecentFlows();

        setStats(domainStats);
        setFlows(recent);
      } catch (err) {
        console.error("Analytics Load Error:", err);
      }
    }

    loadData();
  }, []);

  if (!stats || !flows) return <h2 style={{ textAlign: "center" }}>Loading...</h2>;

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">Traffic Analytics Dashboard</h1>

      {/* Total stats */}
      <StatsCards stats={stats.summary} />

      <div className="chart-grid">
        {/* Daily Visits */}
        <FlowChart data={stats.daily} />

        {/* Domain Flow Funnel */}
        <OutboundChart data={stats.funnel} />
      </div>

      {/* Recent Visitors */}
      <RecentTable users={flows} />
    </div>
  );
}
