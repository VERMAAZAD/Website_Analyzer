import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AffiliateLinks.css";

const AffiliateLinks = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("both-ok");
  const [expandedRow, setExpandedRow] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");
  const superCategory = localStorage.getItem("superCategory") || "natural";

  const apiBase =
    superCategory === "casino"
      ? "casino/affiliate"
      : superCategory === "dating"
      ? "dating/affiliate"
      : "api/affiliate";

  const fetchAffiliateLinks = async () => {
    try {
      setError(null);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/category-affiliates`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setData(res.data);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load affiliate links';
      setError(message);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliateLinks();
    const interval = setInterval(fetchAffiliateLinks, 300000);
    return () => clearInterval(interval);
  }, [superCategory]);

  // ✅ Filter logic
  const filteredData = data.filter(item => {
    
     if(!item.category.toLowerCase().includes(search.toLowerCase()))
    return false;

    const pStatus = item.categoryAffiliateLinks?.primary;
    const sStatus = item.categoryAffiliateLinks?.secondary;

    if (!pStatus || !sStatus) return false;

    if (activeTab === "both-ok") {
      return pStatus.status === "ok" && 
             sStatus.status === "ok" && 
             !pStatus.redirectMismatch;
    }

    if (activeTab === "primary-error") {
      return pStatus.status === "error";
    }

    if (activeTab === "secondary-error") {
      return pStatus.status === "ok" && sStatus.status === "error";
    }

    if (activeTab === "both-error") {
      return pStatus.status === "error" && sStatus.status === "error";
    }

    if (activeTab === "redirect-error") {
      return pStatus.reason === "REDIRECT_MISMATCH";
    }

    return true;
  });

  // ✅ Helper to get human-readable error text
  const getErrorText = (reason) => {
    const reasonMap = {
      "REDIRECT_MISMATCH": "🔄 Links redirect to DIFFERENT places",
      "SERVER_ERROR": "🔴 Server error (5xx)",
      "HTTP_ERROR": "❌ HTTP error (4xx)",
      "OFFER_EXPIRED": "⏰ Offer expired",
      "TEMP_BLOCKED": "🚫 Temporarily blocked",
      "NETWORK_ERROR": "📡 Network error",
      "SLOW_RESPONSE": "⏱️ Timeout (slow response)",
      "CONNECTION_REFUSED": "❌ Connection refused",
      "DOMAIN_NOT_FOUND": "❓ Domain not found",
      "TIMEOUT": "⏳ Request timeout",
      "CHECK_FAILED": "⚠️ Check failed"
    };
    return reasonMap[reason] || reason || "Unknown error";
  };

  // ✅ Render redirect chain
  const renderRedirectChain = (chain) => {
    if (!chain || chain.length === 0) return null;
    
    return (
      <div className="redirect-chain">
        <strong>Redirect Chain:</strong>
        <ol className="chain-list">
          {chain.map((url, idx) => (
            <li key={idx} className="chain-item">
              <code>{url}</code>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  // ✅ Render response details
  const renderResponseDetails = (result) => {
    if (!result) return null;

    return (
      <div className="response-details">
        <div className="detail-item">
          <span>HTTP Status:</span>
          <strong className={`http-${Math.floor(result.httpStatus / 100)}`}>
            {result.httpStatus || 'N/A'}
          </strong>
        </div>
        <div className="detail-item">
          <span>Response Time:</span>
          <strong className={result.responseTime > 5000 ? "slow" : ""}>
            {result.responseTime}ms
          </strong>
        </div>
      </div>
    );
  };

  return (
    <section className="affiliate-page">
      <h2>Affiliate Links Status</h2>

      <div className="affiliate-tabs">
        <button
          className={activeTab === "both-ok" ? "tab active" : "tab"}
          onClick={() => setActiveTab("both-ok")}
        >
          Both Working
        </button>

        <button
          className={activeTab === "primary-error" ? "tab active" : "tab"}
          onClick={() => setActiveTab("primary-error")}
        >
          Primary Error
        </button>

        <button
          className={activeTab === "secondary-error" ? "tab active" : "tab"}
          onClick={() => setActiveTab("secondary-error")}
        >
          Secondary Error
        </button>

        <button
          className={activeTab === "both-error" ? "tab active" : "tab"}
          onClick={() => setActiveTab("both-error")}
        >
          Both Error
        </button>

        <button
          className={activeTab === "redirect-error" ? "tab active" : "tab"}
          onClick={() => setActiveTab("redirect-error")}
        >
          Redirect Mismatch
        </button>
      </div>
    <input
      className="affiliate-search"
      placeholder="Search category..."
      onChange={(e)=>setSearch(e.target.value)}
      />
      <table className="affiliate-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Links</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                 {error && <div className="error-banner">{error}</div>}
                 {loading && !error && <p>Loading...</p>}
              </td>
            </tr>
          ) : filteredData.length === 0 ? (
            <tr>
              <td colSpan="4" className="no-affiliate">
                No affiliate links in this category.
              </td>
            </tr>
          ) : (
            filteredData.map((item) => {
              const p = item.categoryAffiliateLinks?.primary;
              const s = item.categoryAffiliateLinks?.secondary;
              const isExpanded = expandedRow === item.category;

              return (
                <React.Fragment key={item.category}>
                  <tr className="main-row">
                    <td className="category-cell">
                      <strong>{item.category}</strong>
                    </td>
                    <td className="links-summary">
                      <div className="link-status">
                        <span className={`badge badge-${p.status}`}>
                          Primary: {p.status}
                        </span>
                        <span className={`badge badge-${s.status}`}>
                          Secondary: {s.status}
                        </span>
                      </div>
                    </td>

                    <td className="status-cell" onClick={() => setExpandedRow(isExpanded ? null : item.category)}>
                      {p.status === "ok" && s.status === "ok" ? (
                        <div className="status-good">
                          <span className="online">{isExpanded ? "Hide Details ↑" : "View Details ↓"}</span>
                        </div>
                      ) : (
                        <div className="status-bad">
                          <span className="offline">{isExpanded ? "Hide Details ↑" : "View Details ↓"}</span>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* ✅ Expanded details row */}
                  {isExpanded && (
                    <tr className="expanded-row">
                      <td colSpan="4">
                        <div className="expanded-content">
                          <div className="expand-about-affiliate">
                          {/* PRIMARY LINK */}
                          {p?.url && (
                            <div className="link-details">
                              <div className="linksdetails-header">
                                 <h4>🔵 Primary (Clocker) Link</h4>
                                <div className="link-status-section">
                                <span className={`badge badge-${p.status}`}>
                                  {p.status}
                                </span>
                                {p.reason && (
                                  <div className="error-message">
                                    {getErrorText(p.reason)}
                                  </div>
                                )}
                              </div>
                              </div>
                             
                              <div className="link-url-section">
                                <strong>URL:</strong>
                                <a href={p.url} target="_blank" rel="noreferrer">
                                  {p.url}
                                </a>
                              </div>

                              <div className="final-url-section">
                                <strong>Final URL (after redirects):</strong>
                                <code>{p.finalUrl || "N/A"}</code>
                              </div>

                              {renderResponseDetails(p)}
                              {renderRedirectChain(p.redirectChain)}
                            </div>
                          )}

                          {/* SECONDARY LINK */}
                          {s?.url && (
                            <div className="link-details">
                              <div className="linksdetails-header">
                              <h4>🟢 Secondary (Affiliate) Link</h4>
                              <div className="link-status-section">
                                <span className={`badge badge-${s.status}`}>
                                  {s.status}
                                </span>
                                {s.reason && (
                                  <div className="error-message">
                                    {getErrorText(s.reason)}
                                  </div>
                                )}
                              </div>
                              </div>
                              <div className="link-url-section">
                                <strong>URL:</strong>
                                <a href={s.url} target="_blank" rel="noreferrer">
                                  {s.url}
                                </a>
                              </div>

                              

                              <div className="final-url-section">
                                <strong>Final URL (after redirects):</strong>
                                <code>{s.finalUrl || "N/A"}</code>
                              </div>

                              {renderResponseDetails(s)}
                              {renderRedirectChain(s.redirectChain)}
                            </div>
                          )}
                        </div>
                          {/* REDIRECT COMPARISON */}
                          {p?.finalUrl && s?.finalUrl && (
                            <div className="redirect-comparison">
                              <h4>🔄 Redirect Comparison</h4>
                              <div className="comparison-row">
                                <div className="url-box primary">
                                  <strong>Primary Final:</strong>
                                  <code>{p.finalUrl}</code>
                                </div>
                                <div className="comparison-symbol">
                                  {p.finalUrl === s.finalUrl ? "✅ MATCH" : "❌ MISMATCH"}
                                </div>
                                <div className="url-box secondary">
                                  <strong>Secondary Final:</strong>
                                  <code>{s.finalUrl}</code>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </section>
  );
};

export default AffiliateLinks;