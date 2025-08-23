import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ErrorAffiliate.css";
import { handleError } from "../../../toastutils";

function SharedAffiliateErrors() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isBackgroundCheck, setIsBackgroundCheck] = useState(false);

  const superCategory = localStorage.getItem("superCategory") || "natural";
  const apiBase =
    superCategory === "casino"
      ? "casino/scraper"
      : superCategory === "dating"
      ? "dating/scraper"
      : "api/scraper";

  // ✅ Load cached errors from backend (fast response)
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
      setLoading(false); // ✅ important, ends initial loading
    }
  };

  // ✅ Force a fresh check (slower, live re-check)
  const refreshAffiliateErrors = async () => {
    setIsBackgroundCheck(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/check-affiliate-errors`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      setErrors(res.data.errors || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      handleError("❌ Failed to refresh affiliate errors");
    } finally {
      setIsBackgroundCheck(false);
    }
  };

  useEffect(() => {
    // 1. Load cached data immediately
    fetchAffiliateErrorsCached();

    // 2. Trigger live refresh after 3s
    const timer = setTimeout(() => refreshAffiliateErrors(), 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="affiliate-errors-container">
      <div className="affiliate-errors-header">
        <h2 className="affiliate-errors-title">🚨 Failed Affiliate Links</h2>

        <button
          onClick={refreshAffiliateErrors}
          disabled={isBackgroundCheck}
          className="affiliate-errors-refresh-btn"
        >
          {isBackgroundCheck ? "🔄 Checking..." : "🔁 Refresh"}
        </button>

        {lastUpdated && (
          <p className="affiliate-last-updated">
            🕒 Last Updated: {lastUpdated}
          </p>
        )}
      </div>

      {/* ✅ Empty / success state */}
      {!loading && errors.length === 0 ? (
        <p className="affiliate-errors-success-msg">
          ✅ All affiliate links are working!
        </p>
      ) : null}

      {/* ✅ Error list */}
      {errors.length > 0 && (
        <ul className="affiliate-errors-list">
          {errors.map((site, index) => (
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
      )}
    </div>
  );
}

export default SharedAffiliateErrors;
