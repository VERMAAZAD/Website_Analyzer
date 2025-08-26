import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ServerExpire.css";
import { handleError, handleSuccess } from "../../../toastutils";

function ServerExpire() {
  const [expiringServers, setExpiringServers] = useState([]);
  const [selectedServers, setSelectedServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingServer, setSavingServer] = useState(null); // Track server being saved

  useEffect(() => {
    fetchExpiringServers();
  }, []);

  const fetchExpiringServers = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/api/hosting/server-expire`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setExpiringServers(res.data.servers || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (serverId) => {
    setSelectedServers((prev) =>
      prev.includes(serverId)
        ? prev.filter((id) => id !== serverId)
        : [...prev, serverId]
    );
  };

  const handleSaveSingle = async (serverId) => {
    try {
      setSavingServer(serverId);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URI}/api/hosting/server-renew`,
        { servers: [serverId] },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      handleSuccess(res.data.message || "Server renewed successfully");
      fetchExpiringServers();
      setSelectedServers((prev) => prev.filter((id) => id !== serverId));
    } catch (err) {
      handleError(err);
    } finally {
      setSavingServer(null);
    }
  };

  return (
    <div className="server-expire-container">
      <h2>Servers Expiring Soon</h2>

      {loading ? (
        <p>Loading...</p>
      ) : expiringServers.length === 0 ? (
        <p>No servers are expiring within the next 10 days.</p>
      ) : (
        <table className="expire-table">
          <thead>
            <tr>
              <th>Renew</th>
              <th>Server</th>
              <th>Email</th>
              <th>Platform</th>
              <th>Expiry Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {expiringServers.map((server, idx) => {
              const expiryDate = new Date(server.ServerExpiryDate);
              const today = new Date();
              const diffTime = expiryDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays <= 10 && diffDays > 0) {
                return (
                  <tr key={idx}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedServers.includes(server._id)}
                        onChange={() => handleCheckboxChange(server._id)}
                      />
                    </td>
                    <td>{server.server}</td>
                    <td>{server.email}</td>
                    <td>{server.platform}</td>
                    <td>{expiryDate.toLocaleDateString()}</td>
                    <td>
                      ⚠️ {diffDays} day{diffDays !== 1 ? "s" : ""} remaining
                      <br />
                      {selectedServers.includes(server._id) && (
                        <button
                          className="save-btn-inline"
                          onClick={() => handleSaveSingle(server._id)}
                          disabled={savingServer === server._id}
                        >
                          {savingServer === server._id ? "Saving..." : "Save"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }

              return null;
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ServerExpire;
