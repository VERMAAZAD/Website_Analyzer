export default function StatsCards({ stats }) {
  if (!stats || !stats.totalVisits) {
    return <p>No data available or loading...</p>;  // handle if stats are empty
  }

  return (
    <div className="stats-container">
      <div className="stat-card">
        <h2>{stats.totalVisits}</h2>
        <p>Total Visits</p>
      </div>

      <div className="stat-card">
        <h2>{stats.uniqueUsers}</h2>
        <p>Unique Users</p>
      </div>

      <div className="stat-card">
        <h2>{stats.avgTime || 0} sec</h2>
        <p>Avg Time on Site</p>
      </div>
    </div>
  );
}
