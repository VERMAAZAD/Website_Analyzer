import React, { useEffect, useState } from "react";
import axios from "axios";
import "./BingChecker.css";

function BingChecker() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCached = async () => {
    const token = localStorage.getItem("token");

    try {
      setLoading(true);
      setError("");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/api/scraper/unindexed-domains`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDomains(res.data.unindexed || []);
    } catch (err) {
      console.error("Failed to fetch unindexed domains:", err);
      setError("Error fetching Bing index data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCached();
  }, []);

  return (
    <div className="bing-checker-container">
      <h2 className="bing-checker-title">🔍 Bing Indexing Checker</h2>

      {loading ? (
          <div className="bing-checker-loading">
            <div className="spinner"></div>
            <p className="loading-text">Loading cached results...</p>
          </div>
        ) : error ? (
        <div className="bing-checker-error">
          ❌ {error}
          <br />
          <button className="bing-retry-btn" onClick={fetchCached}>
            🔁 Retry
          </button>
        </div>
      ) : domains.length === 0 ? (
        <p className="bing-checker-success">✅ All your domains are indexed!</p>
      ) : (
        <div className="bing-checker-results">
          <p className="bing-checker-subtitle">
            ❌ {domains.length} domain{domains.length > 1 ? "s" : ""} not indexed:
          </p>
          <ul className="bing-checker-list">
            {domains.map((domain, idx) => (
              <li key={idx} className="bing-checker-item">{domain}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default BingChecker;
