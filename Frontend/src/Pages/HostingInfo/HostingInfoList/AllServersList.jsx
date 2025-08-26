import { useState, useMemo } from "react";
import axios from "axios";
import "./HostingInfoList.css"; // ✅ reuse same CSS file
import { handleError, handleSuccess } from "../../../toastutils";

export default function AllServersList({ servers, setServers, fetchHostingInfo }) {
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    server: "",
    ServerExpiryDate: "",
  });

  const [search, setSearch] = useState("");
   const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteInput, setDeleteInput] = useState("");
   const [error, setError] = useState("");

 // ✅ Filter servers by search
  const filteredServers = useMemo(() => {
    return servers.filter(
      (srv) =>
        srv.server?.toLowerCase().includes(search.toLowerCase()) ||
        srv.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [servers, search]);

  // open popup and prefill
  const handleEditClick = (srv) => {
    setEditing(srv);
    setFormData({
      server: srv.server || "",
      ServerExpiryDate: srv.ServerExpiryDate
        ? new Date(srv.ServerExpiryDate).toISOString().split("T")[0]
        : "",
    });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_API_URI}/api/hosting/update-server/${editing._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setServers((prev) =>
        prev.map((item) =>
          item._id === editing._id ? { ...item, ...formData } : item
        )
      );

      setEditing(null); // close popup
      fetchHostingInfo(); // refresh table
      handleSuccess("✅ Server updated successfully");
    } catch (err) {
       handleError("❌ Failed to update server");
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
      fetchHostingInfo();
      handleSuccess("✅ Server deleted successfully");

      setDeleteConfirm(null);
      setDeleteInput("");
      setError("");
    } catch (err) {
      handleError("❌ Failed to delete server");
    }
  };


  return (
    // <div className="hi-card-list hi-appear">
    <>
      <h2 className="hi-title">All Servers</h2>
       <div className="hi-search-wrap">
        <input
          type="text"
          className="hi-search"
          placeholder="Search by server or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="hi-table-wrap">
        <table className="hi-table">
          <thead>
            <tr>
              <th>Server</th>
              <th>Email</th>
              <th>Server Expiry Date</th>
              <th>Actions</th>
            </tr>
          </thead>
              <tbody>
            {filteredServers.map((srv) => (
              <tr key={srv._id}>
                <td>{srv.server}</td>
                <td>{srv.email}</td>
                <td>
                  {srv.ServerExpiryDate
                    ? new Date(srv.ServerExpiryDate).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  <button
                    className="hi-btn-edit"
                    onClick={() => handleEditClick(srv)}
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
            {filteredServers.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No servers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Server Edit Popup (independent from HostingInfo popup) */}
      {editing && (
        <div className="hi-edit-popup">
          <div className="hi-edit-card">
            <h3>Edit Server</h3>
            <label>Server</label>
            <input
              type="text"
              name="server"
              value={formData.server}
              onChange={handleChange}
            />

            <label>Server Expiry Date</label>
            <input
              type="date"
              name="ServerExpiryDate"
              value={formData.ServerExpiryDate}
              onChange={handleChange}
            />

            <div className="hi-edit-actions">
              <button className="hi-btn-save" onClick={handleUpdate}>
                Save
              </button>
              <button
                className="hi-btn-cancel"
                onClick={() => setEditing(null)}
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
      </>
    // </div>
  );
}
