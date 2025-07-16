import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../../components/Layouts/Layout";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
   const [lastReloadTime, setLastReloadTime] = useState(null);

  const token = localStorage.getItem("token");

  const fetchCategoriesAndCounts = async () => {
    setLoading(true);
    try {
      const [categoriesRes, countsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/scraper/categories", {
          headers: { Authorization: `Bearer ${token}` },

          
        }),
        
        axios.get("http://localhost:5000/api/scraper/category-counts", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCategories(categoriesRes.data);
      setCounts(countsRes.data);
      setLastReloadTime(new Date());
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndCounts();
  }, []);

  const handleClick = (category) => {
    navigate(`/domains?category=${encodeURIComponent(category)}`);
  };

  // Filter categories by search input
  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <section className="dashboard">
        <div className="top-bar">
          <h2>All Product Category</h2>
          <button className="refresh-btn" onClick={fetchCategoriesAndCounts}>
            🔄 Refresh
          </button>
        </div>

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
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Home;
