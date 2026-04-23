import React, { useState } from 'react';
import './ScrapedDataPanel.css';

const ScrapedDataPanel = ({ domain, scraped }) => {
  const [activeSection, setActiveSection] = useState('overview');

  if (!scraped) return null;

  const titleLen = scraped.title?.length || 0;
  const descLen  = scraped.description?.length || 0;

  const titleStatus = titleLen === 0 ? 'missing' : titleLen > 60  ? 'warn' : 'good';
  const descStatus  = descLen  === 0 ? 'missing' : descLen  > 160 ? 'warn' : 'good';

  const statusColor = { good: '#16a34a', warn: '#d97706', missing: '#dc2626' };
  const statusBg    = { good: '#f0fdf4', warn: '#fffbeb', missing: '#fef2f2' };
  const statusBorder= { good: '#bbf7d0', warn: '#fde68a', missing: '#fecaca' };
  const statusLabel = { good: 'Good', warn: 'Too Long', missing: 'Missing' };

  const images  = scraped.images  || [];
  const altTags = scraped.altTags || [];
  const missingAlt = images.filter((_, i) => !altTags[i] || altTags[i].trim() === '').length;
  const altCoverage = images.length > 0 ? Math.round(((images.length - missingAlt) / images.length) * 100) : 0;

  const sections = [
    { id: 'overview',  label: 'Title & Desc',  icon: '◈' },
    { id: 'headings',  label: 'Headings',  icon: '❡', count: (scraped.h1?.length || 0) + (scraped.h2?.length || 0) },
    { id: 'images',    label: 'Images',    icon: '⊞', count: images.length },
    { id: 'technical', label: 'Technical', icon: '⚙' },
    { id: 'links',     label: 'Canonical',     icon: '⌁', count: scraped.canonicals?.length || 0 },
  ];

  const resolveUrl = (src) => {
    if (!src) return '';
    if (src.startsWith('http')) return src;
    return `https://${domain}${src.startsWith('/') ? '' : '/'}${src}`;
  };

  return (
    <div className="sdp-root">

      {/* ── Header ── */}
      <div className="sdp-header">
        <div className="sdp-header-left">
          <div className="sdp-domain-dot" />
          <span className="sdp-domain-label">{domain}</span>
        </div>
        {scraped.lastChecked && (
          <span className="sdp-last-checked">
            Checked {new Date(scraped.lastChecked).toLocaleString()}
          </span>
        )}
      </div>

      {/* ── Stats bar ── */}
      <div className="sdp-stats-bar">
        <div className="sdp-stat">
          <span className="sdp-stat-num">{scraped.wordCount || '—'}</span>
          <span className="sdp-stat-lbl">Words</span>
        </div>
        <div className="sdp-stat-divider" />
        <div className="sdp-stat">
          <span className="sdp-stat-num">{scraped.h1?.length || 0}</span>
          <span className="sdp-stat-lbl">H1 Tags</span>
        </div>
        <div className="sdp-stat-divider" />
        <div className="sdp-stat">
          <span className="sdp-stat-num">{scraped.h2?.length || 0}</span>
          <span className="sdp-stat-lbl">H2 Tags</span>
        </div>
        <div className="sdp-stat-divider" />
        <div className="sdp-stat">
          <span className="sdp-stat-num">{images.length}</span>
          <span className="sdp-stat-lbl">Images</span>
        </div>
        <div className="sdp-stat-divider" />
        <div className="sdp-stat">
          <span className="sdp-stat-num">{scraped.canonicals?.length || 0}</span>
          <span className="sdp-stat-lbl">Canonicals</span>
        </div>
        <div className="sdp-stat-divider" />
        <div className="sdp-stat">
          <span className={`sdp-stat-num sdp-schema-${scraped.schemaPresent ? 'yes' : 'no'}`}>
            {scraped.schemaPresent ? '✓' : '✗'}
          </span>
          <span className="sdp-stat-lbl">Schema</span>
        </div>
      </div>

      {/* ── Nav tabs ── */}
      <div className="sdp-nav">
        {sections.map(s => (
          <button
            key={s.id}
            className={`sdp-nav-btn ${activeSection === s.id ? 'sdp-nav-btn--active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            <span className="sdp-nav-icon">{s.icon}</span>
            {s.label}
            {s.count > 0 && <span className="sdp-nav-count">{s.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="sdp-content">

        {/* OVERVIEW */}
        {activeSection === 'overview' && (
          <div className="sdp-panel">
            <div className="sdp-meta-card" style={{ background: statusBg[titleStatus], borderColor: statusBorder[titleStatus] }}>
              <div className="sdp-meta-card-header">
                <span className="sdp-meta-card-title">Page Title</span>
                <div className="sdp-meta-badges">
                  <span className="sdp-char-count">{titleLen} / 60 chars</span>
                  <span className="sdp-status-pill" style={{ color: statusColor[titleStatus], background: statusBg[titleStatus], border: `1px solid ${statusBorder[titleStatus]}` }}>
                    {statusLabel[titleStatus]}
                  </span>
                </div>
              </div>
              <div className="sdp-meta-bar-wrap">
                <div className="sdp-meta-bar" style={{ width: `${Math.min((titleLen / 60) * 100, 100)}%`, background: statusColor[titleStatus] }} />
              </div>
              <p className="sdp-meta-text">{scraped.title || <span className="sdp-empty">No title found</span>}</p>
            </div>

            <div className="sdp-meta-card" style={{ background: statusBg[descStatus], borderColor: statusBorder[descStatus] }}>
              <div className="sdp-meta-card-header">
                <span className="sdp-meta-card-title">Meta Description</span>
                <div className="sdp-meta-badges">
                  <span className="sdp-char-count">{descLen} / 160 chars</span>
                  <span className="sdp-status-pill" style={{ color: statusColor[descStatus], background: statusBg[descStatus], border: `1px solid ${statusBorder[descStatus]}` }}>
                    {statusLabel[descStatus]}
                  </span>
                </div>
              </div>
              <div className="sdp-meta-bar-wrap">
                <div className="sdp-meta-bar" style={{ width: `${Math.min((descLen / 160) * 100, 100)}%`, background: statusColor[descStatus] }} />
              </div>
              <p className="sdp-meta-text">{scraped.description || <span className="sdp-empty">No description found</span>}</p>
            </div>

            {scraped.affiliateLink && (
              <div className="sdp-info-row">
                <span className="sdp-info-label">Affiliate Link</span>
                <a href={scraped.affiliateLink} target="_blank" rel="noopener noreferrer" className="sdp-link">
                  {scraped.affiliateLink}
                </a>
              </div>
            )}
          </div>
        )}

        {/* HEADINGS */}
        {activeSection === 'headings' && (
          <div className="sdp-panel">
            {scraped.h1?.length > 0 ? (
              <div className="sdp-heading-group">
                <div className="sdp-heading-group-label">
                  <span className="sdp-heading-badge sdp-heading-badge--h1">H1</span>
                  <span className="sdp-heading-count">{scraped.h1.length} tag{scraped.h1.length !== 1 ? 's' : ''}</span>
                  {scraped.h1.length > 1 && <span className="sdp-heading-warn">⚠ Multiple H1s</span>}
                </div>
                {scraped.h1.map((tag, i) => (
                  <div key={i} className="sdp-heading-item sdp-heading-item--h1">
                    <span className="sdp-heading-index">{i + 1}</span>
                    <span className="sdp-heading-text">{tag}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="sdp-empty-section">
                <span className="sdp-empty-icon">⚠</span>
                <span>No H1 tags found — this is an SEO issue</span>
              </div>
            )}
            {scraped.h2?.length > 0 && (
              <div className="sdp-heading-group" style={{ marginTop: '16px' }}>
                <div className="sdp-heading-group-label">
                  <span className="sdp-heading-badge sdp-heading-badge--h2">H2</span>
                  <span className="sdp-heading-count">{scraped.h2.length} tag{scraped.h2.length !== 1 ? 's' : ''}</span>
                </div>
                {scraped.h2.map((tag, i) => (
                  <div key={i} className="sdp-heading-item sdp-heading-item--h2">
                    <span className="sdp-heading-index">{i + 1}</span>
                    <span className="sdp-heading-text">{tag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* IMAGES */}
        {activeSection === 'images' && (
          <div className="sdp-panel">
            {images.length === 0 ? (
              <div className="sdp-empty-section">
                <span className="sdp-empty-icon">⊞</span>
                <span>No images found on this page</span>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="sdp-img-summary">
                  <div className="sdp-img-stat">
                    <span className="sdp-img-stat-num">{images.length}</span>
                    <span className="sdp-img-stat-lbl">Total</span>
                  </div>
                  <div className="sdp-img-stat sdp-img-stat--pass">
                    <span className="sdp-img-stat-num">{images.length - missingAlt}</span>
                    <span className="sdp-img-stat-lbl">Has Alt</span>
                  </div>
                  <div className={`sdp-img-stat ${missingAlt > 0 ? 'sdp-img-stat--fail' : 'sdp-img-stat--pass'}`}>
                    <span className="sdp-img-stat-num">{missingAlt}</span>
                    <span className="sdp-img-stat-lbl">Missing Alt</span>
                  </div>
                  <div className="sdp-img-coverage">
                    <div className="sdp-img-coverage-header">
                      <span>Alt text coverage</span>
                      <span className="sdp-img-coverage-pct">{altCoverage}%</span>
                    </div>
                    <div className="sdp-img-progress-track">
                      <div
                        className="sdp-img-progress-bar"
                        style={{
                          width: `${altCoverage}%`,
                          background: missingAlt === 0 ? '#16a34a' : missingAlt > images.length / 2 ? '#dc2626' : '#d97706'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Image rows */}
                <div className="sdp-img-list">
                  {images.map((imgSrc, i) => {
                    const alt    = altTags[i] || '';
                    const hasAlt = alt.trim() !== '';
                    const fname  = imgSrc.split('/').pop()?.split('?')[0] || imgSrc;
                    const ext    = fname.split('.').pop()?.toUpperCase().slice(0, 4) || 'IMG';

                    return (
                      <div key={i} className={`sdp-img-row ${hasAlt ? 'sdp-img-row--ok' : 'sdp-img-row--missing'}`}>

                        {/* Thumbnail */}
                        <div className="sdp-img-thumb">
                          <img
                            src={resolveUrl(imgSrc)}
                            alt={alt || 'preview'}
                            className="sdp-img-thumb-img"
                            loading="lazy"
                            onError={e => {
                              e.target.style.display = 'none';
                              e.target.parentNode.querySelector('.sdp-img-fallback').style.display = 'flex';
                            }}
                          />
                          <div className="sdp-img-fallback">
                            <span>{ext}</span>
                          </div>
                        </div>

                        {/* Info block */}
                        <div className="sdp-img-info">
                          <div className="sdp-img-filename" title={imgSrc}>{fname}</div>
                          <a
                            href={resolveUrl(imgSrc)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sdp-img-url"
                          >
                            {imgSrc}
                          </a>

                          <div className="sdp-img-alt-row">
                            <span className={`sdp-img-alt-badge ${hasAlt ? 'sdp-img-alt-badge--ok' : 'sdp-img-alt-badge--missing'}`}>
                              {hasAlt ? '✓ Alt' : '✗ No Alt'}
                            </span>
                            {hasAlt
                              ? <span className="sdp-img-alt-value">"{alt}"</span>
                              : <span className="sdp-img-alt-warn">Missing alt — affects SEO &amp; accessibility</span>
                            }
                          </div>
                        </div>

                        {/* Index pill */}
                        <span className="sdp-img-idx">#{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* TECHNICAL */}
        {activeSection === 'technical' && (
          <div className="sdp-panel">
            <div className="sdp-tech-grid">
              <div className={`sdp-tech-card ${scraped.schemaPresent ? 'sdp-tech-card--pass' : 'sdp-tech-card--fail'}`}>
                <span className="sdp-tech-icon">{scraped.schemaPresent ? '✓' : '✗'}</span>
                <span className="sdp-tech-name">Schema.org</span>
                <span className="sdp-tech-val">{scraped.schemaPresent ? 'Present' : 'Missing'}</span>
              </div>
              <div className={`sdp-tech-card ${scraped.robotsTxt ? 'sdp-tech-card--pass' : 'sdp-tech-card--neutral'}`}>
                <span className="sdp-tech-icon">🤖</span>
                <span className="sdp-tech-name">Robots.txt</span>
                <span className="sdp-tech-val">{scraped.robotsTxt || 'Not found'}</span>
              </div>
              <div className="sdp-tech-card sdp-tech-card--neutral">
                <span className="sdp-tech-icon">📝</span>
                <span className="sdp-tech-name">Word Count</span>
                <span className="sdp-tech-val">{scraped.wordCount || '—'}</span>
              </div>
            </div>
            {scraped.robotsTxt && scraped.robotsTxt.length > 20 && (
              <div className="sdp-robots-block">
                <span className="sdp-robots-label">Robots.txt Content</span>
                <pre className="sdp-robots-pre">{scraped.robotsTxt}</pre>
              </div>
            )}
          </div>
        )}

        {/* LINKS */}
        {activeSection === 'links' && (
          <div className="sdp-panel">
            {scraped.canonicals?.length > 0 ? (
              <>
                <div className="sdp-links-header">
                  <span className="sdp-links-title">Canonical Links</span>
                  <span className="sdp-links-badge">{scraped.canonicals.length}</span>
                </div>
                {scraped.canonicals.map((link, i) => (
                  <div key={i} className="sdp-link-row">
                    <span className="sdp-link-num">{i + 1}</span>
                    <a href={link} target="_blank" rel="noopener noreferrer" className="sdp-link sdp-link--canonical">
                      {link}
                    </a>
                  </div>
                ))}
              </>
            ) : (
              <div className="sdp-empty-section">
                <span className="sdp-empty-icon">⌁</span>
                <span>No canonical links found</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ScrapedDataPanel;