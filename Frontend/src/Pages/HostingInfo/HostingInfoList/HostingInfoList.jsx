import { useEffect, useState } from "react";
import axios from "axios";
import "./HostingInfoList.css";
import { useNavigate } from "react-router-dom";

export default function HostingInfoList() {
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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
      }finally {
        setLoading(false);
      }
    };

    fetchHostingInfo();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleViewDomains = (email, server) => {
    navigate(
      `/hosting/domains/${encodeURIComponent(email)}/${encodeURIComponent(server)}`
    );
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
          (item) => item.email === row.email && item.server === row.server
        ).length;

        // Skip if all fields are empty and domain count is 0
        return (
          row.platform?.trim() ||
          row.email?.trim() ||
          row.server?.trim() ||
          row.hostingIssueDate
        );
      })
      .map((row, i) => {
        const domainCount = allData.filter(
          (item) => item.email === row.email && item.server === row.server
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
                onClick={() => handleViewDomains(row.email, row.server)}
              >
                View Domains
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
    </div>
  );
}
