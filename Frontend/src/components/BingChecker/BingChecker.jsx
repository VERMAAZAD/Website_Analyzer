import React, { useEffect, useState } from "react";
import axios from "axios";
import "./BingChecker.css";

function BingChecker() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);

  const superCategory = localStorage.getItem("superCategory") || "natural";
  const apiBase =
    superCategory === "casino"
      ? "casino/scraper"
      : superCategory === "dating"
      ? "dating/scraper"
      : "api/scraper";

  const fetchCached = async () => {
    const token = localStorage.getItem("token");

    try {
      setLoading(true);
      setError("");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/unindexed-domains`,
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

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500); // Reset after 1.5 sec
    });
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
           {domains.map((site, idx) => {
            const { domain, lastBingCheck } = site;
            return (
              <li key={idx} className="bing-checker-item">
                <a
                  href={`https://www.bing.com/search?q=site:${domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bing-checker-link"
                >
                  🔗 {domain}
                </a>
                <span className="bing-checker-time">
                  ⏱️ {lastBingCheck ? new Date(lastBingCheck).toLocaleString() : "Never"}
                </span>
                <button
                  className="bing-copy-btn"
                  onClick={() => handleCopy(domain, idx)}
                >
                  {copiedIndex === idx ? "✅ Copied" : "📋 Copy"}
                </button>
              </li>
            );
          })}

          </ul>
        </div>
      )}
    </div>
  );
}

export default BingChecker;
