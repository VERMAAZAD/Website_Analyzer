import { useEffect, useState } from "react";
import Layout from "../components/Layouts/Layout";
import { getAllCreatedLinks, deleteLink } from "../api";
import { useParams, useNavigate } from "react-router-dom";
import { handleSuccess } from "../utils/toastutils";
import { FaRegCopy, FaRegTrashCan } from "react-icons/fa6";
import "./FolderDetails.css";

export default function FolderDetails() {
  const { name } = useParams();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
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
    }
    setLoading(false);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    handleSuccess("Copied!");
  };

  const handleDeleteLink = async (slug) => {
    if (!window.confirm("Delete this link?")) return;

    const res = await deleteLink(slug);
    if (res.message) {
      handleSuccess(res.message);
      loadFolderLinks();
    }
  };

  return (
    <Layout>
      <div className="links-container fade-in">
        <h2>Folder: {name}</h2>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        ) : links.length === 0 ? (
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
                {links.map((item, index) => (
                  <tr key={item.slug}>
                    <td>{index + 1}</td>

                    <td className="truncate">{item.originalUrl}</td>

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

                    <td>
                      <button className="copy-btn" onClick={() => copy(item.shortUrl)}>
                        <FaRegCopy />
                      </button>

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
