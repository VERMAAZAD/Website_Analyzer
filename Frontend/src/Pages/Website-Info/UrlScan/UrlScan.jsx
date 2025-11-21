import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UrlScan.css';
import Layout from '../../../components/Layouts/Layout';
import { handleError, handleSuccess } from '../../../toastutils';

function UrlScan() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [categories, setCategories] = useState([]);
  const [affiliateLink, setAffiliateLink] = useState(null);
  const [issueDate, setIssueDate] = useState('');

  const superCategory = localStorage.getItem("superCategory") || "natural";
  const apiBase =
    superCategory === "casino"
      ? "casino/scraper"
      : superCategory === "dating"
      ? "dating/scraper"
      : "api/scraper";

  // Fetch categories
  useEffect(() => {
    const fetchCat = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URI}/${apiBase}/categories`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        setCategories(res.data);
      } catch (err) {
        handleError("Failed to fetch categories");
      }
    };
    fetchCat();
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!domain.trim()) return handleError("Enter a domain");

    setLoading(true);
    setResult(null);
    setSaved(false);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URI}/${apiBase}/scan`,
        { domain }
      );
      setResult(response.data);

      if (response.data.affiliateLink)
        setAffiliateLink(response.data.affiliateLink);

    } catch (error) {
      setResult(error.response?.data || { error: "Scraping error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const brandCategory = useCustom ? customCategory.trim() : category;

    if (!brandCategory) return handleError("Choose or write a category");

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URI}/${apiBase}/save`,
        {
          domain,
          data: result,
          brandCategory,
          issueDate: issueDate || null,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setSaved(true);
      handleSuccess("Saved!");

    } catch (err) {
      handleError("Domain already exists");
    }
  };

  return (

      <div className="urlscan-wrapper">

        {/* LEFT - FORM */}
        <div className="scan-form-card">
          <h2>Scan Website</h2>

          <form onSubmit={handleScan}>

            <div className="form-group">
              <label>Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="form-group">
              <label>Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Brand Category</label>
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setUseCustom(true);
                    setCategory('');
                  } else {
                    setUseCustom(false);
                    setCategory(e.target.value);
                  }
                }}
              >
                <option value="">Select category</option>
                <option value="__custom__">Add Custom</option>
                {categories.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
                
              </select>
            </div>

            {useCustom && (
              <div className="form-group">
                <label>Custom Category</label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category"
                />
              </div>
            )}

            <button type="submit" className="scan-btn">
              {loading ? "Scanning..." : "Scan Domain"}
            </button>
          </form>
        </div>

        {/* RIGHT - RESULT */}
        <div className="result-card">
          <h3>Scraped Data</h3>

          {!result && (
            <p className="placeholder-text">⏳ Scan a website to see results...</p>
          )}

          {result && (
            <div className="json-container">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
           {result && (
            <button onClick={handleSave} className="save-btn" disabled={saved}>
              {saved ? "Saved" : "Save Result"}
            </button>
          )}
        </div>

      </div>
  );
}

export default UrlScan;
