import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ServerList.css";
import { jwtDecode } from "jwt-decode";

const ServerList = () => {
  const { email } = useParams();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState(null); 
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

        // ✅ group servers with domain counts`
        const serverMap = {};
       filtered.forEach((item) => {
          if (item.server) {
            if (!serverMap[item.server]) {
              serverMap[item.server] = { count: 0, expiry: item.ServerExpiryDate || null, _id: item._id };
            }
            // only increment count if domain exists
            if (item.domain && item.domain.trim() !== "" && item.domain !== "-") {
              serverMap[item.server].count += 1;
            }
          }
        });

        const serverList = Object.entries(serverMap).map(([server, data]) => ({
            server,
            domainCount: data.count,
            ServerExpiryDate: data.expiry,
            _id: data._id,
        }));

        setServers(serverList);
      } catch (error) {
        console.error("Error fetching servers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, [email]);

   const handleEditSave = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_API_URI}/api/hosting/update-server/${editData._id}`,
        {
          server: editData.server,
          ServerExpiryDate: editData.ServerExpiryDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditData(null);
      window.location.reload(); // reload list
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleServerClick = (server) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const { role } = jwtDecode(token);
    if (role === "admin") {
      navigate(`/admin/hosting/domains/${encodeURIComponent(email)}/${encodeURIComponent(server)}`);
    } else {
      navigate(`/hosting/domains/${encodeURIComponent(email)}/${encodeURIComponent(server)}`);
    }
  };

  return (
    <div>
    <div className="hosting-domains-page">
      <h2>
        Servers for <span>{email || "-"}</span>
      </h2>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading Server info...</p>
        </div>
      ) : servers.length > 0 ? (
        <ul className="domain-list-server">
          {servers.map((srv, idx) => (
            <li key={idx}>
              <span className="srv-name">{srv.server}</span>
              <span className="srv-count">({srv.domainCount} domains)</span>
              <span className="srv-exp">
                Exp:{" "}
                {srv.ServerExpiryDate
                  ? new Date(srv.ServerExpiryDate).toLocaleDateString()
                  : "N/A"}
              </span>
              <button
                className="hi-btn-list"
                onClick={() => handleServerClick(srv.server)}
              >
                View Domains
              </button>
               <button
                className="hi-btn-edit"
                onClick={() => setEditData(srv)}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No servers found for this email.</p>
      )}
    </div>

      {editData && (
        <div className="popup">
          <div className="popup-content">
            <h3>Edit Server</h3>
            <label>Server:</label>
            <input
              type="text"
              value={editData.server}
              onChange={(e) =>
                setEditData({ ...editData, server: e.target.value })
              }
            />
            <label>Expiry Date:</label>
            <input
              type="date"
              value={
                editData.ServerExpiryDate
                  ? new Date(editData.ServerExpiryDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setEditData({ ...editData, ServerExpiryDate: e.target.value })
              }
            />
            <div className="btns">
              <button onClick={handleEditSave}>Save</button>
              <button onClick={() => setEditData(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}
export default ServerList;