import { useEffect, useState } from "react";
import Layout from "../components/Layouts/Layout";
import { getAllCreatedLinks, deleteLink } from "../api"; // Make sure delete function is imported
import "./AllLinks.css";
import { useNavigate } from "react-router-dom";
import { handleSuccess } from "../utils/toastutils";
import { FaRegCopy, FaRegTrashCan } from "react-icons/fa6";

export default function SingleLinks() {
  const [links, setLinks] = useState([]);
   const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const data = await getAllCreatedLinks();
      setLinks(data.singleLinks || []); // 🔥 only single links
    } catch (err) {
      console.error("Error loading links:", err);
    }
    setLoading(false); 
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    handleSuccess("Copied!");
  };

  // Handle deleting a single link with confirmation
  const handleDeleteLink = async (slug) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this link?");
    if (confirmDelete) {
      const response = await deleteLink(slug);
      if (response.message) {
        handleSuccess(response.message);
        loadLinks(); // Reload links after deletion
      }
    }
  };

  return (
    <Layout>
      <div className="links-container fade-in">
        <h2>Single Short Links</h2>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div> {/* Add spinner */}
          </div>
        ) : !links.length ? (
          <p className="empty-msg">No single links found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="links-table">
              <thead>
                <tr>
                  <th>Original URL</th>
                  <th>Short URL</th>
                  <th>Clicks</th>
                  <th>Analytics</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {links.map((item) => (
                  <tr key={item._id}>
                    <td className="truncate">{item.originalUrl}</td>

                    <td>
                      <a
                        href={item.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.shortUrl}
                      </a>
                    </td>

                    <td>{item.clicks}</td>

                    <td>
                      <button
                        className="analytics-btn"
                        onClick={() => navigate(`/analytics/${item.slug}`)}
                      >
                        📊 Analytics
                      </button>
                    </td>
                    <td>
                       <button
                        className="copy-btn"
                        onClick={() => copy(item.shortUrl)}
                      >
                        <FaRegCopy />
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteLink(item.slug)}
                      >
                        <FaRegTrashCan/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
