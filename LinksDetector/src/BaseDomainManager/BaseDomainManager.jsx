import React, { useState, useEffect } from "react";
import axios from "axios";
import "./BaseDomainManager.css";
import Layout from "../components/Layouts/Layout";

const BaseDomainManager = () => {
  const [domains, setDomains] = useState([]);
  const [baseUrl, setBaseUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDomains = async () => {
    const res = await axios.get("http://localhost:5000/clockar/api/getBaseDomain");
    if (res.data.ok) setDomains(res.data.domains);
  };

  const addDomain = async () => {
    if (!baseUrl.trim()) return alert("Please enter a domain URL");
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/clockar/api/addBaseUrl", { baseUrl });
      setBaseUrl("");
      fetchDomains();
    } catch (e) {
      alert(e.response?.data?.error || "Error adding domain");
    } finally {
      setLoading(false);
    }
  };

  const deleteDomain = async (id) => {
    if (!window.confirm("Delete this domain?")) return;
    await axios.delete(`http://localhost:5000/clockar/api/deleteBaseDomain/${id}`);
    fetchDomains();
  };

  useEffect(() => { fetchDomains(); }, []);

  return (
   <Layout>
     <div className="domain-manager">
      <h2>🌐 Custom Domains</h2>
      <div className="domain-form">
        <input
          type="url"
          placeholder="https://yourdomain.com"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
        />
        <button onClick={addDomain} disabled={loading}>
          {loading ? "Adding..." : "Add Domain"}
        </button>
      </div>

      <table className="domain-table">
        <thead>
          <tr>
            <th>Domain</th>
            <th>Base URL</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {domains.map((d) => (
            <tr key={d._id}>
              <td>{d.name}</td>
              <td>{d.baseUrl}</td>
              <td>
                <button onClick={() => deleteDomain(d._id)} className="delete-btn">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
   </Layout>
  );
};

export default BaseDomainManager;
