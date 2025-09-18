import React, { useState } from "react";
import "./ReferenceForm.css";

function ReferenceForm() {
  const [formData, setFormData] = useState({ domain: "", affiliate: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("http://localhost:5000/domain-ref/create-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setSuccessMsg(`✅ Reference created: ${data.reference.domain} → ${data.reference.affiliate}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Domain → Affiliate Flow</h2>
      <form onSubmit={handleSubmit} className="domain-form">
        <div className="form-group">
          <label htmlFor="domain">Domain Name</label>
          <input
            type="url"
            id="domain"
            name="domain"
            value={formData.domain}
            onChange={handleChange}
            placeholder="https://example.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="affiliate">Affiliate Link</label>
          <input
            type="url"
            id="affiliate"
            name="affiliate"
            value={formData.affiliate}
            onChange={handleChange}
            placeholder="https://affiliate.com/track"
            required
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Processing..." : "Submit & Open"}
        </button>
      </form>

      {error && <p className="error-msg">{error}</p>}
      {successMsg && <p className="success-msg">{successMsg}</p>}
    </div>
  );
}

export default ReferenceForm;
