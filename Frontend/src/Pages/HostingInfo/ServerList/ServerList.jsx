// src/components/Hosting/HostingDomains.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ServerList.css";
import { jwtDecode } from "jwt-decode";

export default function HostingDomains() {
  const { email } = useParams();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_API_URI}/api/hosting/get-hostingInfo`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // filter by email
        const filtered = res.data.all.filter(
          (item) => item.email?.toLowerCase() === email.toLowerCase()
        );

        // deduplicate servers
        const uniqueServers = [...new Set(filtered.map((d) => d.server).filter(Boolean))];
        setServers(uniqueServers);
      } catch (error) {
        console.error("Error fetching servers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, [email]);

  const handleServerClick = (server) => {
        const token = localStorage.getItem("token");
            if (!token) return;
        
            const { role } = jwtDecode(token);
            if (role === "admin") {
              navigate(`/admin/hosting/domains/${encodeURIComponent(email)}/${encodeURIComponent(server)}`);
            } else {
              navigate(`/hosting/domains/${encodeURIComponent(email)}/${encodeURIComponent(server)}`);;
            }
  };

  return (
    <div className="hosting-domains-page">
      <h2>Servers for <span>{email || "-"}</span></h2>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading Server info...</p>
        </div>
      ) : servers.length > 0 ? (
        <ul className="domain-list-server">
          {servers.map((srv, idx) => (
            <li key={idx}>
              {srv}
              <button 
                className="srv-btn"
                onClick={() => handleServerClick(srv)}
              >
                View Domains
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No servers found for this email.</p>
      )}
    </div>
  );
}
