import { useState } from "react";
import "./CreateLink.css";
import Layout from "../components/Layouts/Layout";
import { createShortLink } from "../api";
import { FaRegTrashCan, FaPlus, FaLink } from "react-icons/fa6";
import { handleError, handleSuccess } from "../utils/toastutils";

export default function CreateLink() {
  const [isChainMode, setIsChainMode] = useState(false);
  const [domains, setDomains] = useState([""]);
  const [singleDomain, setSingleDomain] = useState("");
  const [chainNote, setChainNote] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  // ---------------- Chain Mode Handlers ----------------
  const addDomainField = () => setDomains([...domains, ""]);
  const removeDomainField = (index) =>
    setDomains(domains.filter((_, i) => i !== index));
  const updateDomainValue = (index, value) => {
    const updated = [...domains];
    updated[index] = value;
    setDomains(updated);
  };

  // ---------------- Single Mode Handler ----------------
  const updateSingleDomain = (value) => setSingleDomain(value);

  // ---------------- Create Links ----------------
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let urls = [];

      if (isChainMode) {
        urls = domains.map((d) => d.trim()).filter(Boolean);
        if (urls.length < 2) {
          handleError("Add at least 2 domains to create a chain.");
          setLoading(false);
          return;
        }
      } else {
        if (!singleDomain.trim()) {
          handleError("Please enter a URL to create a short link.");
          setLoading(false);
          return;
        }
        urls = [singleDomain.trim()];
      }

      // Payload for backend
      const payload = {
        urls,
        chainNote: isChainMode ? chainNote.trim() || null : null,
      };

      const data = await createShortLink(payload);
      setGeneratedLinks(data);

      // Reset fields
      if (isChainMode) {
        setDomains([""]);
        setChainNote("");
      } else {
        setSingleDomain("");
      }
    } catch (err) {
      console.error(err);
      handleError("Error creating link(s).");
    }

    setLoading(false);
  };

  // ---------------- Copy Function ----------------
  const copy = (text) => {
    navigator.clipboard.writeText(text);
    handleSuccess("Copied!");
  };

  return (
    <Layout>
      <div className="link-wrapper fade-in">
        <div className="form-section">
          <h2>
            <FaLink /> Create {isChainMode ? "Domain Chain" : "Single Link"}
          </h2>

          {/* Toggle Mode */}
          <label className="mode-toggle">
            <input
              type="checkbox"
              checked={isChainMode}
              onChange={() => setIsChainMode(!isChainMode)}
            />
            {" "}Chain Mode
          </label>

          <form onSubmit={handleCreate}>
            {isChainMode ? (
              <>
                <div className="domain-input-row">
                  <input
                    type="text"
                    placeholder="Add Main Web Domain for this chain"
                    value={chainNote}
                    onChange={(e) => setChainNote(e.target.value)}
                    required
                  />
                </div>
                {domains.map((domain, index) => (
                  <div key={index} className="domain-input-row">
                    <input
                      type="url"
                      placeholder={`Domain ${index + 1}`}
                      value={domain}
                      onChange={(e) => updateDomainValue(index, e.target.value)}
                      required
                    />
                    {domains.length > 1 && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeDomainField(index)}
                      >
                        <FaRegTrashCan />
                      </button>
                    )}
                  </div>
                ))}

                <button type="button" className="add-btn" onClick={addDomainField}>
                  <FaPlus /> Add Domain
                </button>
              </>
            ) : (
              <div className="domain-input-row">
                <input
                  type="url"
                  placeholder="Enter domain URL"
                  value={singleDomain}
                  onChange={(e) => updateSingleDomain(e.target.value)}
                  required
                />
              </div>
            )}

            <button type="submit" disabled={loading}>
              {loading
                ? isChainMode
                  ? "Creating Chain..."
                  : "Creating Link..."
                : isChainMode
                ? "Create Chain"
                : "Create Link"}
            </button>
          </form>
        </div>

        {/* ------------ Generated Links ------------ */}
        <div className="links-section">
          <h3>Generated {isChainMode ? "Chain Links" : "Link"}</h3>

          {!generatedLinks.length ? (
            <p className="empty-text">
              No {isChainMode ? "chain created yet." : "link created yet."}
            </p>
          ) : (
            <ul>
              {generatedLinks.map((item, index) => (
                <li key={index}>
                  <p>{item.originalUrl}</p>
                  <div>
                    <a
                      href={item.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.shortUrl}
                    </a>

                    <button onClick={() => copy(item.shortUrl)}>📋 Copy</button>

                    {isChainMode && item.chainNextSlug && (
                      <span className="chain-arrow">
                        ➡️ Next: {item.chainNextSlug}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
