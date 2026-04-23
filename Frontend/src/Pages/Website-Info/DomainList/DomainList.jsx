import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';
import './DomainList.css';
import NoteEditor from '../../../components/NoteEditor/NoteEditor';
import HostingInfoEditor from "../../../components/HostingInfoEditor/HostingInfoEditor";
import EditDomainName from '../EditDomainName/EditDomainName';
import Scrapeddatapanel from './Scrapeddatapanel';
import { handleError } from '../../../toastutils';
import { FaServer, FaTrashAlt } from "react-icons/fa";
import { FaRegMessage } from "react-icons/fa6";
import IssueDateEditor from '../IssueDateEditor/IssueDateEditor';
import { FaCalendarAlt } from "react-icons/fa";

const extractBaseDomain = (url) => {
  if (!url || typeof url !== "string") return "";
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  }
};

const getDomainExtension = (domain) => {
  const parts = domain.split('.');
  if (parts.length < 2) return '';
  const last = parts.pop();
  const secondLast = parts.pop();
  return parts.length >= 1 && last.length <= 3 ? `.${secondLast}.${last}` : `.${last}`;
};

const PAGE_SIZE = 20;

function DomainList() {
  const [domains, setDomains]           = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [hasMore, setHasMore]           = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [error, setError]               = useState("");

  const [searchTerm, setSearchTerm]     = useState("");
  const [searchInput, setSearchInput]   = useState("");
  const [activeExtension, setActiveExtension] = useState("all");
  const [extensionCounts, setExtensionCounts] = useState({});
  const [lastReloadTime, setLastReloadTime]   = useState(null);

  const [selectedDomain, setSelectedDomain]   = useState(null);
  const [scrapedDataMap, setScrapedDataMap]   = useState({});
  const [showNoteEditorMap, setShowNoteEditorMap]     = useState({});
  const [showHostingEditorMap, setShowHostingEditorMap] = useState({});
  const [hostingDetailsMap, setHostingDetailsMap]     = useState({});

  const [seoScoreMap, setSeoScoreMap]     = useState({});
  const [seoExpandedMap, setSeoExpandedMap] = useState({});
  const [seoLoadingMap, setSeoLoadingMap]   = useState({});

  const [showIssueDateEditorMap, setShowIssueDateEditorMap] = useState({});

  const visibleDomainsRef = useRef(new Set());
  const seoFetchedRef     = useRef(new Set());
  const observerRef       = useRef(null);
  const bottomRef         = useRef(null);
  const searchTimerRef    = useRef(null);

  const superCategory = localStorage.getItem("superCategory") || "natural";
  const apiBase = superCategory === "casino"
    ? "casino/scraper"
    : superCategory === "dating"
    ? "dating/scraper"
    : "api/scraper";

  const location  = useLocation();
  const navigate  = useNavigate();
  const category  = new URLSearchParams(location.search).get("category");

  const roleToken = localStorage.getItem("token");
  let role = "";
  try { role = jwtDecode(roleToken).role; } catch {}

  // ─── Fetch one page ───────────────────────────────────────────────────────
  const fetchPage = useCallback(async (pageNum, reset = false) => {
    if (reset) setInitialLoading(true);
    else setLoadingMore(true);

    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: pageNum,
        limit: PAGE_SIZE,
        ...(searchTerm && { search: searchTerm }),
        ...(category   && { category }),
        ...(activeExtension !== "all" && { extension: activeExtension }),
      });

      const url = `${import.meta.env.VITE_API_URI}/${apiBase}/all-paginated?${params}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { sites, total: t, hasMore: more } = res.data;

      setDomains(prev => reset ? sites : [...prev, ...sites]);
      setTotal(t);
      setHasMore(more);
      setPage(pageNum);
      setLastReloadTime(new Date());

      if (reset) fetchExtensionCounts();
    } catch (err) {
      console.error('Failed to fetch domains:', err);
      setError("Failed to load domains. Please try again.");
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm, category, activeExtension, apiBase]);

  // ─── Extension counts ─────────────────────────────────────────────────────
  const fetchExtensionCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(category   && { category }),
      });
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/all?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (Array.isArray(res.data)) {
        const counts = res.data.reduce((acc, d) => {
          const ext = getDomainExtension(d.domain);
          acc[ext] = (acc[ext] || 0) + 1;
          return acc;
        }, {});
        setExtensionCounts(counts);
      }
    } catch {}
  }, [searchTerm, category, apiBase]);

  useEffect(() => {
    seoFetchedRef.current = new Set();
    setSeoScoreMap({});
    fetchPage(1, true);
  }, [searchTerm, category, activeExtension]);

  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearchTerm(val), 350);
  };

  // ─── Infinite scroll ──────────────────────────────────────────────────────
  useEffect(() => {
    const sentinel = bottomRef.current;
    if (!sentinel) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !initialLoading) {
        fetchPage(page + 1, false);
      }
    }, { rootMargin: '300px' });
    io.observe(sentinel);
    return () => io.disconnect();
  }, [hasMore, loadingMore, initialLoading, page, fetchPage]);

  // ─── Lazy SEO fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .map(e => e.target.dataset.domain)
        .filter(d => d && !seoFetchedRef.current.has(d));
      if (visible.length === 0) return;
      visible.forEach(d => seoFetchedRef.current.add(d));
      fetchSeoScoresBatch(visible);
    }, { rootMargin: '100px' });
    document.querySelectorAll('[data-domain]').forEach(el => {
      observerRef.current.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, [domains]);

  const fetchSeoScoresBatch = async (domainList) => {
    const token = localStorage.getItem("token");
    const results = await Promise.allSettled(
      domainList.map(d =>
        axios.get(
          `${import.meta.env.VITE_API_URI}/${apiBase}/seo-score/${d}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      )
    );
    setSeoScoreMap(prev => {
      const updated = { ...prev };
      results.forEach((r, i) => {
        if (r.status === "fulfilled") updated[domainList[i]] = r.value.data;
      });
      return updated;
    });
  };

  // ─── Domain detail click ──────────────────────────────────────────────────
  const handleDomainClick = async (domain) => {
    const baseDomain = extractBaseDomain(domain);
    if (baseDomain === selectedDomain) { setSelectedDomain(null); return; }
    if (scrapedDataMap[baseDomain]) { setSelectedDomain(baseDomain); return; }
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/domain/${baseDomain}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setScrapedDataMap(prev => ({ ...prev, [baseDomain]: res.data }));
      setSelectedDomain(baseDomain);
    } catch (err) {
      console.error('Error fetching domain data:', err);
    }
  };

  // ─── SEO click ────────────────────────────────────────────────────────────
  const handleSeoClick = async (baseDomain) => {
    if (seoScoreMap[baseDomain]) {
      setSeoExpandedMap(prev => ({ ...prev, [baseDomain]: !prev[baseDomain] }));
      return;
    }
    setSeoLoadingMap(prev => ({ ...prev, [baseDomain]: true }));
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/seo-score/${baseDomain}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setSeoScoreMap(prev => ({ ...prev, [baseDomain]: res.data }));
      setSeoExpandedMap(prev => ({ ...prev, [baseDomain]: true }));
    } catch (err) {
      console.error("SEO score error:", err);
    } finally {
      setSeoLoadingMap(prev => ({ ...prev, [baseDomain]: false }));
    }
  };

  const handleDomainUpdate = (oldDomain, newDomain) => {
    if (!oldDomain || !newDomain) { handleError("Invalid domain values"); return; }
    const oldKey = extractBaseDomain(oldDomain);
    const newKey = extractBaseDomain(newDomain);
    setDomains(prev => prev.map(d =>
      extractBaseDomain(d.domain) === oldKey ? { ...d, domain: newDomain } : d
    ));
    [setScrapedDataMap, setShowNoteEditorMap, setShowHostingEditorMap,
     setHostingDetailsMap, setSeoScoreMap, setSeoExpandedMap].forEach(setter => {
      setter(prev => {
        const u = { ...prev };
        if (u[oldKey]) { u[newKey] = u[oldKey]; delete u[oldKey]; }
        return u;
      });
    });
    setSelectedDomain(prev => prev === oldKey ? newKey : prev);
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDeleteDomain = async (domainToDelete) => {
    if (!window.confirm(`Delete ${domainToDelete}?`)) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URI}/${apiBase}/domain/${domainToDelete}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setDomains(prev => prev.filter(d => extractBaseDomain(d.domain) !== domainToDelete));
      setTotal(prev => prev - 1);
      if (selectedDomain === domainToDelete) setSelectedDomain(null);
    } catch {
      alert("Failed to delete domain.");
    }
  };

  // ─── Skeleton ─────────────────────────────────────────────────────────────
  const SkeletonCard = () => (
    <li className="domain-card skeleton-card">
      <div className="domain-header">
        <div className="skeleton skeleton-text" style={{ width: '180px' }} />
        <div className="skeleton skeleton-badge" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="skeleton skeleton-icon" />
          <div className="skeleton skeleton-icon" />
          <div className="skeleton skeleton-icon" />
        </div>
      </div>
    </li>
  );

  return (
    <div className="domain-container">
      {lastReloadTime && (
        <p className="reload-info">
          Last Reload: {lastReloadTime.toLocaleTimeString()} · {total} domains
        </p>
      )}

      {/* ── Filter bar ── */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search domains..."
          value={searchInput}
          onChange={e => handleSearchChange(e.target.value)}
          className="search-input"
        />
        <button
          className="add-url-btn"
          onClick={() => navigate(role === "admin"
            ? `/admin/urlscan/${superCategory}`
            : `/urlscan/${superCategory}`)}
        >
          + Add URL
        </button>
      </div>

      {/* ── TLD Tabs ── */}
      <div className="dl-tabs">
        <button
          className={`dl-tab ${activeExtension === 'all' ? 'dl-tab--active' : ''}`}
          onClick={() => setActiveExtension('all')}
        >
          All
          <span className="dl-tab-badge dl-tab-badge--blue">{total}</span>
        </button>
        {Object.entries(extensionCounts)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([ext, count]) => (
            <button
              key={ext}
              className={`dl-tab ${activeExtension === ext ? 'dl-tab--active' : ''}`}
              onClick={() => setActiveExtension(ext)}
            >
              {ext}
              <span className="dl-tab-badge dl-tab-badge--blue">{count}</span>
            </button>
          ))}
      </div>

      {/* ── List ── */}
      {error ? (
        <p className="error">{error}</p>
      ) : (
        <ul className="domain-list">
          {initialLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : domains.length === 0
            ? <p>No domains found.</p>
            : domains.map((site) => {
                const baseDomain = extractBaseDomain(site.domain);
                const scraped    = scrapedDataMap[baseDomain];
                const seo        = seoScoreMap[baseDomain];

                return (
                  <li
                    key={site.domain}
                    data-domain={baseDomain}
                    className={`domain-card ${selectedDomain === baseDomain ? 'selected' : ''}`}
                  >
                    <div className="domain-header">
                      <EditDomainName
                        domain={site.domain}
                        onClick={handleDomainClick}
                        onUpdate={handleDomainUpdate}
                      />

                      <div>
                        {/* SEO Badge */}
                        <button
                          className={`seo-badge-btn ${seo ? `seo-grade-${seo.grade}` : ''}`}
                          onClick={() => handleSeoClick(baseDomain)}
                          title="SEO Score"
                        >
                          {seoLoadingMap[baseDomain]
                            ? <span className="seo-spinner" />
                            : seo
                            ? `${seo.totalScore}/100 · ${seo.grade}`
                            : <span className="seo-skeleton-pulse">—</span>
                          }
                        </button>
                        <button className="note-btn server-btn"
                          onClick={() => setShowHostingEditorMap(p => ({ ...p, [baseDomain]: !p[baseDomain] }))}>
                          <FaServer />
                        </button>
                        <button
                          className="note-btn"
                          title="Edit Issue Date"
                          onClick={() => setShowIssueDateEditorMap(p => ({ ...p, [baseDomain]: !p[baseDomain] }))}
                        >
                          <FaCalendarAlt />
                        </button>
                        <button className="note-btn"
                          onClick={() => setShowNoteEditorMap(p => ({ ...p, [baseDomain]: !p[baseDomain] }))}>
                          <FaRegMessage />
                        </button>
                        <button className="domain-delete"
                          onClick={() => handleDeleteDomain(baseDomain)}>
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>

                    {/* SEO Breakdown Panel */}
                    {seoExpandedMap[baseDomain] && seo && (
                      <div className="seo-breakdown-panel">
                        <div className="seo-panel-header">
                          <span>SEO breakdown</span>
                          <span>{seo.totalScore}/100 · Grade {seo.grade}</span>
                        </div>
                        {seo.breakdown.map((item, idx) => (
                          <div key={idx} className={`seo-row seo-row--${item.status}`}>
                            <span className="seo-row-label">{item.label}</span>
                            <span className="seo-row-detail">{item.detail}</span>
                            <div className="seo-bar-wrap">
                              <div className={`seo-bar seo-bar--${item.status}`}
                                style={{ width: `${Math.round((item.score / item.max) * 100)}%` }} />
                            </div>
                            <span className="seo-row-pts">{item.score}/{item.max}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {site.note && (
                      <div className="domain-note"><strong>Note:</strong> {site.note}</div>
                    )}

                    {showHostingEditorMap[baseDomain] && (
                      <HostingInfoEditor
                        domain={baseDomain}
                        initialData={hostingDetailsMap[baseDomain] || {}}
                        onSave={(domain, data) => {
                          setHostingDetailsMap(p => ({ ...p, [domain]: data }));
                          setShowHostingEditorMap(p => ({ ...p, [domain]: false }));
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
                            setDomains(prev => prev.map(d =>
                              extractBaseDomain(d.domain) === baseDomain
                                ? { ...d, note: newNote } : d
                            ));
                            setShowNoteEditorMap(p => ({ ...p, [baseDomain]: false }));
                          }}
                        />
                      </div>
                    )}

                    {showIssueDateEditorMap[baseDomain] && (
                      <IssueDateEditor
                        domain={baseDomain}
                        currentIssueDate={site.issueDate}
                        onSave={(newDate) => {
                          setDomains(prev =>
                            prev.map(d =>
                              extractBaseDomain(d.domain) === baseDomain
                                ? { ...d, issueDate: newDate }
                                : d
                            )
                          );
                          setShowIssueDateEditorMap(p => ({ ...p, [baseDomain]: false }));
                        }}
                      />
                    )}

                    {/* ── Scraped Data Panel ── */}
                    {selectedDomain === baseDomain && (
                      <Scrapeddatapanel domain={baseDomain} scraped={scraped} />
                    )}

                  </li>
                );
              })
          }

          {/* Infinite scroll sentinel */}
          <li ref={bottomRef} style={{ listStyle: 'none', padding: '8px 0', textAlign: 'center' }}>
            {loadingMore && (
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Loading more domains...
              </span>
            )}
            {!hasMore && domains.length > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                All {total} domains loaded
              </span>
            )}
          </li>
        </ul>
      )}
    </div>
  );
}

export default DomainList;