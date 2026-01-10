import { useEffect, useState } from "react";
import Layout from "../components/Layouts/Layout";
import { getAllCreatedLinks, deleteLink, deleteChain, updateOriginalUrl } from "../api"; // Make sure delete functions are imported
import "./AllLinks.css";
import { useNavigate } from "react-router-dom";
import { handleSuccess } from "../utils/toastutils";
import { FaRegCopy, FaRegTrashCan, FaPen,  FaCheck,  FaXmark } from "react-icons/fa6";


export default function ChainLinks() {
  const [chains, setChains] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingSlug, setEditingSlug] = useState(null);
  const [editUrl, setEditUrl] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadChains();
  }, []);

  const loadChains = async () => {
    setLoading(true);
    try{
      const data = await getAllCreatedLinks();
      setChains(data.chainGroups);
    }catch(err){
      console.error("Error loading chains:", err);
    }
      setLoading(false);
  };

  const getChainNote = (group) => {
    const first = group.find((l) => l.chainNote);
    return first?.chainNote || "Untitled Chain";
  };

  const sortedChains = Object.entries(chains).map(([groupId, group]) => {
    const sortedGroup = group.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return { groupId, sortedGroup };
  });

  const handleDeleteLink = async (slug) => {
    if (!window.confirm("Delete this link?")) return;

    try {
      const res = await deleteLink(slug);
      if (res.message) {
        handleSuccess(res.message);
        loadChains();
      }
    } catch {
      handleError("Delete failed");
    }
  };

  // Handle deleting an entire chain
  const handleDeleteChain = async (groupId) => {
    if (!window.confirm("Delete entire chain?")) return;

    try {
      const res = await deleteChain(groupId);
      if (res.message) {
        handleSuccess(res.message);
        loadChains();
      }
    } catch {
      handleError("Failed to delete chain");
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    handleSuccess("Copied!");
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
    if (!editUrl.trim()) return handleError("URL cannot be empty");

    try {
      await updateOriginalUrl(slug, editUrl);
      handleSuccess("Original URL updated");
      cancelEdit();
      loadChains();
    } catch {
      handleError("Failed to update URL");
    }
  };

  return (
    <Layout>
      <div className="links-container fade-in">
        <h2>Domain Chains</h2>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div> {/* Add spinner */}
          </div>
        ) : sortedChains.length === 0 ? (
          <p className="empty-msg">No domain chains created yet.</p>
        ) : (
          sortedChains.map(({ groupId, sortedGroup }) => (
            <div className="chain-card" key={groupId}>
              {/* Chain Title */}
              <h3>{getChainNote(sortedGroup)}</h3>
              <div className="del-chain">
              <small>Chain ID: {groupId}</small>

              {/* Delete Chain Button */}
              <button
                className="delete-btn"
                onClick={() => handleDeleteChain(groupId)}
              >
                Delete Chain
              </button>
            </div>
            <div className="table-wrapper">
              <table className="links-table">
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Original URL</th>
                    <th>Short URL</th>
                    <th>Clicks</th>
                    <th>Next Step</th>
                    <th>Analytics</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedGroup.map((link, index) => (
                    <tr key={link.slug}>
                      <td>{index + 1}</td>
                      <td className={editingSlug === link.slug ? "edit-cell" : "truncate"}>
                          {editingSlug === link.slug ? (
                            <input
                              type="text"
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              className="edit-url-input"
                            />
                          ) : (
                            link.originalUrl
                          )}
                      </td>
                      <td>
                        <a href={link.shortUrl} target="_blank" rel="noreferrer">
                          {link.shortUrl}
                        </a>
                      </td>
                      <td>{link.clicks}</td>
                      <td>{link.chainNextSlug || "END"}</td>
                      <td>
                        
                        <button
                          className="analytics-btn"
                          onClick={() => navigate(`/analytics/${link.slug}`)}
                        >
                          📊 Analytics
                        </button>
                      </td>
                      {/* Delete Link Button */}
                      <td>
                        <button
                          className="copy-btn"
                          onClick={() => copy(link.shortUrl)}
                        >
                          <FaRegCopy />
                        </button>
                        {editingSlug === link.slug ? (
                            <>
                              <button
                                className="save-btn"
                                onClick={() => saveEdit(link.slug)}
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
                              onClick={() => startEdit(link)}
                            >
                              <FaPen />
                            </button>
                          )}
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteLink(link.slug)}
                        >
                         <FaRegTrashCan />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
