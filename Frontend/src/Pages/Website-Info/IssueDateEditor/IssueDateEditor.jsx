import React, { useState } from "react";
import axios from "axios";
import "./IssueDateEditor.css";

function IssueDateEditor({ domain, currentIssueDate, onSave }) {
  const superCategory = localStorage.getItem("superCategory") || "natural";
  const apiBase =
    superCategory === "casino"
      ? "casino/scraper"
      : superCategory === "dating"
      ? "dating/scraper"
      : "api/scraper";

  const toInputValue = (date) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const [value, setValue]     = useState(toInputValue(currentIssueDate));
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URI}/${apiBase}/issue-date/${domain}`,
        { issueDate: value || null },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setSuccess("Saved!");
      setTimeout(() => setSuccess(""), 2000);
      onSave(res.data.issueDate);
    } catch {
      setError("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setValue("");
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URI}/${apiBase}/issue-date/${domain}`,
        { issueDate: null },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setSuccess("Cleared!");
      setTimeout(() => setSuccess(""), 2000);
      onSave(null);
    } catch {
      setError("Failed to clear.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="issue-date-editor">
      <span className="issue-date-label">Issue Date:</span>
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="issue-date-input"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="issue-date-save-btn"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {value && (
        <button
          onClick={handleClear}
          disabled={saving}
          className="issue-date-clear-btn"
        >
          Clear
        </button>
      )}
      {error   && <span className="issue-date-error">{error}</span>}
      {success && <span className="issue-date-success">{success}</span>}
    </div>
  );
}

export default IssueDateEditor;