import React, { useState, useEffect } from "react";
import { createLink, getBaseDomains } from "../api";
import "./LinkForm.css";

const LinkForm = ({ selectedDomain, setSelectedDomain, onCreate }) => {
  const [target, setTarget] = useState("");
  const [chain, setChain] = useState([{ url: "" }]);
  const [isChain, setIsChain] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch base domains from backend
  const [domains, setDomains] = useState([]);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const domains = await getBaseDomains();
        if (domains.length > 0) {
          setDomains(domains);
          setSelectedDomain(domains[0].baseUrl); // Default to first domain
        }
      } catch (err) {
        console.error("Error loading domains:", err);
      }
    };
    fetchDomains();
  }, [setSelectedDomain]); // Ensure setSelectedDomain is available

  // Handle link creation
  const handleCreate = async () => {
    try {
      setLoading(true);
      let payload;

      if (!selectedDomain) throw new Error("Select a base domain first");

      if (isChain) {
        const validChain = chain
          .map((c) => c.url.trim())
          .filter((url) => url.length > 0)
          .map((url, i) => ({ order: i + 1, url }));

        if (validChain.length === 0) throw new Error("Add at least one chain URL");

        payload = { domain: selectedDomain, chain: validChain };
      } else {
        if (!target.trim()) throw new Error("Target URL required");
        payload = { domain: selectedDomain, target: target.trim() };
      }

      const response = await createLink(payload);
      if (onCreate) onCreate(response); // Send the created link data to parent component
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle chain URL change
  const handleChainChange = (i, value) => {
    const updated = [...chain];
    updated[i].url = value;
    setChain(updated);
  };

  return (
    <div className="card link-form">
      <h2>🔗 Generate Tracking Link</h2>

      {/* Domain Selection */}
      <div className="domain-section">
        <label htmlFor="domain">Select Domain</label>
        <select
          id="domain"
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
        >
          {domains.map((d) => (
            <option key={d._id} value={d.baseUrl}>
              {d.baseUrl}
            </option>
          ))}
        </select>
      </div>

      {/* Chain Checkbox */}
      <div className="checkbox-container">
        <input
          id="chain-toggle"
          type="checkbox"
          checked={isChain}
          onChange={() => setIsChain(!isChain)}
        />
        <label htmlFor="chain-toggle" className="checkbox-label">
          Enable Chain (Multi-step Redirects)
        </label>
      </div>

      {/* URL Inputs */}
      {!isChain ? (
        <input
          placeholder="Enter Target URL (https://example.com)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
      ) : (
        <>
          {chain.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                style={{ flex: 1 }}
                placeholder={`Step ${i + 1} URL`}
                value={step.url}
                onChange={(e) => handleChainChange(i, e.target.value)}
              />
              {chain.length > 1 && (
                <button
                  onClick={() => setChain(chain.filter((_, idx) => idx !== i))}
                  style={{ width: 40, background: "#e74c3c", color: "#fff" }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setChain([...chain, { url: "" }])}>+ Add Step</button>
        </>
      )}

      <button onClick={handleCreate} disabled={loading}>
        {loading ? "Creating..." : "Create Link"}
      </button>
    </div>
  );
};

export default LinkForm;
