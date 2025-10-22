  import React, { useEffect, useRef, useState } from "react";
  import axios from "axios";
  import jsPDF from "jspdf";
  import "./BingChecker.css";
import { handleError, handleSuccess } from "../../toastutils";

  function BingChecker() {
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

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

    const [isChecking, setIsChecking] = useState(false);

  const handleManualIndexCheck = async () => {
    const token = localStorage.getItem("token");
    try {
      setIsChecking(true);
       const res = await axios.get(
          `${import.meta.env.VITE_API_URI}/${apiBase}/bing-check?force=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      handleSuccess("✅ Bing Index Check Complete");
    } catch (err) {
      console.error("Error triggering index check", err);
      handleError("❌ Error checking Bing index");
    } finally {
      setIsChecking(false);
    }
  };

 const handleSavePDF = () => {
  const doc = new jsPDF();
  let y = 10;

  doc.setFontSize(16);
  doc.text("Unindexed Domains Report", 10, y);
  y += 10;

  doc.setFontSize(12);
  filteredDomains.forEach((site, index) => {
    const domainText = `${index + 1}. ${site.domain}`;

    // Add domain text
    doc.text(domainText, 10, y);
    y += 7;
    // Add page break if needed
    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save(`unindexed_domains_${new Date().toISOString().slice(0,10)}.pdf`);
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

     const filteredDomains = domains.filter((site) =>
      typeof site.domain === "string" &&
      site.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="bing-checker-results" >
            <div className="bing-checker-button-index">
              <button
                  className="bing-checker-button"
                  onClick={handleManualIndexCheck}
                  disabled={isChecking}
                >
                  {isChecking ? "🔄 Checking Bing Index..." : "📌 Bing Index Check"}
              </button>
                
            <p className="bing-checker-subtitle">
              ❌ {domains.length} domain{domains.length > 1 ? "s" : ""} not indexed:
            </p>
            </div>
              
           

             <input
            type="text"
            placeholder="🔍 Search domain..."
            className="bing-checker-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
  <button className="bing-download-btn" onClick={handleSavePDF}>
  📄 Save as PDF
</button>
            <ul className="bing-checker-list">
            {filteredDomains.map((site, idx) => {
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
