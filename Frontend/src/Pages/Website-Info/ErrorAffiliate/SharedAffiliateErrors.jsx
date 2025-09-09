import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ErrorAffiliate.css";
import { handleError } from "../../../toastutils";

function SharedAffiliateErrors() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isBackgroundCheck, setIsBackgroundCheck] = useState(false);
  const [selectedTab, setSelectedTab] = useState("missing"); // ✅ new state

  const superCategory = localStorage.getItem("superCategory") || "natural";
  const apiBase =
    superCategory === "casino"
      ? "casino/scraper"
      : superCategory === "dating"
      ? "dating/scraper"
      : "api/scraper";

  // ✅ Load cached errors
  const fetchAffiliateErrorsCached = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/get-affiliate-errors`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      setErrors(res.data.errors || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      handleError("❌ Failed to load cached affiliate errors");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Live re-check
  const refreshAffiliateErrors = async () => {
    setIsBackgroundCheck(true);
    try {
      const [freshCheck, cachedCheck] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URI}/${apiBase}/check-affiliate-errors`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URI}/${apiBase}/get-affiliate-errors`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);

      const missingLinks = (cachedCheck.data.errors || []).filter(
        (e) => e.error === "No affiliate link found"
      );
      const brokenLinks = (freshCheck.data.errors || []).filter(
  (e) => e.error && e.error !== "No affiliate link found"
      );

      setErrors([...missingLinks, ...brokenLinks]);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      handleError("❌ Failed to refresh affiliate errors");
    } finally {
      setIsBackgroundCheck(false);
    }
  };

  useEffect(() => {
  if (errors.length === 0) {
    fetchAffiliateErrorsCached();
  }
}, []);

  // ✅ Split into categories
  const missingLinks = errors.filter((e) => e.error === "No affiliate link found");
  const brokenLinks = errors.filter((e) => e.error !== "No affiliate link found");

  return (
    <div className="affiliate-errors-container">
      <div className="affiliate-errors-header">
        <h2 className="affiliate-errors-title">🚨 Affiliate Link Issues</h2>

        <button
          onClick={refreshAffiliateErrors}
          disabled={isBackgroundCheck}
          className="affiliate-errors-refresh-btn"
        >
          {isBackgroundCheck ? "🔄 Checking..." : "🔁 Refresh"}
        </button>

        {lastUpdated && (
          <p className="affiliate-last-updated">🕒 Last Updated: {lastUpdated}</p>
        )}
      </div>

      {/* ✅ Tab Buttons */}
      <div className="affiliate-errors-tabs">
        <button
          className={`affiliate-tab-btn ${selectedTab === "missing" ? "active" : ""}`}
          onClick={() => setSelectedTab("missing")}
        >
          ⚠️ Missing Links ({missingLinks.length})
        </button>
        <button
          className={`affiliate-tab-btn ${selectedTab === "broken" ? "active" : ""}`}
          onClick={() => setSelectedTab("broken")}
        >
          ❌ Broken Links ({brokenLinks.length})
        </button>
      </div>

      {/* ✅ Success message (per tab) */}
{!loading && selectedTab === "missing" && missingLinks.length === 0 && (
  <p className="affiliate-errors-success-msg">
    ✅ No missing affiliate links!
  </p>
)}

{!loading && selectedTab === "broken" && brokenLinks.length === 0 && (
  <p className="affiliate-errors-success-msg">
    ✅ No broken affiliate links!
  </p>
)}

      {/* ✅ Missing Affiliate Links */}
      {selectedTab === "missing" && missingLinks.length > 0 && (
        <div className="affiliate-errors-section">
          <h3 className="affiliate-errors-subtitle">⚠️ Missing Affiliate Links</h3>
          <ul className="affiliate-errors-list">
            {missingLinks.map((site, index) => (
              <li key={index} className="affiliate-errors-item">
                <p>
                  <strong>Domain:</strong> {site.domain}
                </p>
                <p>
                  <strong>Affiliate Link:</strong>{" "}
                  <a href={site.affiliateLink} target="_blank" rel="noreferrer">
                    {site.affiliateLink}
                  </a>
                </p>
                <p>
                  <strong>Error:</strong> {site.error}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ✅ Broken Affiliate Links */}
      {selectedTab === "broken" && brokenLinks.length > 0 && (
        <div className="affiliate-errors-section">
          <h3 className="affiliate-errors-subtitle">❌ Broken Affiliate Links</h3>
          <ul className="affiliate-errors-list">
            {brokenLinks.map((site, index) => (
              <li key={index} className="affiliate-errors-item">
                <p>
                  <strong>Domain:</strong> {site.domain}
                </p>
                <p>
                  <strong>Affiliate Link:</strong>{" "}
                  <a href={site.affiliateLink} target="_blank" rel="noreferrer">
                    {site.affiliateLink}
                  </a>
                </p>
                <p>
                  <strong>Error:</strong> {site.error || "Unknown error"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SharedAffiliateErrors;
