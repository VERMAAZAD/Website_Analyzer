// components/EditDomainName/EditDomainName.jsx
import React, { useState } from "react";
import axios from "axios";
import "./EditDomainName.css";
import { handleError, handleSuccess } from "../../../toastutils";

const EditDomainName = ({ domain, onClick, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newDomain, setNewDomain] = useState(domain);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!newDomain.trim()) {
      alert("Please enter a valid domain name.");
      return;
    }

    if (newDomain === domain) {
      setIsEditing(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${import.meta.env.VITE_API_URI}/api/scraper/update-domain-name`,
        { oldDomain: domain, newDomain },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      handleSuccess(response.data.message);
      setIsEditing(false);
      onUpdate(domain, newDomain);
      
    } catch (err) {
      handleError( err.response?.data?.message || "Failed to update domain");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewDomain(domain);
  };

  return (
    <div className="edit-domain-container">
      {isEditing ? (
        <>
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="edit-domain-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            autoFocus
          />
          <button
            className="edit-save-btn"
            onClick={handleSave}
            disabled={loading}
            title="Save"
          >
            {loading ? "..." : "💾"}
          </button>
          <button
            className="edit-cancel-btn"
            onClick={handleCancel}
            title="Cancel"
          >
            ❌
          </button>
        </>
      ) : (
        <>
          <span
            className="domain-text"
            onClick={() => onClick && onClick(domain)}
          >
            {domain}
          </span>
          <button
            className="edit-btn"
            title="Edit Domain"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering parent click
              setIsEditing(true);
            }}
          >
            ✏️
          </button>
        </>
      )}
    </div>
  );
};

export default EditDomainName;
