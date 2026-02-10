import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../../components/Layouts/Layout";
import "./Home.css";
import { handleError, handleSuccess } from "../../toastutils";

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastReloadTime, setLastReloadTime] = useState(null);
  const [affiliateStatus, setAffiliateStatus] = useState({});

  const [primaryAffiliateLink, setPrimaryAffiliateLink] = useState("");
  const [secondaryAffiliateLink, setSecondaryAffiliateLink] = useState("");


  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const [mismatchCounts, setMismatchCounts] = useState({});


  const token = localStorage.getItem("token");

 const superCategory = localStorage.getItem("superCategory") || "natural";

const user = JSON.parse(localStorage.getItem("loggedInUser")) || {};

const canManageAffiliate =
  user?.role === "admin" ||
  user?.role === "user" ||
  user?.affiliateAccess === true;

const apiBase =
  superCategory === "casino"
    ? "casino/scraper"
    : superCategory === "dating"
    ? "dating/scraper"
    : "api/scraper"; 


  const fetchCategoriesAndCounts = async () => {
    setLoading(true);
    try {
      const [categoriesRes, countsRes, mismatchRes, affiliateStatusRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URI}/${apiBase}/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        
        axios.get(`${import.meta.env.VITE_API_URI}/${apiBase}/category-counts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),

        axios.get(`${import.meta.env.VITE_API_URI}/${apiBase}/affiliate-mismatch-counts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),

        axios.get(`${import.meta.env.VITE_API_URI}/${apiBase}/category-affiliate-status`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      ]);

      setCategories(categoriesRes.data);
      setCounts(countsRes.data);
      setMismatchCounts(mismatchRes.data);
      setAffiliateStatus(affiliateStatusRes.data);

      setLastReloadTime(new Date());
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndCounts();
  }, [superCategory]);

  const handleClick = (category) => {
    navigate(`/domains?category=${encodeURIComponent(category)}`);
  };

  // Filter categories by search input
  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const openAffiliateModal = async (category) => {
  setSelectedCategory(category);
  setShowModal(true);
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URI}/${apiBase}/category-affiliate/${encodeURIComponent(category)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.data) {
      setPrimaryAffiliateLink(res.data.primaryLink.url || "");
      setSecondaryAffiliateLink(res.data.secondaryLink.url || "");
    }
  } catch (err) {
    console.error("Failed to load affiliate link", err);
  }
};


const saveAffiliateLink = async () => {
  if (
    !primaryAffiliateLink.trim() &&
    !secondaryAffiliateLink.trim()
  ) {
    handleError("Please enter at least one affiliate link");
    return;
  }

  try {
    setSaving(true);
    await axios.post(
      `${import.meta.env.VITE_API_URI}/${apiBase}/category-affiliate`,
      {
        category: selectedCategory,
        primaryLink: primaryAffiliateLink,
        secondaryLink: secondaryAffiliateLink,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    handleSuccess("Affiliate link saved successfully");
    setShowModal(false);
    await fetchCategoriesAndCounts();
  } catch (err) {
    console.error(err);
    handleError("Failed to save affiliate link");
  } finally {
    setSaving(false);
  }
};


const isAffiliateHealthy = (category) => {
  return (
    hasAffiliate(category) &&
    (!mismatchCounts[category] || mismatchCounts[category] === 0)
  );
};

const hasAffiliate = (category) => {
  return (
    affiliateStatus[category]?.primary ||
    affiliateStatus[category]?.secondary
  );
};

  return (
    <Layout>
      <section className="dashboard">
        <div className="dashboard-search">
         {lastReloadTime && (
          <p className="reload-info"> {/* ⬅️ Added */}
            Last Reload: {lastReloadTime.toLocaleTimeString()}
          </p>
        )} 
        
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
     </div>
        {/* Loading State */}
        {loading ? (
          <p>Loading...</p>
        ) : filteredCategories.length === 0 ? (
          <p>No categories found.</p>
        ) : (
          <div className="brand-list-grid">
            {filteredCategories.map((category) => (
               <div key={category} className="brand-card">
                  <div className="brand-header" onClick={() => handleClick(category)}>
                    <h3>{category}</h3>
                    <span className="badge">{counts[category] || 0}</span>
                  </div>

                  {mismatchCounts[category] > 0 && (
                    <div
                      className="mismatch-badge danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/affiliate-errors?category=${encodeURIComponent(category)}`);
                      }}
                    >
                      ⚠ {mismatchCounts[category]} Affiliate Mismatch
                    </div>
                  )}

                  {isAffiliateHealthy(category) && (
                      <div className="mismatch-badge success">
                        ✔ All Affiliate Links Ok
                      </div>
                    )}
                  {canManageAffiliate && (
                  <button
                    className="add-affiliate-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAffiliateModal(category);
                    }}
                  >
                    {hasAffiliate(category) ? "Update Affiliate" : "Add Affiliate"}
                  </button>
                  )}
              </div>
            ))}
          </div>
        )}
      </section>
      {showModal && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>
        {hasAffiliate(selectedCategory)
          ? "Update Affiliate Link"
          : "Add Affiliate Link"}
      </h3>

      <p className="modal-category">
        Category: <strong>{selectedCategory}</strong>
      </p>

      <input
        type="text"
        placeholder="Primary(Clockar Link) affiliate link"
        value={primaryAffiliateLink}
        onChange={(e) => setPrimaryAffiliateLink(e.target.value)}
      />

      <input
        type="text"
        placeholder="Secondary(Main Link) affiliate link"
        value={secondaryAffiliateLink}
        onChange={(e) => setSecondaryAffiliateLink(e.target.value)}
      />

      <div className="modal-actions">
        <button onClick={() => setShowModal(false)} className="cancel-btn">
          Cancel
        </button>
        <button onClick={saveAffiliateLink} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  </div>
)}

    </Layout>
  );
};

export default Home;
