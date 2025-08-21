import { useState } from "react";
import axios from "axios";

import "./HostingInfoForm.css"
import { handleError, handleSuccess } from "../../../toastutils";

export default function HostingInfoForm({ domain }) {
  const [formData, setFormData] = useState({
    platform: "",
    email: "",
    server: "",
    ServerExpiryDate: "",
  });

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

const handleSubmit = async e => {
  e.preventDefault();
  try {
    const token = localStorage.getItem("token");
    await axios.post(`${import.meta.env.VITE_API_URI}/api/hosting/add-hostingInfo`, formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    handleSuccess("Hosting info added");
  } catch (err) {
    const msg = err.response?.data?.message || "Please Check All Field";
    handleError(msg);

    if (err.response?.data?.existing) {
      const { email, platform, server } = err.response.data.existing;
      alert(`❌ Server already exists!\n\nServer: ${server}\nPlatform: ${platform}\nEmail: ${email}`);
    }
  }
};


  return (
   <div className="hi-page">
  <div className="hi-card hi-appear">
    <h2 className="hi-title">Add Hosting Info</h2>
  <form className="hi-form" onSubmit={handleSubmit}>
  <div className="hi-form-group">
    <label className="hi-label" htmlFor="platform">Platform</label>
    <input id="platform" className="hi-input" name="platform" value={formData.platform} onChange={handleChange} required/>
  </div>

  <div className="hi-form-group">
    <label className="hi-label" htmlFor="email">Platform Email</label>
    <input id="email" className="hi-input" type="email" name="email" value={formData.email} onChange={handleChange} required/>
  </div>

  <div className="hi-form-group">
    <label className="hi-label" htmlFor="server">Server</label>
    <input id="server" className="hi-input" name="server" value={formData.server} onChange={handleChange} required/>
  </div>

  <div className="hi-form-group">
    <label className="hi-label" htmlFor="ServerExpiryDate">Server Expiry Date</label>
    <input id="ServerExpiryDate" className="hi-input" type="date" name="ServerExpiryDate" value={formData.ServerExpiryDate || ""} onChange={handleChange} required/>
  </div>

  <button className="hi-btn-form" type="submit">Save Hosting Info</button>
</form>

  </div>
</div>
  );
}
