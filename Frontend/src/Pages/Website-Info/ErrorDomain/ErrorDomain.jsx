import { useEffect, useState } from "react";
import axios from "axios";
import "./ErrorDomain.css";
import { IoMdAddCircleOutline } from "react-icons/io";
import { MdOutlineSettingsBackupRestore } from "react-icons/md";



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


  const [showManualModal, setShowManualModal] = useState(false);
  const [manualDomain, setManualDomain] = useState(null);
  const [manualCategory, setManualCategory] = useState("Suspended");
  const [customCategory, setCustomCategory] = useState("");
  const [manualDomains, setManualDomains] = useState([]);
  const [selectedManualCategory, setSelectedManualCategory] = useState(null);

  const [activeTab, setActiveTab] = useState("errors");


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
  526: "SSL Handshake / Connection Failure",
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
    return res.data.errorDomains || [];
  } catch (err) {
    console.error("Failed to load existing error domains:", err);
    setError("Failed to load existing error domains.");
    return [];
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
    const domains = await fetchExistingErrorDomains(true); // ✅ silent mode (no loading spinner)

    const allUpdated = domains.every(
      d => new Date(d.lastChecked) > new Date(Date.now() - 2*60*1000)
    );
    if (allUpdated) break;
    tries++;
  }
};

  const uniqueStatusCodes = [...new Set(
  errorDomains.map(site => site.statusCode)
)].sort((a, b) => a - b);


  const filteredDomains = selectedStatus
    ? errorDomains.filter(site => site.statusCode === selectedStatus)
    : errorDomains;



const addManualErrorDomain = async () => {
  const token = localStorage.getItem("token");
  if (!token || !manualDomain) return;

  const finalCategory =
    manualCategory === "Custom"
      ? customCategory.trim()
      : manualCategory;

  if (!finalCategory) {
    alert("Please enter a category");
    return;
  }

  try {
    await axios.post(
      `${import.meta.env.VITE_API_URI}/${apiBase}/error-domain/manual`,
      {
        domain: manualDomain,
        category: finalCategory,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setShowManualModal(false);
    setManualDomain(null);
    setManualCategory("Suspended");
    setCustomCategory("");

    // refresh list
    fetchExistingErrorDomains(true);
    fetchManualErrorDomains();
  } catch (err) {
    console.error("Failed to add manual error domain", err);
  }
};


const fetchManualErrorDomains = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URI}/${apiBase}/error-domain/manual`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setManualDomains(res.data.domains || []);
  } catch (err) {
    console.error("Failed to load manual error domains", err);
  }
};


useEffect(() => {
  fetchExistingErrorDomains();
  fetchManualErrorDomains();
}, []);


const restoreDomain = async (domain) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    await axios.put(
      `${import.meta.env.VITE_API_URI}/${apiBase}/error-domain/manual/restore/${domain}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchExistingErrorDomains(true);
    fetchManualErrorDomains();
  } catch (err) {
    console.error("Restore failed", err);
  }
};


  return (
    <div className="errordomain-container">
    <div className="tabs">
      <button
        className={activeTab === "errors" ? "active" : ""}
        onClick={() => setActiveTab("errors")}
      >
       Auto Errors ({errorDomains.length})
      </button>

      <button
        className={activeTab === "manual" ? "active" : ""}
        onClick={() => setActiveTab("manual")}
      >
        Manual Added Errors ({manualDomains.length})
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
      {activeTab === "errors" && (
      <>
      {/* ✅ Status Code Filter Buttons with Meaning */}
       <div className="top-bar">
        <h2>Error Domains</h2>
        <button
          className="add-url-btn"
          onClick={fetchRefreshedErrorDomains}
          disabled={loading}
        >
          Refresh All {loading && "⏳"}
        </button>
      </div>
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
                <button
                    className="manual-add-btn"
                    onClick={() => {
                      setManualDomain(site.domain);
                      setShowManualModal(true);
                    }}
                  >
                  <IoMdAddCircleOutline /> Reason
                </button>
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
      
      {showManualModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h3>Add Manual Error</h3>

      <p><strong>{manualDomain}</strong></p>

      <select
        value={manualCategory}
        onChange={(e) => setManualCategory(e.target.value)}
      >
        <option value="Suspended">Suspended</option>
        <option value="Expired">Expired</option>
        <option value="Custom">Custom</option>
      </select>
        {manualCategory === "Custom" && (
          <input
            type="text"
            placeholder="Enter custom category"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            style={{ marginTop: "10px" }}
          />
        )}
      <div className="modal-actions">
        <button onClick={addManualErrorDomain}>Save</button>
        <button onClick={() => setShowManualModal(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}
  </>
      )}


{/* ===== MANUAL ERROR DOMAINS ===== */}
{activeTab === "manual" && (
  <>
{manualDomains.length > 0 && (
  <div style={{ marginTop: "1rem" }}>
    <h2>Manual Error Domains</h2>

    {/* Category Filter */}
    <div className="status-filter">
      <button
        className={!selectedManualCategory ? "active" : ""}
        onClick={() => setSelectedManualCategory(null)}
      >
        All
      </button>

      {[...new Set(manualDomains.map(d => d.manualErrorCategory))].map(cat => (
        <button
          key={cat}
          className={selectedManualCategory === cat ? "active" : ""}
          onClick={() => setSelectedManualCategory(cat)}
        >
          {cat}
        </button>
      ))}
    </div>

    <ul className="errordomain-list">
      {manualDomains
        .filter(d =>
          selectedManualCategory
            ? d.manualErrorCategory === selectedManualCategory
            : true
        )
        .map((site, i) => (
          <li key={site.domain || i} className="errordomain-card manual">
            <p>
              <strong>Domain:</strong>{" "}
              <a
                href={`https://${site.domain}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {site.domain}
              </a>
            </p>

            <p>
              <strong>Category:</strong> {site.manualErrorCategory}
            </p>

            {site.lastChecked && (
              <p>
                <strong>Last Checked:</strong>{" "}
                {new Date(site.lastChecked).toLocaleString()}
              </p>
            )}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  className="manual-add-btn"
                  onClick={() => restoreDomain(site.domain)}
                >
                  <MdOutlineSettingsBackupRestore /> Restore
                </button>
              </div>
          </li>
        ))}
    </ul>
  </div>
)}
  </>
)}
    </div>
  );
}

export default ErrorDomains;
