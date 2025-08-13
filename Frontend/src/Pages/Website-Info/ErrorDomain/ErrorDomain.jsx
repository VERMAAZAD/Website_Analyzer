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
  const [selectedStatus, setSelectedStatus] = useState(null);

  // ✅ HTTP Status code meanings
const statusCodeMeanings = {
  200: "OK",
  301: "Moved Permanently",
  302: "Found",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  408: "Request Timeout",
  410: "Gone",
  429: "Too Many Requests",
  495: "SSL Certificate Error (Self-signed)",
  496: "SSL Certificate Verification Error",
  497: "SSL Certificate Expired",
  498: "Domain Suspended",
  499: "Expired domain / NXDOMAIN",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  525: "SSL Handshake Failure",
  526: "Connection Timeout",
  527: "Railgun Error",
  522: "Timeout b/w Cloudflare and origin server",
};

const fetchExistingErrorDomains = async (silent = false) => {
  const token = localStorage.getItem("token");
  if (!token) {
    setError("Missing authentication token. Please login again.");
    return;
  }

  if (!silent) setLoading(true);

  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URI}/${apiBase}/error-domain`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setErrorDomains(res.data.errorDomains || []);
  } catch (err) {
    console.error("Failed to load existing error domains:", err);
    setError("Failed to load existing error domains.");
  } finally {
    if (!silent) setLoading(false);
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
      // 1️⃣ Immediately load existing errors so UI updates fast
      await fetchExistingErrorDomains();

      // 2️⃣ Trigger backend refresh in background
      axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/refresh-and-errors`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(err => console.error("Background refresh failed:", err));

      // 3️⃣ Poll once after 5 seconds for updated data
      setTimeout(fetchExistingErrorDomains, 5000);

      await pollUntilUpdated();
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error("Failed to trigger refresh:", err);
      setError("Failed to refresh error domains.");
    } finally {
      setLoading(false);
    }
  };
const pollUntilUpdated = async () => {
  let tries = 0;
  while (tries < 20) { // up to ~100 seconds
    await new Promise(r => setTimeout(r, 5000));
    await fetchExistingErrorDomains(true); // ✅ silent mode (no loading spinner)
    const allUpdated = errorDomains.every(
      d => new Date(d.lastChecked) > new Date(Date.now() - 2*60*1000)
    );
    if (allUpdated) break;
    tries++;
  }
};
  useEffect(() => {
    fetchExistingErrorDomains();
  }, []);

  const uniqueStatusCodes = [...new Set(errorDomains.map(site => site.statusCode))];

  const filteredDomains = selectedStatus
    ? errorDomains.filter(site => site.statusCode === selectedStatus)
    : errorDomains;

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

      {/* ✅ Status Code Filter Buttons with Meaning */}
      {uniqueStatusCodes.length > 0 && (
        <div className="status-filter">
          <button
            className={`status-btn ${selectedStatus === null ? "active" : ""}`}
            onClick={() => setSelectedStatus(null)}
          >
            All
          </button>
          {uniqueStatusCodes.map(code => (
            <button
              key={code}
              className={`status-btn ${selectedStatus === code ? "active" : ""}`}
              onClick={() => setSelectedStatus(code)}
              title={statusCodeMeanings[code] || "Unknown Status"}
            >
              {code} – {statusCodeMeanings[code] || "Unknown"}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p>Refreshing domains... <span className="loading-spinner">⏳</span></p>
      ) : filteredDomains.length === 0 ? (
        <p>All domains are healthy ✅</p>
      ) : (
        <>
          <p>Total Domains with Errors: {filteredDomains.length}</p>
          <ul className="errordomain-list">
            {filteredDomains.map((site, i) => (
              <li key={site.domain || i} className="errordomain-card">
                <p>
                    <strong>Domain:</strong>{" "}
                    {site.domain ? (
                      <a
                        href={`https://${site.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {site.domain}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </p>
                <p>
                  <strong>Status Code:</strong> {site.statusCode || "Unknown"}{" "}
                  <span className="status-meaning">
                    ({statusCodeMeanings[site.statusCode] || "Unknown"})
                  </span>
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
      )}
    </div>
  );
}

export default ErrorDomains;
