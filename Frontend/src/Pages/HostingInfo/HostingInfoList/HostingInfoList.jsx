import { useEffect, useState } from "react";
import axios from "axios";
import "./HostingInfoList.css";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import AllServersList from "./AllServersList";

export default function HostingInfoList() {
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [serversMap, setServersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [searchQuery, setSearchQuery] = useState(""); 
  const [showAllServers, setShowAllServers] = useState(false);
  const navigate = useNavigate();




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
      setServersMap(res.data.serversByEmail || {});
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

  const handleServer = (email) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const { role } = jwtDecode(token);
    if (role === "admin") {
      navigate(`/admin/servers/${encodeURIComponent(email)}`);
    } else {
      navigate(`/servers/${encodeURIComponent(email)}`);
    }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setFormData({
      email: row.email || "",
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
          platform: editing.platform,
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

  // get unique platforms
  const platforms = ["All", ...new Set(data.map((d) => d.platform).filter(Boolean))];

  // filter rows by selected platform
  const filteredData = data.filter((row) => {
    const matchPlatform =
      selectedPlatform === "All" || row.platform === selectedPlatform;

    const searchLower = searchQuery.toLowerCase();
    const matchSearch =
      row.platform?.toLowerCase().includes(searchLower) ||
      row.email?.toLowerCase().includes(searchLower) ||
      row.server?.toLowerCase().includes(searchLower);

    return matchPlatform && matchSearch;
  });

    useEffect(() => {
    fetchHostingInfo();
  }, []);
  return (
    <div className="hi-page-list">
      <div className="hi-card-list hi-appear">
        <h2 className="hi-title">All Hosting Info</h2>

        <div className="hi-controls">
        <div className="hi-filters">
          {platforms.map((p, i) => (
            <button
              key={i}
              className={`hi-filter-btn ${
                selectedPlatform === p ? "active" : ""
              }`}
              onClick={() => setSelectedPlatform(p)}
            >
              {p}
            </button>
          ))}
        </div>
         <input
            type="text"
            className="hi-search"
            placeholder="Search by platform, email or server..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
          <button
  className="hi-btn-allservers"
  onClick={() => setShowAllServers((prev) => !prev)}
>
  {showAllServers ? "Hide All Servers" : "Show All Servers"}
</button>

{showAllServers && (
  <AllServersList allData={allData} setAllData={setAllData} onEdit={handleEdit} />
)}
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
                  <th>Hosting Issue Date</th>
                  <th>Server</th>
                  <th>Server Count</th>
                  <th>Domain Count</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData
                    .filter((row) => {
                      const domainCount = allData.filter(
                        (item) =>
                          item.email === row.email && item.server === row.server
                      ).length;

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
                          item.email === row.email &&
                          item.server === row.server &&
                          item.domain &&
                          item.domain.trim() !== "" &&
                          item.domain !== "-"
                      ).length;

                      return (
                        <tr key={i}>
                          <td>{row.platform || "-"}</td>
                          <td>{row.email || "-"}</td>
                          <td>{formatDate(row.hostingIssueDate)}</td>
                           <td>
                               <button
                            className="hi-btn-list"
                            onClick={() => handleServer(row.email)}
                          >
                            Show Servers
                          </button>
                          </td>
                          
                          <td>{row.serverCount || 0}</td>
                          <td>{row.domainCount || 0}</td>
                         
                          <td>
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
            <label>Email</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
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
    </div>
  );
}