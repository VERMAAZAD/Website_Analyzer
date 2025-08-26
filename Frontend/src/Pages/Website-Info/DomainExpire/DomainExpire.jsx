import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './DomainExpire.css';
import { handleError, handleSuccess } from '../../../toastutils';

function DomainExpire() {
  const [expiringDomains, setExpiringDomains] = useState([]);
  const [reminderDomains, setReminderDomains] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingDomain, setSavingDomain] = useState(null); // Track domain being saved

  const superCategory = localStorage.getItem("superCategory") || "natural"; 
  const apiBase = superCategory === "casino"
    ? "casino/scraper"
    : superCategory === "dating"
    ? "dating/scraper"
    : "api/scraper";

  useEffect(() => {
    fetchExpiringDomains();
  }, []);

  const fetchExpiringDomains = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URI}/${apiBase}/expiring`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setExpiringDomains(res.data.expiring || []);
      setReminderDomains(res.data.reminder || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (domainName) => {
    setSelectedDomains((prev) =>
      prev.includes(domainName)
        ? prev.filter((d) => d !== domainName)
        : [...prev, domainName]
    );
  };

  const handleSaveSingle = async (domainName) => {
    try {
      setSavingDomain(domainName); // Show loading for this domain
      const res = await axios.post(
        `${import.meta.env.VITE_API_URI}/${apiBase}/renew`,
        { domains: [domainName] },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      handleSuccess(res.data.message || 'Renewed successfully');
      fetchExpiringDomains();
      setSelectedDomains((prev) => prev.filter((d) => d !== domainName));
    } catch (err) {
      handleError(err);
    } finally {
      setSavingDomain(null); // Clear loading
    }
  };

  return (
    <div className="domain-expire-container">
      <h2>Domains Expiring Soon</h2>

      {loading ? (
        <p>Loading...</p>
      ) : expiringDomains.length === 0 ? (
        <p>No domains are expiring within the next 10 days.</p>
      ) : (
        <table className="expire-table">
          <thead>
            <tr>
              <th>Renew</th>
              <th>Domain</th>
              <th>Issue Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {expiringDomains.map((domain, idx) => {
              const issueDate = new Date(domain.issueDate);
              const expiryDate = new Date(issueDate);
              expiryDate.setFullYear(issueDate.getFullYear() + 1);

              const today = new Date();
              const diffTime = expiryDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              return (
                <tr key={idx}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedDomains.includes(domain.domain)}
                      onChange={() => handleCheckboxChange(domain.domain)}
                    />
                  </td>
                  <td>
                    {domain.domain}
                    {domain.note && ` (${domain.note})`}
                  </td>
                  <td>{issueDate.toLocaleDateString()}</td>
                  <td>{expiryDate.toLocaleDateString()}</td>
                  <td>
                    ⚠️ {diffDays} day{diffDays !== 1 ? 's' : ''} remaining
                    <br />
                    {selectedDomains.includes(domain.domain) && (
                      <button
                        className="save-btn-inline"
                        onClick={() => handleSaveSingle(domain.domain)}
                        disabled={savingDomain === domain.domain}
                      >
                        {savingDomain === domain.domain ? 'Saving...' : 'Save'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Reminder Section */}
      <h2>Reminder: Expired Domains (Remove from Hosting)</h2>
      {reminderDomains.length === 0 ? (
        <p>No expired domains pending removal.</p>
      ) : (
        <table className="expire-table reminder-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Expiry Date</th>
              <th>Reminder</th>
            </tr>
          </thead>
          <tbody>
            {reminderDomains.map((domain, idx) => {
              const issueDate = new Date(domain.issueDate);
              const expiryDate = new Date(issueDate);
              expiryDate.setFullYear(issueDate.getFullYear() + 1);

              return (
                <tr key={idx}>
                  <td>
                    {domain.domain}
                    {domain.note && ` (${domain.note})`}
                  </td>
                  <td>{expiryDate.toLocaleDateString()}</td>
                  <td>⚠️ Expired — please remove from hosting</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DomainExpire;
