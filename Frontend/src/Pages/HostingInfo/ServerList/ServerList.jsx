import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ServerList.css";
import "../HostingInfoList/HostingInfoList.css"
import { jwtDecode } from "jwt-decode";
import { handleError, handleSuccess } from "../../../toastutils";

const ServerList = () => {
  const { email } = useParams();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState(null);
  const [oldServer, setOldServer] = useState(""); // store original server name
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [error, setError] = useState("");

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

        // ✅ group servers with domain counts
        const serverMap = {};
        filtered.forEach((item) => {
          if (item.server) {
            if (!serverMap[item.server]) {
              serverMap[item.server] = {
                count: 0,
                expiry: item.ServerExpiryDate || null,
                _id: item._id,
              };
            }
            if (
              item.domain &&
              item.domain.trim() !== "" &&
              item.domain !== "-"
            ) {
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
        `${import.meta.env.VITE_API_URI}/api/hosting/update-server-everywhere`,
        {
          email,
          oldServer, // original name
          newServer: editData.server, // updated value
          ServerExpiryDate: editData.ServerExpiryDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEditData(null);
      setOldServer("");
      window.location.reload();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleServerClick = (server) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const { role } = jwtDecode(token);
    if (role === "admin") {
      navigate(
        `/admin/hosting/domains/${encodeURIComponent(email)}/${encodeURIComponent(server)}`
      );
    } else {
      navigate(
        `/hosting/domains/${encodeURIComponent(email)}/${encodeURIComponent(server)}`
      );
    }
  };

   const confirmDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteInput.trim() !== deleteConfirm.server) {
      setError("❌ Server name does not match. Try again.");
      return;
    }
    
   try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_API_URI}/api/hosting/delete-server/${deleteConfirm._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setServers((prev) => prev.filter((srv) => srv._id !== deleteConfirm._id));
      handleSuccess("✅ Server deleted successfully");
      setDeleteConfirm(null);
      setDeleteInput("");
      setError("");
    } catch (err) {
      handleError("❌ Failed to delete server");
    }
  };

  return (
    <div>
      <div className="hosting-domains-page">
        <h2>
          Servers for <span>{email || "-"}</span>
        </h2>

          <div className="hi-table-wrap">
  <table className="hi-table">
    <thead>
      <tr>
        <th>Server</th>
        <th>Domain Count</th>
        <th>Server Expiry Date</th>
        <th>Show Domain</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {servers.map((srv) => (
        <tr key={srv._id}>
          <td>{srv.server}</td>
          <td>{srv.domainCount || 0}</td>
          <td>
            {srv.ServerExpiryDate
              ? new Date(srv.ServerExpiryDate).toLocaleDateString()
              : "N/A"}
          </td>
          <td>
            <button
              className="hi-btn-list"
              onClick={() => handleServerClick(srv.server)}
            >
              View Domains
            </button>
            
          </td>
          <td>
                <button
              className="hi-btn-edit"
              onClick={() => {
                setEditData(srv);
                setOldServer(srv.server); // keep old server name
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
      {servers.length === 0 && (
        <tr>
          <td colSpan="5" style={{ textAlign: "center" }}>
            No servers found for this email.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

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
            <div className="btns">
              <button onClick={handleEditSave}>Save</button>
              <button
                onClick={() => {
                  setEditData(null);
                  setOldServer("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

       {deleteConfirm && (
        <div className="hi-edit-popup">
          <div className="hi-edit-card">
            <h3>Confirm Delete</h3>
            <p>
              To delete <b>{deleteConfirm.server}</b>, please type the server
              name below:
            </p>
            <input
              type="text"
              placeholder="Type server name..."
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
            />
            {error && <p className="error-text">{error}</p>}
            <div className="hi-edit-actions">
              <button
                className="hi-btn-delete"
                onClick={confirmDelete}
              >
                Confirm Delete
              </button>
              <button
                className="hi-btn-cancel"
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteInput("");
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ServerList;
