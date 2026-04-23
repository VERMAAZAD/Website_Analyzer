import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './DomainExpire.css';
import { handleError, handleSuccess } from '../../../toastutils';
import {
  MdWarningAmber,
  MdCheckCircle,
  MdRefresh,
  MdSelectAll,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FiClock, FiServer } from 'react-icons/fi';

function DomainExpire() {
  const [expiringDomains, setExpiringDomains] = useState([]);
  const [reminderDomains, setReminderDomains] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingDomain, setSavingDomain] = useState(null);
  const [activeTab, setActiveTab] = useState('expiring');

  const superCategory = localStorage.getItem('superCategory') || 'natural';
  const apiBase =
    superCategory === 'casino'
      ? 'casino/scraper'
      : superCategory === 'dating'
      ? 'dating/scraper'
      : 'api/scraper';

  const authHeader = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  useEffect(() => {
    fetchExpiringDomains();
  }, []);

  const fetchExpiringDomains = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/expiring`,
        { headers: authHeader }
      );
      setExpiringDomains(res.data.expiring || []);
      setReminderDomains(res.data.reminder || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Select All ---------- */
  const allSelected =
    expiringDomains.length > 0 &&
    expiringDomains.every((d) => selectedDomains.includes(d.domain));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedDomains([]);
    } else {
      setSelectedDomains(expiringDomains.map((d) => d.domain));
    }
  };

  const handleCheckboxChange = (domainName) => {
    setSelectedDomains((prev) =>
      prev.includes(domainName)
        ? prev.filter((d) => d !== domainName)
        : [...prev, domainName]
    );
  };

  /* ---------- Renew ---------- */
  const handleSaveSingle = async (domainName) => {
    try {
      setSavingDomain(domainName);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URI}/${apiBase}/renew`,
        { domains: [domainName] },
        { headers: authHeader }
      );
      handleSuccess(res.data.message || 'Renewed successfully');
      fetchExpiringDomains();
      setSelectedDomains((prev) => prev.filter((d) => d !== domainName));
    } catch (err) {
      handleError(err);
    } finally {
      setSavingDomain(null);
    }
  };

  /* ---------- Helpers ---------- */
  const getExpiryDate = (issueDate) => {
    const d = new Date(issueDate);
    d.setFullYear(d.getFullYear() + 1);
    return d;
  };

  const getDiffDays = (expiryDate) => {
    const diff = expiryDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const urgencyClass = (days) => {
    if (days <= 3) return 'urgency-critical';
    if (days <= 7) return 'urgency-warning';
    return 'urgency-ok';
  };

  /* ---------- Render ---------- */
  return (
    <div className="de-container">

      {/* ── Top bar ── */}
      <div className="de-topbar">
        <h2 className="de-page-title">Domain Management</h2>
        <button className="de-refresh-btn" onClick={fetchExpiringDomains} title="Refresh">
          <MdRefresh />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="de-tabs">
        <button
          className={`de-tab ${activeTab === 'expiring' ? 'de-tab--active' : ''}`}
          onClick={() => setActiveTab('expiring')}
        >
          <FiClock className="de-tab-icon" />
          Expiring Soon
          {!loading && expiringDomains.length > 0 && (
            <span className="de-tab-badge de-tab-badge--warn">
              {expiringDomains.length}
            </span>
          )}
        </button>

        <button
          className={`de-tab ${activeTab === 'reminder' ? 'de-tab--active de-tab--active-red' : ''}`}
          onClick={() => setActiveTab('reminder')}
        >
          <FiServer className="de-tab-icon" />
          Remove from Hosting
          {!loading && reminderDomains.length > 0 && (
            <span className="de-tab-badge de-tab-badge--red">
              {reminderDomains.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab Content ── */}
      <div className="de-tab-content">

        {/* EXPIRING TAB */}
        {activeTab === 'expiring' && (
          <>
            {loading ? (
              <div className="de-spinner-wrap">
                <AiOutlineLoading3Quarters className="de-spinner" />
                <span>Loading domains…</span>
              </div>
            ) : expiringDomains.length === 0 ? (
              <div className="de-empty">
                <MdCheckCircle className="de-empty-icon" />
                <p>No domains expiring in the next 10 days.</p>
              </div>
            ) : (
              <div className="de-table-wrap">
                <table className="de-table">
                  <thead>
                    <tr>
                      <th>
                        <label className="de-select-all" title="Select all">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={handleSelectAll}
                          />
                          <MdSelectAll className="de-select-icon" />
                        </label>
                      </th>
                      <th>Domain</th>
                      <th>Issue Date</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringDomains.map((domain, idx) => {
                      const issueDate  = new Date(domain.issueDate);
                      const expiryDate = getExpiryDate(domain.issueDate);
                      const diffDays   = getDiffDays(expiryDate);
                      const isSelected = selectedDomains.includes(domain.domain);
                      const isSaving   = savingDomain === domain.domain;

                      return (
                        <tr key={idx} className={isSelected ? 'de-row-selected' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(domain.domain)}
                            />
                          </td>
                          <td className="de-domain-cell">
                            <span className="de-domain-name">{domain.domain}</span>
                            {domain.note && (
                              <span className="de-domain-note">{domain.note}</span>
                            )}
                          </td>
                          <td>{issueDate.toLocaleDateString()}</td>
                          <td>{expiryDate.toLocaleDateString()}</td>
                          <td>
                            <span className={`de-badge ${urgencyClass(diffDays)}`}>
                              <MdWarningAmber />
                              {diffDays} day{diffDays !== 1 ? 's' : ''} left
                            </span>
                          </td>
                          <td>
                            {isSelected && (
                              <button
                                className="de-renew-btn"
                                onClick={() => handleSaveSingle(domain.domain)}
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <>
                                    <AiOutlineLoading3Quarters className="de-btn-spinner" />
                                    Renewing…
                                  </>
                                ) : (
                                  <>
                                    <MdCheckCircle />
                                    Renew
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* REMINDER TAB */}
        {activeTab === 'reminder' && (
          <>
            {loading ? (
              <div className="de-spinner-wrap">
                <AiOutlineLoading3Quarters className="de-spinner" />
                <span>Loading domains…</span>
              </div>
            ) : reminderDomains.length === 0 ? (
              <div className="de-empty">
                <MdCheckCircle className="de-empty-icon" />
                <p>No expired domains pending removal.</p>
              </div>
            ) : (
              <div className="de-table-wrap">
                <table className="de-table de-table--reminder">
                  <thead>
                    <tr>
                      <th>Domain</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminderDomains.map((domain, idx) => {
                      const expiryDate = getExpiryDate(domain.issueDate);
                      return (
                        <tr key={idx}>
                          <td className="de-domain-cell">
                            <span className="de-domain-name">{domain.domain}</span>
                            {domain.note && (
                              <span className="de-domain-note">{domain.note}</span>
                            )}
                          </td>
                          <td>{expiryDate.toLocaleDateString()}</td>
                          <td>
                            <span className="de-badge urgency-critical">
                              <MdWarningAmber />
                              Expired
                            </span>
                          </td>
                          <td>
                            <span className="de-badge urgency-critical">
                              Remove From Hosting
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DomainExpire;