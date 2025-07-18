import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UrlScan.css';
import Layout from '../../../components/Layouts/Layout';
import { handleError, handleSuccess } from '../../../utils';
import { ToastContainer } from 'react-toastify';

function UrlScan() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [categories, setCategories] = useState([]); // ✅ fetched from backend

  // ✅ Fetch brand categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URI}/api/scraper/categories`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        setCategories(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch categories", err);
      }
    };

    fetchCategories();
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();

    if (!domain.trim()) {
      handleError("❌ Please enter a domain.");
      return;
    }

    setLoading(true);
    setSaved(false);
    setResult(null);

    try {
      const response = await axios.post(`http://localhost:5000/api/scraper/scan`, {
        domain: domain.trim(),
      });
      setResult(response.data);
    } catch (error) {
      setResult(error.response?.data || { error: 'Something went wrong while scraping.' });

    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const brandCategory = useCustom ? customCategory.trim() : category;

    if (!brandCategory) {
      handleError("❌ Please select or enter a brand category.");
      return;
    }

    if (!result) {
      handleError("❌ No scan result to save.");
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URI}/api/scraper/save`, {
        domain: domain.trim(),
        data: result,
        brandCategory,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      setSaved(true);
      handleSuccess("✅ Saved to database!");
    } catch (err) {
      if (err.response?.data?.error?.includes("E11000")) {
        handleError("❌ Domain already exists in your saved list.");
      } else {
        handleError("Domain already exists in server");
      }
    }
  };

  return (
    <Layout>
      <div className="urlscan-container">
        <h2>Scan Website</h2>
        <form onSubmit={handleScan}>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter Domain e.g. https://example.com"
            required
          />

          <select
            value={category}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '__custom__') {
                setUseCustom(true);
                setCategory('');
              } else {
                setUseCustom(false);
                setCategory(val);
              }
            }}
            required={!useCustom}
          >
            <option value="">Select Brand Category</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
            <option value="__custom__">Add custom category...</option>
          </select>

          {useCustom && (
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Enter custom brand category"
              required
            />
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </form>

        {result && (
          <>
            <pre className="result-json">{JSON.stringify(result, null, 2)}</pre>
            <button onClick={handleSave} disabled={saved}>
              {saved ? 'Saved' : 'Save'}
            </button>
          </>
        )}

        <ToastContainer />
      </div>
    </Layout>
  );
}

export default UrlScan;
