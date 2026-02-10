  import React, { useEffect, useState } from "react";
  import axios from "axios";
  import "./AffiliateLinks.css";

  const AffiliateLinks = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("both-ok");

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
      const pStatus = item.categoryAffiliateLinks?.primary;
      const sStatus = item.categoryAffiliateLinks?.secondary;

      if (!pStatus || !sStatus) return false;

      if (activeTab === "both-ok") {
        return pStatus.status === "ok" && sStatus.status === "ok" && !pStatus.redirectMismatch;
      }

      if (activeTab === "primary-error") {
        return pStatus.status === "error";
      }

      if (activeTab === "secondary-error") {
        return pStatus.status === "ok" && sStatus.status === "error";
      }

      if (activeTab === "both-error") {
        return pStatus.status === "error" && sStatus.status === "error";
      }

      if (activeTab === "redirect-error") {
        return pStatus.status === "ok" && sStatus.status === "ok" && pStatus.redirectMismatch;
      }

      return true;
    });

    return (
      <section className="affiliate-page">
        <h2>Affiliate Links</h2>
          <div className="affiliate-tabs">
          <button
            className={activeTab === "both-ok" ? "tab active" : "tab"}
            onClick={() => setActiveTab("both-ok")}
          >
            Both Working
          </button>

          <button
            className={activeTab === "primary-error" ? "tab active" : "tab"}
            onClick={() => setActiveTab("primary-error")}
          >
            Primary (Clocker Link) Error
          </button>

          <button
            className={activeTab === "secondary-error" ? "tab active" : "tab"}
            onClick={() => setActiveTab("secondary-error")}
          >
            Secondary (Main Link) Error
          </button>

          <button
            className={activeTab === "both-error" ? "tab active" : "tab"}
            onClick={() => setActiveTab("both-error")}
          >
            Both Error
          </button>

          <button
            className={activeTab === "redirect-error" ? "tab active" : "tab"}
            onClick={() => setActiveTab("redirect-error")}
          >
            Redirect Error
          </button>
        </div>

      
         <table className="affiliate-table">
  <thead>
    <tr>
      <th>Category</th>
      <th>Affiliate Link</th>
      <th className="status-th">Status</th>
    </tr>
  </thead>

  <tbody>
    {loading ? (
      <tr>
        <td colSpan="3" style={{ textAlign: "center" }}>
          Loading...
        </td>
      </tr>
    ) : filteredData.length === 0 ? (
      <tr>
        <td colSpan="3" className="no-affiliate">
          No affiliate links.
        </td>
      </tr>
    ) : (
      filteredData.map(item => {
        const p = item.categoryAffiliateLinks?.primary;
        const s = item.categoryAffiliateLinks?.secondary;

        return (
          <tr key={item.category}>
            <td>{item.category}</td>

            <td className="affiliate-links-cell">
              {p?.url && (
                <div className="affiliate-link-row">
                  <strong>Clocker Link:</strong>{" "}
                  <a href={p.url} target="_blank" rel="noreferrer">
                    {p.url}
                  </a>
                  <span className={`badge ${p.status}`}>{p.status}</span>
                </div>
              )}

              {s?.url && (
                <div className="affiliate-link-row">
                  <strong>Affiliate Link:</strong>{" "}
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.url}
                  </a>
                  <span className={`badge ${s.status}`}>{s.status}</span>
                </div>
              )}
            </td>

            <td>
              {p.status === "ok" && s.status === "ok" ? (
                p.redirectMismatch ? (
                  <span className="warning">Redirect Mismatch</span>
                ) : (
                  <span className="online">Working</span>
                )
              ) : (
                <span className="offline">Not Working</span>
              )}
            </td>
          </tr>
        );
      })
    )}
  </tbody>
</table>

      </section>
    );
  };

  export default AffiliateLinks;
