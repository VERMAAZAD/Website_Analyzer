// GeneratedLinksTable.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllLinks } from "../api"; // Import the API function
import "./GeneratedLinksTable.css";
import Layout from "../components/Layouts/Layout";

const GeneratedLinksTable = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const data = await getAllLinks(); // Call the imported function
        setLinks(data);
      } catch (err) {
        console.error("Error fetching links:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, []);

  return (
    <Layout>
      <div className="links-table-container">
        <h2>🔗 All Generated Links</h2>
        {loading ? (
          <p className="loading">Loading links...</p>
        ) : links.length === 0 ? (
          <p className="no-data">No links generated yet.</p>
        ) : (
          <table className="links-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Generated Link</th>
                <th>Target URL / Chain</th>
                <th>Total Clicks</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link, index) => (
                <tr key={link._id}>
                  <td>{index + 1}</td>
                  <td>
                    <a
                      href={link.generatedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-url"
                    >
                      {link.generatedUrl}
                    </a>
                  </td>
                  <td className="target">
                    <div className="target-main">{link.target}</div>
                    {link.chain && link.chain.length > 0 && (
                      <div className="chain-inline">
                        {link.chain.map((step, i) => (
                          <React.Fragment key={step.order}>
                            <a
                              href={step.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="chain-link-inline"
                            >
                              {step.domain}
                            </a>
                            {i !== link.chain.length - 1 && (
                              <span className="arrow"> → </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{link.clicks}</td>
                  <td>{new Date(link.createdAt).toLocaleString()}</td>
                  <td>
                    <Link
                      to={`/links/${link.linkId}`}
                      className="view-btn"
                    >
                      View Steps
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default GeneratedLinksTable;
