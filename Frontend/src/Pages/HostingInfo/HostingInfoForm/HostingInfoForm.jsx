import { useState } from "react";
import axios from "axios";

import "./HostingInfoForm.css"
import { handleError, handleSuccess } from "../../../toastutils";

export default function HostingInfoForm({ domain }) {
  const [formData, setFormData] = useState({
    platform: "",
    email: "",
    server: "",
    hostingIssueDate: "",
  });

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
       await axios.post(`${import.meta.env.VITE_API_URI}/api/hosting/add-hostingInfo`, formData, {
              headers: { Authorization: `Bearer ${token}` }
            });
      handleSuccess("Hosting info updated");
    } catch (err) {
      handleError(err.response?.data?.message || "Error updating hosting info");
    }
  };

  return (
   <div className="hi-page">
  <div className="hi-card hi-appear">
    <h2 className="hi-title">Add / Update Hosting Info</h2>

    <form className="hi-form" onSubmit={handleSubmit}>
      <input className="hi-input" name="platform" placeholder="Platform" value={formData.platform} onChange={handleChange} />
      <input className="hi-input" name="email" type="email" placeholder="Platform Email" value={formData.email} onChange={handleChange} />
      <input className="hi-input" name="server" placeholder="Server" value={formData.server} onChange={handleChange} />
      <input className="hi-input" name="hostingIssueDate" type="date" placeholder="Hosting Issue Date" value={formData.hostingIssueDate || ""} onChange={handleChange} />
      <button className="hi-btn" type="submit">Save Hosting Info</button>
    </form>
  </div>
</div>
  );
}
