import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ServerList.css";
import "../HostingInfoList/HostingInfoList.css";
import { jwtDecode } from "jwt-decode";
import { handleError, handleSuccess } from "../../../toastutils";

const ServerList = () => {
  const { email, platform } = useParams();
  const navigate = useNavigate();

  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editData, setEditData] = useState(null);
  const [oldServer, setOldServer] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [error, setError] = useState("");

  // ================= FETCH SERVERS =================
  const normalize = (v) => v?.trim().toLowerCase();

  useEffect(() => {
    const fetchServers = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token");

    const res = await axios.get(
      `${import.meta.env.VITE_API_URI}/api/hosting/get-hostingInfo`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const serversData = res.data.servers || [];
    const domainsData = res.data.all || [];

    // filter servers by email + platform
    const filteredServers = serversData
    .filter(
      s =>
        normalize(s.email) === normalize(email) &&
        normalize(s.platform) === normalize(platform)
    )
    .map(s => ({
      ...s,
      domainCount: s.domainCount || 0, // use pre-calculated
    }));

    const serverMap = {};

    filteredServers.forEach(server => {
      const key = server.server;

      serverMap[key] = {
        server: server.server,
        platform: server.platform,
        ServerExpiryDate: server.ServerExpiryDate,
        domainCount: 0,
      };
    });

    // count domains per server
    domainsData.forEach(d => {
      if (
        normalize(d.email) === normalize(email) &&
        normalize(d.platform) === normalize(platform) &&
        d.server &&
        serverMap[d.server] &&
        d.domain &&
        d.domain !== "-"
      ) {
        serverMap[d.server].domainCount += 1;
      }
    });

    setServers(Object.values(serverMap));
  } catch (err) {
    console.error(err);
    handleError("Failed to load servers");
  } finally {
    setLoading(false);
  }
};


    fetchServers();
  }, [email, platform]);

  // ================= NAVIGATE =================
  const handleServerClick = (server, platform) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const { role } = jwtDecode(token);

    navigate(
    role === "admin"
      ? `/admin/hosting/domains/${email}/${platform}/${server}`
      : `/hosting/domains/${email}/${platform}/${server}`
   );
  };

  // ================= UPDATE SERVER =================
  const handleEditSave = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `${import.meta.env.VITE_API_URI}/api/hosting/update-server-everywhere`,
        {
          email,
          platform: editData.platform, 
          oldServer,
          newServer: editData.server,
          ServerExpiryDate: editData.ServerExpiryDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      handleSuccess("Server updated");
      setEditData(null);
      setOldServer("");
      window.location.reload();
    } catch (err) {
      handleError("Update failed");
    }
  };

  // ================= DELETE SERVER =================
  const confirmDelete = async () => {
    if (deleteInput.trim() !== deleteConfirm.server) {
      setError("❌ Server name does not match");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `${import.meta.env.VITE_API_URI}/api/hosting/delete-server`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            email,
            server: deleteConfirm.server,
            platform: deleteConfirm.platform,
          },
        }
      );

      setServers((prev) =>
        prev.filter((s) => s.server !== deleteConfirm.server)
      );

      handleSuccess("Server deleted");
      setDeleteConfirm(null);
      setDeleteInput("");
      setError("");
    } catch (err) {
      handleError("Delete failed");
    }
  };

  // ================= UI =================
  return (
    <div className="hosting-domains-page">
      <h2>
        Servers for <span>{email}</span>
      </h2>
       {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading servers...</p>
        </div>
      ) : (
      <div className="hi-table-wrap">
        <table className="hi-table">
          <thead>
            <tr>
              <th>Server</th>
              <th>Domain Count</th>
              <th>Server Expiry Date</th>
              <th>Show Domains</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {servers.map((srv) => (
              <tr key={srv.server}>
                <td>{srv.server}</td>
                <td>{srv.domainCount}</td>
                <td>
                  {srv.ServerExpiryDate
                    ? new Date(srv.ServerExpiryDate).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  <button
                    className="hi-btn-list"
                    onClick={() => handleServerClick(srv.server, srv.platform)}
                  >
                    View Domains
                  </button>
                </td>
                <td>
                  <button
                    className="hi-btn-edit"
                    onClick={() => {
                      setEditData(srv);
                      setOldServer(srv.server);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="hi-btn-delete"
                    onClick={() => setDeleteConfirm(srv)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {!loading && servers.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No servers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
       )}
      {/* EDIT POPUP */}
      {editData && (
        <div className="popup">
          <div className="popup-content">
            <h3>Edit Server</h3>
            <input
              value={editData.server}
              onChange={(e) =>
                setEditData({ ...editData, server: e.target.value })
              }
            />
            <input
              type="date"
              value={
                editData.ServerExpiryDate
                  ? new Date(editData.ServerExpiryDate)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setEditData({
                  ...editData,
                  ServerExpiryDate: e.target.value,
                })
              }
            />
            <button onClick={handleEditSave}>Save</button>
            <button onClick={() => setEditData(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* DELETE POPUP */}
      {deleteConfirm && (
        <div className="hi-edit-popup">
          <div className="hi-edit-card">
            <h3>Confirm Delete</h3>
            <p>Type <b>{deleteConfirm.server}</b></p>
            <input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
            />
            {error && <p className="error-text">{error}</p>}
            <button className="hi-btn-delete" onClick={confirmDelete}>
              Delete
            </button>
            <button
              className="hi-btn-cancel"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerList;
