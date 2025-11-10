import React, { useState, useEffect } from "react";
import "./BaseDomainManager.css";
import Layout from "../components/Layouts/Layout";
import { getBaseDomains, addBaseDomain, deleteBaseDomain } from "../api";
const BaseDomainManager = () => {
  const [domains, setDomains] = useState([]);
  const [baseUrl, setBaseUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDomains = async () => {
    const domains = await getBaseDomains();
     setDomains(domains);
  };
  
  const handleAddDomain = async () => {
    if (!baseUrl.trim()) return alert("Please enter a domain URL");
    setLoading(true);
    try {
      await addBaseDomain(baseUrl);
      setBaseUrl("");
      fetchDomains();
    } catch (e) {
      alert(e.response?.data?.error || "Error adding domain");
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteDomain = async (id) => {
    if (!window.confirm("Delete this domain?")) return;
    await deleteBaseDomain(id);
    fetchDomains();
  };
  useEffect(() => {
    fetchDomains();
  }, []);
  return (
    <Layout>
      {" "}
      <div className="domain-manager">
        {" "}
        <h2>🌐 Custom Domains</h2>{" "}
        <div className="domain-form">
          {" "}
          <input
            type="url"
            placeholder="https://yourdomain.com"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />{" "}
          <button onClick={handleAddDomain} disabled={loading}>
            {" "}
            {loading ? "Adding..." : "Add Domain"}{" "}
          </button>{" "}
        </div>{" "}
        <table className="domain-table">
          {" "}
          <thead>
            {" "}
            <tr>
              {" "}
              <th>Domain</th> <th>Base URL</th> <th>Actions</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody>
            {" "}
            {domains.map((d) => (
              <tr key={d._id}>
                {" "}
                <td>{d.name}</td> <td>{d.baseUrl}</td>{" "}
                <td>
                  {" "}
                  <button
                    onClick={() => handleDeleteDomain(d._id)}
                    className="delete-btn"
                  >
                    {" "}
                    🗑️{" "}
                  </button>{" "}
                </td>{" "}
              </tr>
            ))}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </Layout>
  );
};
export default BaseDomainManager;
