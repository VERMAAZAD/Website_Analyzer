import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layouts/Layout";
import { getAllCreatedLinks } from "../api";
import "./FolderList.css"; // Can reuse Home.css styles

export default function FolderList() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [counts, setCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const data = await getAllCreatedLinks(); // returns { singleLinks, chainGroups, folderGroups, folders }
      const folderNames = data.folders || [];
      setFolders(folderNames);

      // Count links per folder
      let countsObj = {};
      for (let name of folderNames) {
        countsObj[name] = data.folderGroups?.[name]?.length || 0;
      }
      setCounts(countsObj);
    } catch (err) {
      console.error("Failed to load folders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (folderName) => {
    navigate(`/folder/${encodeURIComponent(folderName)}`);
  };

  // Filter folders by search input
  const filteredFolders = folders.filter((f) =>
    f.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <section className="dashboard">
        <div className="dashboard-search">
          <input
            type="text"
            placeholder="Search folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : filteredFolders.length === 0 ? (
          <p>No folders found.</p>
        ) : (
          <div className="brand-list-grid">
            {filteredFolders.map((folder) => (
              <div
                key={folder}
                className="brand-card"
                onClick={() => handleClick(folder)}
              >
                <div className="brand-header">
                  <h3>{folder}</h3>
                  <span className="badge">{counts[folder] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
