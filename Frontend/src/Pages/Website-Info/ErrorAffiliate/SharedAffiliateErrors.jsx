import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./ErrorAffiliate.css";
import { handleError } from '../../../toastutils';

function SharedAffiliateErrors() {
  const [errors, setErrors] = useState(() => {
    const cached = localStorage.getItem("cachedErrorAffiliate");
    return cached ? JSON.parse(cached) : [];
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const superCategory = localStorage.getItem("superCategory") || "natural"; 
  const apiBase = superCategory === "casino"
    ? "casino/scraper"
    : superCategory === "dating"
    ? "dating/scraper"
    : "api/scraper";


  const fetchAffiliateErrors = async (isManual = false) => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URI}/${apiBase}/check-affiliate-errors`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = res.data.errors || [];
      setErrors(data);
      localStorage.setItem("cachedErrorAffiliate", JSON.stringify(data));
      setLastUpdated(new Date().toLocaleTimeString());

    } catch (err) {
      if (isManual) handleError('❌ Failed to fetch affiliate errors');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load from cache or fetch on mount
  useEffect(() => {
    const cached = localStorage.getItem("cachedErrorAffiliate");
    if (!cached) {
      fetchAffiliateErrors();
    } else {
      setLoading(false);
      setLastUpdated(new Date().toLocaleTimeString()); // show last seen time
    }

    // Optional auto-refresh every 1 min
    const interval = setInterval(() => {
      fetchAffiliateErrors(false);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="affiliate-errors-container">
      <div className="affiliate-errors-header">
        <h2 className="affiliate-errors-title">🚨 Failed Affiliate Links</h2>
        <button
          onClick={() => fetchAffiliateErrors(true)}
          disabled={loading}
          className="affiliate-errors-refresh-btn"
        >
          🔁 {loading ? 'Refreshing...' : 'Refresh'}
        </button>
        {lastUpdated && (
          <p className="affiliate-last-updated">🕒 Last Updated: {lastUpdated}</p>
        )}
      </div>

      {errors.length === 0 && !loading ? (
        <p className="affiliate-errors-success-msg">✅ All affiliate links are working!</p>
      ) : (
        <ul className="affiliate-errors-list">
          {errors.map((site, index) => (
            <li key={index} className="affiliate-errors-item">
              <p><strong>Domain:</strong> {site.domain}</p>
              <p>
                <strong>Affiliate Link:</strong>{' '}
                <a href={site.affiliateLink} target="_blank" rel="noreferrer">{site.affiliateLink}</a>
              </p>
              <p><strong>Error:</strong> {site.error || 'Unknown error'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SharedAffiliateErrors;
