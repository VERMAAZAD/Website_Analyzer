import React from "react";

const LinkResults = ({ result, stats, onFetchStats }) => {
  if (!result) {
    return (
      <div className="card link-results">
        <h3>No Link Generated Yet</h3>
        <p>Generate a link to see results here.</p>
      </div>
    );
  }

  return (
    <div className="card link-results">
      <h3>✅ Created Successfully</h3>

      <p>
        <strong>Tracking URL:</strong>{" "}
        <a href={result.trackingUrl} target="_blank" rel="noreferrer">
          {result.trackingUrl}
        </a>
      </p>

      {result.target && (
        <p>
          <strong>Target:</strong> {result.target}
        </p>
      )}

      {result.trackingUrls && (
        <div>
          <h4>🔗 Step-by-Step Links</h4>
          <table>
            <thead>
              <tr>
                <th>Step</th>
                <th>Tracking URL</th>
                <th>Destination</th>
              </tr>
            </thead>
            <tbody>
              {result.trackingUrls.map((step) => (
                <tr key={step.step}>
                  <td>{step.step}</td>
                  <td>
                    <a href={step.url} target="_blank" rel="noreferrer">
                      {step.url}
                    </a>
                  </td>
                  <td>{step.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button onClick={onFetchStats}>📊 View Stats</button>

      {stats && (
        <div style={{ marginTop: 20 }}>
          <h4>📈 Stats</h4>
          <p>Total Clicks: {stats.summary.totalClicks}</p>
          <p>Unique Visitors: {stats.summary.uniqueVisitors}</p>
          <p>Clicks Last 24h: {stats.summary.clicksLast24h}</p>
          <p>Bot Clicks: {stats.summary.botClicks}</p>
        </div>
      )}
    </div>
  );
};

export default LinkResults;
