import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "./BingChecker.css";
import { handleError, handleSuccess } from "../../toastutils";

const MAX_FETCH_RETRIES = 3;

function BingChecker() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkStatus, setCheckStatus] = useState(null);
  const [showCheckerTab, setShowCheckerTab] = useState(false);
  const pollingRef = useRef(null);
  const fetchRetryCount = useRef(0);

  const superCategory = localStorage.getItem("superCategory") || "natural";
  const apiBase =
    superCategory === "casino"
      ? "casino/indexcheck"
      : superCategory === "dating"
      ? "dating/indexcheck"
      : "api/indexcheck";

  // ============ FETCH UNINDEXED DOMAINS ============
  const fetchUnindexedDomains = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/unindexed-domains`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRetryCount.current = 0;
      setDomains(res.data.unindexed || []);
    } catch (err) {
      console.error("Failed to fetch unindexed domains:", err);
      setError("Error fetching Bing index data");
      if (fetchRetryCount.current < MAX_FETCH_RETRIES) {
        fetchRetryCount.current += 1;
        setTimeout(fetchUnindexedDomains, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const syncTokenToExtension = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    window.postMessage({
      type: "SAVE_TOKEN_TO_EXTENSION",
      token
    }, "*");
  };

  // ============ START CHECKING ============
  const handleStartCheck = async () => {
    if (isChecking) {
      handleError("⏳ Check already in progress!");
      return;
    }

    const token = localStorage.getItem("token");

    syncTokenToExtension();

    try {
      setIsChecking(true);
      setShowCheckerTab(true);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/bing-check-start`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.queued > 0) {
        handleSuccess(`✅ Started checking ${res.data.queued} domains`);

        window.postMessage({ type: "START_BING_CHECK" }, "*");
        startStatusPolling();
      } else {
        setIsChecking(false);
        setShowCheckerTab(false);
        handleSuccess("✅ All domains already checked!");
      }
    } catch (err) {
      console.error("Error starting check:", err);
      handleError(err.response?.data?.error || "❌ Error starting check");
      setIsChecking(false);
      setShowCheckerTab(false);
    }
  };
  const startStatusPolling = () => {
    const token = localStorage.getItem("token");

    pollingRef.current = setInterval(async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URI}/${apiBase}/bing-check-status`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setCheckStatus(res.data);

        if (!res.data.isChecking && res.data.checkedCount > 0) {
          clearInterval(pollingRef.current);
          setIsChecking(false);
          setShowCheckerTab(false);
          await fetchUnindexedDomains();
          handleSuccess("✅ All domains checked!");
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 4000);
  };

  const handleStopCheck = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URI}/${apiBase}/bing-check-stop`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (pollingRef.current) clearInterval(pollingRef.current);

      setIsChecking(false);
      setShowCheckerTab(false);
      setCheckStatus(null);
      handleSuccess("✅ Checking stopped");
    } catch (err) {
      console.error("Error stopping check:", err);
    }
  };

  const handleSavePDF = () => {
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text("Unindexed Domains Report", 10, y);
    y += 10;
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 10, y);
    y += 8;
    doc.text(`Total Unindexed: ${filteredDomains.length}`, 10, y);
    y += 10;

    doc.setFontSize(10);
    filteredDomains.forEach((site, index) => {
      const domainText = `${index + 1}. ${site.domain}`;
      const lastChecked = site.lastBingCheck
        ? `(${new Date(site.lastBingCheck).toLocaleDateString()})`
        : "(Never checked)";

      doc.text(domainText, 10, y);
      doc.setFontSize(8);
      doc.text(lastChecked, 15, y + 4);
      doc.setFontSize(10);
      y += 10;

      if (y > 270) { doc.addPage(); y = 10; }
    });

    doc.save(`unindexed_domains_${new Date().toISOString().slice(0, 10)}.pdf`);
    handleSuccess("📄 PDF saved successfully!");
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    });
  };

  const handleCopyAll = () => {
    const allDomains = filteredDomains.map(d => d.domain).join("\n");
    navigator.clipboard.writeText(allDomains).then(() => {
      handleSuccess("✅ All domains copied!");
    });
  };

  useEffect(() => {
    fetchUnindexedDomains();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const filteredDomains = domains.filter((site) =>
    typeof site.domain === "string" &&
    site.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bing-checker-container">

      {loading ? (
        <div className="bing-checker-loading">
          <div className="spinner"></div>
          <p className="loading-text">Loading cached results...</p>
        </div>
      ) : error ? (
        <div className="bing-checker-error">
          ❌ {error}
          <br />
          <button className="bing-retry-btn" onClick={() => { fetchRetryCount.current = 0; fetchUnindexedDomains(); }}>
            🔁 Retry
          </button>
        </div>
      ) : domains.length === 0 ? (
        <div className="bing-checker-success-container">
          <p className="bing-checker-success">✅ All your domains are indexed!</p>
          <button className="bing-checker-button" onClick={handleStartCheck} disabled={isChecking}>
            {isChecking ? "🔄 Checking..." : "📌 Run Check Again"}
          </button>
        </div>
      ) : (
        <div className="bing-checker-results">
          <div className="bing-checker-controls">
            <div className="bing-checker-button-index">
              <div className="button-group">
                <button className="bing-checker-button" onClick={handleStartCheck} disabled={isChecking}>
                  {isChecking ? "🔄 Checking..." : "Check Domain"}
                </button>
                {isChecking && (
                  <button className="bing-stop-btn" onClick={handleStopCheck}>
                    <i class="fa-solid fa-circle-stop"></i> Stop
                  </button>
                )}
              </div>
              <p className="bing-checker-subtitle">
                {filteredDomains.length} domain{filteredDomains.length > 1 ? "s" : ""} not indexed
              </p>
            </div>

            {isChecking && checkStatus && (
              <div className="check-status">
                <p className="status-title">📊 Checking Progress</p>
                <div className="status-grid">
                  <div className="status-item">
                    <span className="status-label">Checked:</span>
                    <span className="status-value">{checkStatus.checkedCount}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Blocked:</span>
                    <span className="status-value">{checkStatus.blockedCount}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Queue:</span>
                    <span className="status-value">{checkStatus.totalQueued}</span>
                  </div>
                </div>
              </div>
            )}

            {showCheckerTab && (
              <div className="checker-info">
                <p>💡 The extension is checking domains in the background. Solve CAPTCHAs if they appear. Checking continues automatically!</p>
              </div>
            )}
          </div>

          <div className="bing-checker-actions">
            <input
              type="text"
              placeholder="🔍 Search domain..."
              className="bing-checker-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="bing-download-btn" onClick={handleSavePDF}><i class="fa-solid fa-file-arrow-down"></i> PDF</button>
            <button className="bing-copy-all-btn" onClick={handleCopyAll}><i class="fa-regular fa-copy"></i>  Copy All</button>
          </div>

          <ul className="bing-checker-list">
            {filteredDomains.map((site, idx) => {
              const { domain, lastBingCheck, bingResultCount } = site;
              const lastCheckedDate = lastBingCheck
                ? new Date(lastBingCheck).toLocaleString()
                : "Never checked";

              return (
                <li key={idx} className="bing-checker-item">
                  <div className="bing-item-content">
                    <a
                      href={`https://www.bing.com/search?q=site:${domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bing-checker-link"
                    >
                      🔗 {domain}
                    </a>
                  </div>
                    <div className="bing-checker-time">⏱️ {lastCheckedDate}</div>
                    {bingResultCount !== undefined && (
                      <div className="bing-result-count">🔢 {bingResultCount} results</div>
                    )}
                  <button className="bing-copy-btn" onClick={() => handleCopy(domain, idx)}>
                    {copiedIndex === idx ? <i class="fa-solid fa-check-to-slot"></i> : <i class="fa-solid fa-copy"></i>}
                  </button>
                </li>
              );
            })}
          </ul>

          {filteredDomains.length === 0 && searchTerm && (
            <p className="bing-no-results">No domains match "{searchTerm}"</p>
          )}
        </div>
      )}
    </div>
  );
}

export default BingChecker;