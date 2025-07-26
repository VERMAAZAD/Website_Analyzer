import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {jwtDecode} from "jwt-decode";
import axios from 'axios';
import './DomainList.css';
import NoteEditor from '../../../components/NoteEditor/NoteEditor';

const extractBaseDomain = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }
};

function DomainList() {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [scrapedDataMap, setScrapedDataMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastReloadTime, setLastReloadTime] = useState(null);
  const [showNoteEditorMap, setShowNoteEditorMap] = useState({});

  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get("category");

  // ✅ Fetch domains
  const fetchDomains = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const url = category
        ? `${import.meta.env.VITE_API_URI}/api/scraper/by-category/${encodeURIComponent(category)}`
        : `${import.meta.env.VITE_API_URI}/api/scraper/all`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Array.isArray(res.data)) {
        setDomains(res.data);
        setLastReloadTime(new Date());
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      console.error('Failed to fetch domains:', err);
      setError("Failed to load domains. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // ✅ Handle domain expand/collapse and fetch details
  const handleDomainClick = async (domain) => {
    const baseDomain = extractBaseDomain(domain);

    if (baseDomain === selectedDomain) {
      setSelectedDomain(null);
      return;
    }

    if (scrapedDataMap[baseDomain]) {
      setSelectedDomain(baseDomain);
      return;
    }

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URI}/api/scraper/domain/${baseDomain}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      setScrapedDataMap(prev => ({ ...prev, [baseDomain]: res.data }));
      setSelectedDomain(baseDomain);
    } catch (err) {
      console.error('Error fetching domain data:', err);
    }
  };

  const handleDeleteDomain = async (domainToDelete) => {
    const confirm = window.confirm(`Are you sure you want to delete ${domainToDelete}?`);
    if (!confirm) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_API_URI}/api/scraper/domain/${domainToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDomains(prev => prev.filter(d => extractBaseDomain(d.domain) !== domainToDelete));
      setScrapedDataMap(prev => {
        const updated = { ...prev };
        delete updated[domainToDelete];
        return updated;
      });

      if (selectedDomain === domainToDelete) {
        setSelectedDomain(null);
      }

    } catch (err) {
      console.error("Error deleting domain:", err);
      alert("Failed to delete domain. Try again.");
    }
  };

  useEffect(() => {
    fetchDomains();
  }, [category]);

  const filteredDomains = domains.filter(site =>
    site.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rollRoken = localStorage.getItem("token");
let role = "";
if (rollRoken) {
  try {
    const decoded = jwtDecode(rollRoken);
    role = decoded.role; // adjust if your token structure is different
  } catch (err) {
    console.error("Invalid token", err);
  }
}

  return (
      <div className="domain-container">
        <div className="top-bar">
          <h2>{category ? `Domains in "${category}"` : 'Saved Scraped Domains'}</h2>
            <div className="button-group">
           <button
                className="add-url-btn"
                onClick={() => {
                  if (role === "admin") {
                    navigate('/admin/urlscan');
                  } else {
                    navigate('/urlscan');
                  }
                }}
              >
                + Add URL
              </button>
          </div>

        </div>

        {lastReloadTime && (
          <p className="reload-info">
            Last Reload: {lastReloadTime.toLocaleTimeString()}
          </p>
        )}

        <input
          type="text"
          placeholder="Search domains..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        {loading ? (
          <p>Loading domains...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : filteredDomains.length === 0 ? (
          <p>No domains found.</p>
        ) : (
          <ul className="domain-list">
            {filteredDomains.map((site) => {
              const baseDomain = extractBaseDomain(site.domain);
              const scraped = scrapedDataMap[baseDomain];

              return (
                <li key={site.domain} className="domain-card">
                  <div className="domain-header">
                    <span className="domain-text" onClick={() => handleDomainClick(site.domain)}>
                      {site.domain}
                    </span>

<div>

                    <button
                        className="note-btn"
                        onClick={() => setShowNoteEditorMap(prev => ({
                          ...prev,
                          [baseDomain]: !prev[baseDomain],
                        }))}
                        title="Add/Edit Note"
                      >
                        📝
                    </button>

                    <button
                      className="domain-delete"
                      onClick={() => handleDeleteDomain(baseDomain)}
                      title="Delete domain"
                    >
                      ❌
                    </button>
               </div>
                  </div>
                  {site.note && (
                    <div className="domain-note">
                      <strong>Note:</strong> {site.note}
                    </div>
                  )}

                        
                    {showNoteEditorMap[baseDomain] && (
                      <div className="">
                        <h4>Note:</h4>
                        <NoteEditor
                            domain={baseDomain}
                            currentNote={site.note}
                            onSave={(newNote) => {
                              setDomains(prev =>
                                prev.map(d =>
                                  extractBaseDomain(d.domain) === baseDomain ? { ...d, note: newNote } : d
                                )
                              );
                               setShowNoteEditorMap(prev => ({
                                  ...prev,
                                  [baseDomain]: false, 
                                }));
                            }}
                          />
                      </div>
                    )}



                  {selectedDomain === baseDomain && scraped && (
                    <div className="scraped-inline">
                      {scraped.title && (<><h4>Title:</h4><p style={{ color: scraped.title.length > 60 ? 'red' : 'inherit' }}>
                        {scraped.title} ({scraped.title.length} Char)
                      </p>
                  </>)}
                    {scraped.description && (<><h4>Description:</h4><p style={{ color: scraped.description.length > 160 ? 'red' : 'inherit' }}>
                        {scraped.description} ({scraped.description.length} Char)
                         </p></>)}
                      {scraped.h1?.length > 0 && (
                        <>
                          <h4>H1 Tags:</h4>
                          <ul>{scraped.h1.map((tag, idx) => <li key={idx}>{tag}</li>)}</ul>
                        </>
                      )}
                      {scraped.h2?.length > 0 && (
                        <>
                          <h4>H2 Tags:</h4>
                          <ul>{scraped.h2.map((tag, idx) => <li key={idx}>{tag}</li>)}</ul>
                        </>
                      )}
                      {scraped.canonicals?.length > 0 && (
                        <>
                          <h4>Canonical Links:</h4>
                          <ul>
                            {scraped.canonicals.map((link, idx) => (
                              <li key={idx}>
                                <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {scraped.affiliateLink && (<><h4>Affiliate Link:</h4><p>{scraped.affiliateLink}</p></>)}
                      {scraped.issueDate && (<><h4>Domain Issue Date:</h4><p>{new Date(scraped.issueDate).toLocaleString()}</p></>)}
                      {scraped.images?.length > 0 && (
                        <>
                          <h4>Images:</h4>
                          <ul className="image-grid">
                            {scraped.images.map((src, idx) => {

                              let imgSrcRaw = src.startsWith('http') ? src : `https://${scraped.domain}${src}`;

                              let imgSrc = imgSrcRaw
                                      .replace(/(\.[a-z]{2,})(?=assets\/)/, '$1/')
                                        .replace(/(\.[a-z]{2,})\.\//, '$1/');
                              const alt = scraped.altTags?.[idx] || 'No alt text';
                              return (
                                <li key={idx} className="image-item">
                                  <p><strong>URL:</strong> <a href={imgSrc} target="_blank" rel="noopener noreferrer">{imgSrc}</a></p>
                                  <p><strong>Alt:</strong> {alt}</p>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                      {scraped.robotsTxt && (<><h4>Robots:</h4><p>{scraped.robotsTxt}</p></>)}
                      {scraped.wordCount && (<><h4>Word Count:</h4><p>{scraped.wordCount}</p></>)}
                      <h4>Schema.org Present:</h4>
                      <p>{scraped.schemaPresent ? '✅ Yes' : '❌ No'}</p>
                      {scraped.lastChecked && (<><h4>Last Checked:</h4><p>{new Date(scraped.lastChecked).toLocaleString()}</p></>)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
  );
}

export default DomainList;
