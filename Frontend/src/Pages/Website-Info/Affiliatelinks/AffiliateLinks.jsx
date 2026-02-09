import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AffiliateLinks.css";

const AffiliateLinks = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("working");


  const token = localStorage.getItem("token");
  const superCategory = localStorage.getItem("superCategory") || "natural";

  const apiBase =
    superCategory === "casino"
      ? "casino/affiliate"
      : superCategory === "dating"
      ? "dating/affiliate"
      : "api/affiliate";

  const fetchAffiliateLinks = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/category-affiliates`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setData(res.data);
    } catch (err) {
      console.error("Failed to load affiliate links", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliateLinks();
    const interval = setInterval(fetchAffiliateLinks, 10000);
    return () => clearInterval(interval);
  }, [superCategory]);

  const filteredData = data.filter(item => {
  if (activeTab === "working") return item.affiliateStatus === "ok";
  if (activeTab === "error") return item.affiliateStatus === "error";
  return true;
});

  return (
    <section className="affiliate-page">
      <h2>Affiliate Links</h2>
      <div className="affiliate-tabs">
        <button
          className={activeTab === "working" ? "tab active" : "tab"}
          onClick={() => setActiveTab("working")}
        >
           Working
        </button>

        <button
          className={activeTab === "error" ? "tab active" : "tab"}
          onClick={() => setActiveTab("error")}
        >
           Not Working
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : data.length === 0 ? (
        <p>No affiliate links added yet.</p>
      ) : (
        <table className="affiliate-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Affiliate Link</th>
              <th className="status-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.category}>
                <td>{item.category}</td>

                <td>
                  <a
                    href={item.affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.affiliateLink}
                  </a>
                </td>

                 <td className="status-affiliate">
                    <div className="status-box">
                    {item.checking && <span className="spinner"></span>}

                    {!item.checking && item.affiliateStatus === "ok" && (
                      <span className="online">Working</span>
                    )}

                    {!item.checking && item.affiliateStatus === "warning" && (
                      <span className="warning">
                        Tracking Hidden(
                        {item.affiliateReason && (
                          <small className="status-reason">
                            {item.affiliateReason.replace(/_/g, " ")}
                          </small>
                        )})
                      </span>
                    )}

                    {!item.checking && item.affiliateStatus === "error" && (
                      <span className="offline">
                        Not Working (
                        {item.affiliateReason && (
                          <small className="status-reason">
                            {item.affiliateReason.replace(/_/g, " ")}
                          </small>
                        )})
                      </span>
                    )}
                    </div>
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default AffiliateLinks;
