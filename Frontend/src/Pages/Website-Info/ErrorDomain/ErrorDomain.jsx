import { useEffect, useState } from "react";
import axios from "axios";
import "./ErrorDomain.css";

function ErrorDomains() {
  const superCategory = localStorage.getItem("superCategory") || "natural";
  const apiBase =
    superCategory === "casino"
      ? "casino/scraper"
      : superCategory === "dating"
      ? "dating/scraper"
      : "api/scraper";
  const [errorDomains, setErrorDomains] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summaryMessage, setSummaryMessage] = useState("");

  const fetchExistingErrorDomains = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Missing authentication token. Please login again.");
      return;
    }
    setLoading(true);
    
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/error-domain`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setErrorDomains(res.data.errorDomains || []);
    } catch (err) {
      console.error("Failed to load existing error domains:", err);
      setError("Failed to load existing error domains.");
    }
    finally {
    setLoading(false); 
  }
  };

  const fetchRefreshedErrorDomains = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Missing authentication token. Please login again.");
      return;
    }

    setLoading(true);
    setError(null);
    setSummaryMessage("");

    try {
      // Step 1: Refresh data in backend
      await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/refresh-and-errors`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Step 2: Fetch updated error domains
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/error-domain`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let domains = [];

      if (Array.isArray(res.data)) {
        domains = res.data;
      } else if (Array.isArray(res.data.errorDomains)) {
        setSummaryMessage(res.data.message || "");
        domains = res.data.errorDomains;
      } else {
        console.warn("Unexpected response structure:", res.data);
      }

      setErrorDomains([...domains]); // ✅ FIXED: This was missing earlier
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error("Failed to fetch refreshed error domains:", err);
      setError("Failed to refresh error domains. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExistingErrorDomains();
  }, []);

  return (
    <div className="errordomain-container">
      <div className="top-bar">
        <h2>Domains with Errors (StatusCode ≠ 200)</h2>
        <button
          className="add-url-btn"
          onClick={fetchRefreshedErrorDomains}
          disabled={loading}
        >
          🔁 Refresh All {loading && "⏳"}
        </button>
      </div>

      {lastUpdated && <p className="timestamp">Last Updated: {lastUpdated}</p>}

      {summaryMessage && <div className="message-box">{summaryMessage}</div>}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchRefreshedErrorDomains}>Retry</button>
        </div>
      )}


    {loading ? (
  <p>Refreshing domains... <span className="loading-spinner">⏳</span></p>
) : Array.isArray(errorDomains) && errorDomains.length === 0 ? (
  <p>All domains are healthy ✅</p>
) : (
  
    <p>Total Domains with Errors: {errorDomains.length}</p>
    )}
    <>
    <ul className="errordomain-list">
      {errorDomains.map((site, i) => (
        <li key={site.domain || i} className="errordomain-card">
          <p>
            <strong>Domain:</strong> {site.domain || "N/A"}
          </p>
          <p>
            <strong>Status Code:</strong>{" "}
            {site.statusCode || "Unknown"}
          </p>
          {site.lastChecked && (
            <p>
              <strong>Last Checked:</strong>{" "}
              {new Date(site.lastChecked).toLocaleString()}
            </p>
          )}
        </li>
      ))}
    </ul>
  </>


    </div>
  );
}

export default ErrorDomains;
