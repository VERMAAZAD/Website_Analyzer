import { useEffect, useState } from "react";
import Layout from "../components/Layouts/Layout";
import { getAllCreatedLinks, deleteLink, updateOriginalUrl } from "../api"; // Make sure delete function is imported
import "./AllLinks.css";
import { useNavigate } from "react-router-dom";
import { handleSuccess, handleError } from "../utils/toastutils";
import { FaRegCopy, FaRegTrashCan, FaPen, FaCheck, FaXmark } from "react-icons/fa6";

export default function SingleLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSlug, setEditingSlug] = useState(null);
  const [editUrl, setEditUrl] = useState("");

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
    try {
      const response = await deleteLink(slug);
      if (response.message) {
        handleSuccess(response.message);
        loadLinks();
      }
    } catch {
      handleError("Delete failed");
    }
  };

   const startEdit = (link) => {
    setEditingSlug(link.slug);
    setEditUrl(link.originalUrl);
  };

  const cancelEdit = () => {
    setEditingSlug(null);
    setEditUrl("");
  };

  const saveEdit = async (slug) => {
    if (!editUrl.trim()) {
      return handleError("URL cannot be empty");
    }

    try {
      await updateOriginalUrl(slug, editUrl);
      handleSuccess("Original URL updated");
      cancelEdit();
      loadLinks();
    } catch {
      handleError("Failed to update URL");
    }
  };


  const sortedLinks = [...links].sort((a, b) => b.clicks - a.clicks);
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
                {sortedLinks.map((item) => (
                  <tr key={item._id}>
                     <td className={editingSlug === item.slug ? "edit-cell" : "truncate"}>
                      {editingSlug === item.slug ? (
                        <input
                          type="text"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          className="edit-url-input"
                        />
                      ) : (
                        item.originalUrl
                      )}
                    </td>

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
                       {editingSlug === item.slug ? (
                        <>
                          <button
                            className="save-btn"
                            onClick={() => saveEdit(item.slug)}
                          >
                            <FaCheck />
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={cancelEdit}
                          >
                            <FaXmark />
                          </button>
                        </>
                      ) : (
                        <button
                          className="edit-btn"
                          onClick={() => startEdit(item)}
                        >
                          <FaPen />
                        </button>
                      )}
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
