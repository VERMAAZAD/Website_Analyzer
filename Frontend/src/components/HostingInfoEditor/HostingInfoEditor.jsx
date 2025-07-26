import React, { useEffect, useState } from "react";
import axios from "axios";
import "./HostingInfoEditor.css";
import { handleSuccess, handleError } from "../../toastutils";

const HostingInfoEditor = ({ domain }) => {
  const [platform, setPlatform] = useState("");
  const [email, setEmail] = useState("");
  const [cloudflare, setCloudflare] = useState("");
  const [savedData, setSavedData] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch hosting info on mount
  useEffect(() => {
    const fetchHostingInfo = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URI}/api/scraper/hosting-info/${domain}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = res.data.hostingInfo || {};
        setPlatform(data.platform || "");
        setEmail(data.email || "");
        setCloudflare(data.cloudflare || "");
        setSavedData(data);
      } catch (err) {
        handleError(err.response?.data?.error || "Failed to load hosting info");
      } finally {
        setLoading(false);
      }
    };

    fetchHostingInfo();
  }, [domain]);

  const handleSave = async () => {
    const data = { platform, email, cloudflare };

    try {
      setSaving(true);
      const res = await axios.put(
        `${import.meta.env.VITE_API_URI}/api/scraper/hosting-info/${domain}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      handleSuccess("Hosting info saved successfully");
      setSavedData(data);
    } catch (err) {
      handleError(err.response?.data?.error || "Failed to save hosting info");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading hosting info...</p>;

  return (
    <div className="hosting-editor-container">
      {/* Input Fields */}
      <div className="hosting-editor">
        <div className="hosting-field">
          <label>Domain Buying Platform:</label>
          <input
            type="text"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="e.g. GoDaddy, Hostinger"
          />
        </div>
        <div className="hosting-field">
          <label>Platform Email:</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />
        </div>
        <div className="hosting-field">
          <label>Cloudflare Info:</label>
          <input
            type="text"
            value={cloudflare}
            onChange={(e) => setCloudflare(e.target.value)}
            placeholder="Cloudflare settings or status"
          />
        </div>
        <button className="save-hosting-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Hosting Info"}
        </button>
      </div>

      {/* Display Saved Info */}
      {(savedData.platform || savedData.email || savedData.cloudflare) && (
        <div className="saved-hosting-info">
          <p><strong>📦 Platform:</strong> {savedData.platform}</p>
          <p><strong>📧 Email:</strong> {savedData.email}</p>
          <p><strong>☁️ Cloudflare:</strong> {savedData.cloudflare}</p>
        </div>
      )}
    </div>
  );
};

export default HostingInfoEditor;
