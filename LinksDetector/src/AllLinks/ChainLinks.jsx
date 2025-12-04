import { useEffect, useState } from "react";
import Layout from "../components/Layouts/Layout";
import { getAllCreatedLinks, deleteLink, deleteChain } from "../api"; // Make sure delete functions are imported
import "./AllLinks.css";
import { useNavigate } from "react-router-dom";
import { handleSuccess } from "../utils/toastutils";
import { FaRegCopy, FaRegTrashCan } from "react-icons/fa6";


export default function ChainLinks() {
  const [chains, setChains] = useState({});
   const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadChains();
  }, []);

  const loadChains = async () => {
    setLoading(true);
    try{
      const data = await getAllCreatedLinks();
      setChains(data.chainGroups); // groupId → array of links
    }catch(err){
      console.error("Error loading chains:", err);
    }
      setLoading(false);
  };

  // Helper: Get chain note (only first link has it)
  const getChainNote = (group) => {
    const first = group.find((l) => l.chainNote);
    return first?.chainNote || "Untitled Chain";
  };

  // Sort the links in each chain group by their createdAt timestamp
  const sortedChains = Object.entries(chains).map(([groupId, group]) => {
    const sortedGroup = group.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return { groupId, sortedGroup };
  });

  // Handle deleting a single link
  const handleDeleteLink = async (slug) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this link?");
    if(confirmDelete){
      const response = await deleteLink(slug);
      if (response.message) {
        handleSuccess(response.message);
        loadChains(); // Reload chains after deletion
      }
    }
  };

  // Handle deleting an entire chain
  const handleDeleteChain = async (groupId) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this entire chain?");
  if(confirmDelete){
    const response = await deleteChain(groupId);
    if (response.message) {
      handleSuccess(response.message);
      loadChains(); // Reload chains after deletion
    }
  }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    handleSuccess("Copied!");
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
                      <td>{link.originalUrl}</td>
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
