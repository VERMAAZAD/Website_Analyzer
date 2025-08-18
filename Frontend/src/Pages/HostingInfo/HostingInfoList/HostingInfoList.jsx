import { useEffect, useState } from "react";
import axios from "axios";
import "./HostingInfoList.css";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function HostingInfoList() {
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // track row being edited
  const [formData, setFormData] = useState({}); // store edit values
  const navigate = useNavigate();

  useEffect(() => {
    fetchHostingInfo();
  }, []);

  const fetchHostingInfo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/api/hosting/get-hostingInfo`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data.list || []);
      setAllData(res.data.all || []);
    } catch (error) {
      console.error("Error fetching hosting info:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleViewDomains = (email, server) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const { role } = jwtDecode(token); // extract role

    if (role === "admin") {
          navigate(
            `/admin/hosting/domains/${encodeURIComponent(server)}`
          );
          } else {
            navigate(
              `/hosting/domains/${encodeURIComponent(server)}`
            );
   }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setFormData({
      platform: row.platform || "",
      hostingIssueDate: row.hostingIssueDate
        ? row.hostingIssueDate.split("T")[0]
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
        `${import.meta.env.VITE_API_URI}/api/hosting/update-hosting`,
        {
          email: editing.email,
          server: editing.server,
          updates: formData,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEditing(null);
      fetchHostingInfo();
    } catch (error) {
      console.error("Error updating hosting info:", error);
    }
  };

  return (
    <div className="hi-page-list">
      <div className="hi-card-list hi-appear">
        <h2 className="hi-title">All Hosting Info</h2>
        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading hosting info...</p>
          </div>
        ) : (
          <div className="hi-table-wrap">
            <table className="hi-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Email</th>
                  <th>Server</th>
                  <th>Hosting Issue Date</th>
                  <th>Domain Count</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data
                    .filter((row) => {
                      const domainCount = allData.filter(
                        (item) =>
                          item.email === row.email && item.server === row.server
                      ).length;

                      // Skip if all fields empty and no domains
                      return (
                        row.platform?.trim() ||
                        row.email?.trim() ||
                        row.server?.trim() ||
                        row.hostingIssueDate
                      );
                    })
                    .map((row, i) => {
                      const domainCount = allData.filter(
                        (item) =>
                          item.email === row.email && item.server === row.server && item.domain && item.domain.trim() !== "" && item.domain !== "-"
                      ).length;

                      return (
                        <tr key={i}>
                          <td>{row.platform || "-"}</td>
                          <td>{row.email || "-"}</td>
                          <td>{row.server || "-"}</td>
                          <td>{formatDate(row.hostingIssueDate)}</td>
                          <td>{domainCount}</td>
                          <td>
                            <button
                              className="hi-btn-list"
                              onClick={() =>
                                handleViewDomains(row.email, row.server)
                              }
                            >
                              View Domains
                            </button>
                            <button
                              className="hi-btn-edit"
                              onClick={() => handleEdit(row)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No hosting info found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Popup */}
      {editing && (
        <div className="hi-edit-popup">
          <div className="hi-edit-card">
            <h3>Edit Hosting Info</h3>
            <label>Platform</label>
            <input
              type="text"
              name="platform"
              value={formData.platform}
              onChange={handleChange}
            />
            <label>Hosting Issue Date</label>
            <input
              type="date"
              name="hostingIssueDate"
              value={formData.hostingIssueDate}
              onChange={handleChange}
            />
            <div className="hi-edit-actions">
              <button className="hi-btn-save" onClick={handleUpdate}>
                Save
              </button>
              <button className="hi-btn-cancel" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
