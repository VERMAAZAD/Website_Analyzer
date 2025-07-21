import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./ErrorAffiliate.css";
import { handleError } from '../../../toastutils';

function SharedAffiliateErrors() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ New: track if refresh is manual
  const [manualRefresh, setManualRefresh] = useState(false);

  const fetchAffiliateErrors = async (isManual = false) => {
    setLoading(true);
    setManualRefresh(isManual);

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URI}/api/scraper/check-affiliate-errors`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setErrors(res.data.errors || []);
    } catch (err) {
      if (isManual) handleError('❌ Failed to fetch affiliate errors');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto-fetch on load & interval (not manual)
  useEffect(() => {
    fetchAffiliateErrors(false);

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
