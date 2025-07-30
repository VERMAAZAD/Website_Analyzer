import React, { useEffect, useState } from "react";
import axios from "axios";
import "./HostingInfoEditor.css";
import { handleSuccess, handleError } from "../../toastutils";

const HostingInfoEditor = ({ domain }) => {
  const [platform, setPlatform] = useState("");
  const [email, setEmail] = useState("");
  const [server, setServer] = useState("");
  const [domainPlatform, setDomainPlatform] = useState("");
  const [domainEmail, setDomainEmail] = useState("");
  const [cloudflare, setCloudflare] = useState("");

  const [savedData, setSavedData] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const superCategory = localStorage.getItem("superCategory") || "natural";

const apiBase =
  superCategory === "casino"
    ? "casino/scraper"
    : superCategory === "dating"
    ? "dating/scraper"
    : "api/scraper"; //


  useEffect(() => {
    const fetchHostingInfo = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URI}/${apiBase}/hosting-info/${domain}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = res.data.hostingInfo || {};
        setPlatform(data.platform || "");
        setEmail(data.email || "");
        setServer(data.server || "");
        setDomainPlatform(data.domainPlatform || "");
        setDomainEmail(data.domainEmail || "");
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
    const data = {
      platform,
      email,
      server,
      domainPlatform,
      domainEmail,
      cloudflare,
    };

    try {
      setSaving(true);
      await axios.put(
        `${import.meta.env.VITE_API_URI}/${apiBase}/hosting-info/${domain}`,
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
      <div className="hosting-editor">
        {/* Hosting Info */}
        <div className="hosting-field">
          <label>Hosting Platform:</label>
          <input
            type="text"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="e.g. Hostinger, GoDaddy"
          />
        </div>
        <div className="hosting-field">
          <label>Hosting Mail:</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@host.com"
          />
        </div>
        <div className="hosting-field">
          <label>Hosting Server:</label>
          <input
            type="text"
            value={server}
            onChange={(e) => setServer(e.target.value)}
            placeholder="e.g. Apache, NGINX"
          />
        </div>

        {/* Domain Info */}
        <div className="hosting-field">
          <label>Domain Platform:</label>
          <input
            type="text"
            value={domainPlatform}
            onChange={(e) => setDomainPlatform(e.target.value)}
            placeholder="e.g. Namecheap"
          />
        </div>
        <div className="hosting-field">
          <label>Domain Mail:</label>
          <input
            type="text"
            value={domainEmail}
            onChange={(e) => setDomainEmail(e.target.value)}
            placeholder="support@domain.com"
          />
        </div>

        {/* Cloudflare Info */}
        <div className="hosting-field">
          <label>Cloudflare Info:</label>
          <input
            type="text"
            value={cloudflare}
            onChange={(e) => setCloudflare(e.target.value)}
            placeholder="Cloudflare status or config"
          />
        </div>

        <button className="save-hosting-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Hosting Info"}
        </button>
      </div>

      {/* Display Saved Info */}
      {(savedData.platform || savedData.email || savedData.cloudflare) && (
        <div className="saved-hosting-info">
          <p><strong>📦 Hosting Platform:</strong> {savedData.platform}</p>
          <p><strong>📧 Hosting Email:</strong> {savedData.email}</p>
          <p><strong>🖥️ Hosting Server:</strong> {savedData.server}</p>
          <p><strong>🌐 Domain Platform:</strong> {savedData.domainPlatform}</p>
          <p><strong>📨 Domain Email:</strong> {savedData.domainEmail}</p>
          <p><strong>☁️ Cloudflare:</strong> {savedData.cloudflare}</p>
        </div>
      )}
    </div>
  );
};

export default HostingInfoEditor;
