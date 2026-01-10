import { useEffect, useState } from "react";
import Layout from "../components/Layouts/Layout";
import { getAllCreatedLinks, deleteLink, updateOriginalUrl } from "../api";
import { useParams, useNavigate } from "react-router-dom";
import { handleError, handleSuccess } from "../utils/toastutils";
import { FaRegCopy, FaRegTrashCan, FaPen, FaCheck, FaXmark } from "react-icons/fa6";
import "./FolderDetails.css";

export default function FolderDetails() {
  const { name } = useParams();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // edit states
  const [editingSlug, setEditingSlug] = useState(null);
  const [editUrl, setEditUrl] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadFolderLinks();
  }, [name]);

  const loadFolderLinks = async () => {
    setLoading(true);
    try {
      const data = await getAllCreatedLinks();
      const folderLinks = data.folderGroups?.[name] || [];
      setLinks(folderLinks);
    } catch (err) {
      console.error("Error loading folder links:", err);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    handleSuccess("Copied!");
  };

  const handleDeleteLink = async (slug) => {
    if (!window.confirm("Delete this link?")) return;

    try {
      const res = await deleteLink(slug);
      if (res.message) {
        handleSuccess(res.message);
        loadFolderLinks();
      }
    } catch {
      handleError("Delete failed");
    }
  };

  // ---------------- UPDATE ORIGINAL URL ----------------
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
      loadFolderLinks();
    } catch {
      handleError("Failed to update URL");
    }
  };

  const sortedLinks = [...links].sort((a, b) => b.clicks - a.clicks);

  return (
    <Layout>
      <div className="links-container fade-in">
        <h2>Folder: {name}</h2>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        ) : sortedLinks.length === 0 ? (
          <p className="empty-msg">No links in this folder.</p>
        ) : (
          <div className="table-wrapper">
            <table className="links-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Original URL</th>
                  <th>Short URL</th>
                  <th>Clicks</th>
                  <th>Analytics</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {sortedLinks.map((item, index) => (
                  <tr key={item.slug}>
                    <td>{index + 1}</td>

                    {/* ORIGINAL URL */}
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

                    {/* SHORT URL */}
                    <td>
                      <a href={item.shortUrl} target="_blank" rel="noreferrer">
                        {item.shortUrl}
                      </a>
                    </td>

                    <td>{item.clicks || 0}</td>

                    <td>
                      <button
                        className="analytics-btn"
                        onClick={() => navigate(`/analytics/${item.slug}`)}
                      >
                        📊 Analytics
                      </button>
                    </td>

                    {/* ACTIONS */}
                    <td className="action-buttons">
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
                        <FaRegTrashCan />
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
