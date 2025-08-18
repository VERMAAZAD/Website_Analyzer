import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./HostingDomains.css";

export default function HostingDomains() {
  const {server } = useParams();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
         setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_API_URI}/api/hosting/get-hostingInfo`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const filtered = res.data.all.filter(
          (item) => item.server === server
        );
        setDomains(filtered);
      } catch (error) {
        console.error("Error fetching domains:", error);
      }finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, [ server]);

  return (
    
    <div className="hosting-domains-page">
      <h2>Server: {server || "-"}</h2>
       {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading hosting info...</p>
        </div>
      ) : (
      <ul className="domain-list-hosting">
         {domains
      .filter((d) => d.domain && d.domain.trim() !== "")
      .map((d) => (
        <li key={d._id}>{d.domain}</li>
      ))}
      </ul>
      )}
    </div>
  );
}
