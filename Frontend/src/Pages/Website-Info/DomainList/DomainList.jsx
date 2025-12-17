import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {jwtDecode} from "jwt-decode";
import axios from 'axios';
import './DomainList.css';
import NoteEditor from '../../../components/NoteEditor/NoteEditor';
import HostingInfoEditor from "../../../components/HostingInfoEditor/HostingInfoEditor";
import EditDomainName from '../EditDomainName/EditDomainName';
import { handleError } from '../../../toastutils';


const extractBaseDomain = (url) => {
  if (!url || typeof url !== "string") return "";

  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }
};


const getDomainExtension = (domain) => {
  const parts = domain.split('.');
  if (parts.length < 2) return '';
  const last = parts.pop();
  const secondLast = parts.pop();
  return parts.length >= 1 && last.length <= 3 ? `.${secondLast}.${last}` : `.${last}`;
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
  const [activeExtension, setActiveExtension] = useState("all");
  const [showHostingEditorMap, setShowHostingEditorMap] = useState({});
  const [hostingDetailsMap, setHostingDetailsMap] = useState({});

  const superCategory = localStorage.getItem("superCategory") || "natural"; 
  const apiBase = superCategory === "casino"
    ? "casino/scraper"
    : superCategory === "dating"
    ? "dating/scraper"
    : "api/scraper";

  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get("category");

  const fetchDomains = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const url = category
        ? `${import.meta.env.VITE_API_URI}/${apiBase}/by-category/${encodeURIComponent(category)}`
        : `${import.meta.env.VITE_API_URI}/${apiBase}/all`;

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

  const handleDomainClick = async (domain) => {
    const baseDomain = extractBaseDomain(domain);
    const extension = getDomainExtension(domain);
    setActiveExtension(extension);

    if (baseDomain === selectedDomain) {
      setSelectedDomain(null);
      return;
    }

    if (scrapedDataMap[baseDomain]) {
      setSelectedDomain(baseDomain);
      return;
    }

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URI}/${apiBase}/domain/${baseDomain}`, {
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


  const handleDomainUpdate = (oldDomain, newDomain) => {
    if (!oldDomain || !newDomain) {
    handleError("Invalid domain values", oldDomain, newDomain);
    return;
  }
  setDomains((prev) =>
    prev.map((d) =>
      extractBaseDomain(d.domain) === extractBaseDomain(oldDomain)
        ? { ...d, domain: newDomain }
        : d
    )
  );

  setScrapedDataMap((prev) => {
    const oldKey = extractBaseDomain(oldDomain);
    const newKey = extractBaseDomain(newDomain);

    const updated = { ...prev };
    if (updated[oldKey]) {
      updated[newKey] = updated[oldKey];
      delete updated[oldKey];
    }
    return updated;
  });

  setShowNoteEditorMap((prev) => {
    const updated = { ...prev };
    const oldKey = extractBaseDomain(oldDomain);
    const newKey = extractBaseDomain(newDomain);
    if (updated[oldKey]) {
      updated[newKey] = updated[oldKey];
      delete updated[oldKey];
    }
    return updated;
  });

  setShowHostingEditorMap((prev) => {
    const updated = { ...prev };
    const oldKey = extractBaseDomain(oldDomain);
    const newKey = extractBaseDomain(newDomain);
    if (updated[oldKey]) {
      updated[newKey] = updated[oldKey];
      delete updated[oldKey];
    }
    return updated;
  });

  setHostingDetailsMap((prev) => {
    const updated = { ...prev };
    const oldKey = extractBaseDomain(oldDomain);
    const newKey = extractBaseDomain(newDomain);
    if (updated[oldKey]) {
      updated[newKey] = updated[oldKey];
      delete updated[oldKey];
    }
    return updated;
  });

  setSelectedDomain((prev) =>
    extractBaseDomain(prev) === extractBaseDomain(oldDomain)
      ? extractBaseDomain(newDomain)
      : prev
  );
};




  const handleDeleteDomain = async (domainToDelete) => {
    if (!window.confirm(`Are you sure you want to delete ${domainToDelete}?`)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_API_URI}/${apiBase}/domain/${domainToDelete}`, {
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

  const domainExtensions = Array.from(new Set(domains.map(d => getDomainExtension(d.domain)))).sort();
  const domainExtensionCounts = domains.reduce((acc, d) => {
    const ext = getDomainExtension(d.domain);
    acc[ext] = (acc[ext] || 0) + 1;
    return acc;
  }, {});
  const filteredDomains = domains.filter(site => {
    const matchesSearch = site.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const extension = getDomainExtension(site.domain);
    const matchesExtension = activeExtension === "all" || extension === activeExtension;
    return matchesSearch && matchesExtension;
  });

  const roleToken = localStorage.getItem("token");
  let role = "";
  if (roleToken) {
    try {
      const decoded = jwtDecode(roleToken);
      role = decoded.role;
    } catch (err) {
      console.error("Invalid token", err);
    }
  }

  return (
    <div className="domain-container">
     

      {lastReloadTime && (
        <p className="reload-info">Last Reload: {lastReloadTime.toLocaleTimeString()}</p>
      )}

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search domains..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button
            className="add-url-btn"
            onClick={() => navigate(role === "admin" ? `/admin/urlscan/${superCategory}` : `/urlscan/${superCategory}`)}
          >
            + Add URL
          </button>
      </div>

      <div className="tld-filter-bar">
  {Object.entries(domainExtensionCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ext, count]) => (
      <button
        key={ext}
        className={`tld-btn ${activeExtension === ext ? 'active' : ''}`}
        onClick={() => setActiveExtension(ext)}
      >
        {ext} ({count})
      </button>
    ))}
  {activeExtension !== "all" && (
    <button className="tld-btn clear" onClick={() => setActiveExtension("all")}>
      Show All TLDs
    </button>
  )}
</div>


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
              <li key={site.domain} className={`domain-card ${selectedDomain === baseDomain ? 'selected' : ''}`}>
                <div className="domain-header">
                  <EditDomainName
                  domain={site.domain}
                  onClick={handleDomainClick}
                  onUpdate={handleDomainUpdate}
                />

                  <div>
                    <button
                      className="note-btn"
                      onClick={() =>
                        setShowHostingEditorMap((prev) => ({
                          ...prev,
                          [baseDomain]: !prev[baseDomain],
                        }))
                      }
                    >
                      🖥️
                    </button>
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
                  <div className="domain-note"><strong>Note:</strong> {site.note}</div>
                )}
                
                {showHostingEditorMap[baseDomain] && (
              <HostingInfoEditor
                domain={baseDomain}
                initialData={hostingDetailsMap[baseDomain] || {}}
                onSave={(domain, data) => {
                  setHostingDetailsMap((prev) => ({
                    ...prev,
                    [domain]: data,
                  }));
                  alert(`Saved hosting info for ${domain}`);
                  setShowHostingEditorMap((prev) => ({
                    ...prev,
                    [domain]: false,
                  }));
                }}
              />
            )}
                {showNoteEditorMap[baseDomain] && (
                  <div>
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
                    {scraped.title && (<><h4>Title:</h4><p style={{ color: scraped.title.length > 60 ? 'red' : 'inherit' }}>{scraped.title} ({scraped.title.length} Char)</p></>)}
                    {scraped.description && (<><h4>Description:</h4><p style={{ color: scraped.description.length > 160 ? 'red' : 'inherit' }}>{scraped.description} ({scraped.description.length} Char)</p></>)}
                    {scraped.h1?.length > 0 && (<><h4>H1 Tags:</h4><ul>{scraped.h1.map((tag, idx) => <li key={idx}>{tag}</li>)}</ul></>)}
                    {scraped.h2?.length > 0 && (<><h4>H2 Tags:</h4><ul>{scraped.h2.map((tag, idx) => <li key={idx}>{tag}</li>)}</ul></>)}
                    {scraped.canonicals?.length > 0 && (<><h4>Canonical Links:</h4><ul>{scraped.canonicals.map((link, idx) => <li key={idx}><a href={link} target="_blank" rel="noopener noreferrer">{link}</a></li>)}</ul></>)}
                    {scraped.affiliateLink && (<><h4>Affiliate Link:</h4><p>{scraped.affiliateLink}</p></>)}
                    {scraped.issueDate && (<><h4>Domain Issue Date:</h4><p>{new Date(scraped.issueDate).toLocaleString()}</p></>)}
                    {scraped.images?.length > 0 && (<><h4>Images:</h4><ul className="image-grid">{scraped.images.map((src, idx) => {
                      const imgSrcRaw = src.startsWith('http') ? src : `https://${scraped.domain}${src}`;
                      const imgSrc = imgSrcRaw.replace(/(\.[a-z]{2,})(?=assets\/)/, '$1/').replace(/(\.[a-z]{2,})\.\//, '$1/');
                      const alt = scraped.altTags?.[idx] || 'No alt text';
                      return (<li key={idx} className="image-item"><p><strong>URL:</strong> <a href={imgSrc} target="_blank" rel="noopener noreferrer">{imgSrc}</a></p><p><strong>Alt:</strong> {alt}</p></li>);
                    })}</ul></>)}
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