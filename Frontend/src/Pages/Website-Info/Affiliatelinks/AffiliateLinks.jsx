import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AffiliateLinks.css";

const AffiliateLinks = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, [superCategory]);

  return (
      <section className="affiliate-page">
        <h2>Affiliate Links</h2>

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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
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
                   <td>
                    {item.affiliateStatus === "ok" ? (
                      <span className="online">Working</span>
                    ) : (
                      <span className="offline">Not Working</span>
                    )}
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
