import { useState, useEffect } from "react";
import "./CreateLink.css";
import Layout from "../components/Layouts/Layout";
import { createShortLink, getAllFolders } from "../api";
import { FaRegTrashCan, FaPlus, FaLink } from "react-icons/fa6";
import { handleError, handleSuccess } from "../utils/toastutils";

export default function CreateLink() {
  const [isChainMode, setIsChainMode] = useState(false);
  const [domains, setDomains] = useState([""]);
  const [singleDomain, setSingleDomain] = useState("");

  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [customFolderVisible, setCustomFolderVisible] = useState(false);
  const [customFolderName, setCustomFolderName] = useState("");

  const [chainNote, setChainNote] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const data = await getAllFolders();
        setFolders(data);
      } catch (err) {
        console.log(err);
      }
    };
    loadFolders();
  }, []);

  const handleFolderSelect = (value) => {
    setSelectedFolder(value);

    if (value === "__custom__") {
      setCustomFolderVisible(true);
    } else {
      setCustomFolderVisible(false);
      setCustomFolderName("");
    }
  };

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
          handleError("Please enter a URL.");
          setLoading(false);
          return;
        }
        urls = [singleDomain.trim()];
      }
      const payload = {
        urls,
        chainNote: isChainMode ? chainNote.trim() : null,
        folderName:
          selectedFolder === "__custom__"
            ? customFolderName.trim()
            : selectedFolder || null,
      };

      const data = await createShortLink(payload);
      setGeneratedLinks(data);

      // reset
      setDomains([""]);
      setSingleDomain("");
      setChainNote("");
      setSelectedFolder("");
      setCustomFolderName("");
      setCustomFolderVisible(false);

      handleSuccess("Created successfully!");

    } catch (err) {
      console.log(err);
      handleError("Something went wrong.");
    }

    setLoading(false);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    handleSuccess("Copied!");
  };

  return (
    <Layout>
      <div className="link-wrapper">
        <div className="form-section">
          <h2>
            <FaLink />
            {isChainMode ? " Create Domain Chain" : " Create Single Link"}
          </h2>

          {/* Toggle */}
          <label className="mode-toggle">
            <input
              type="checkbox"
              checked={isChainMode}
              onChange={() => setIsChainMode(!isChainMode)}
            />
            Chain Mode
          </label>

          <form onSubmit={handleCreate}>   
            {!isChainMode && (
              <>
                <h4 style={{ margin: "10px 0 5px" }}>Select Folder</h4>

                <select
                  className="folder-select"
                  value={selectedFolder}
                  onChange={(e) => handleFolderSelect(e.target.value)}
                >
                  <option value="">Create or Select Folder</option>
                  <option value="__custom__">➕ Add Custom Folder</option>
                  {folders.map((name, i) => (
                    <option key={i} value={name}>
                      {name}
                    </option>
                  ))}

                  
                </select>

                <h4 style={{ margin: "10px 0 5px" }}>Enter Domain</h4>
                {customFolderVisible && (
                  <input
                    className="folder-input"
                    type="text"
                    placeholder="Enter new folder name"
                    value={customFolderName}
                    onChange={(e) => setCustomFolderName(e.target.value)}
                    required
                  />
                )}
              </>
            )}

            {/* ---------------- Chain Mode ---------------- */}
            {isChainMode ? (
              <>
                <div className="domain-input-row">
                  <input
                    type="text"
                    placeholder="Main Domain for this Chain"
                    value={chainNote}
                    onChange={(e) => setChainNote(e.target.value)}
                  />
                </div>

                {domains.map((domain, index) => (
                  <div className="domain-input-row" key={index}>
                    <input
                      type="url"
                      placeholder={`Domain ${index + 1}`}
                      value={domain}
                      onChange={(e) =>
                        setDomains(
                          domains.map((d, i) => (i === index ? e.target.value : d))
                        )
                      }
                      required
                    />

                    {domains.length > 1 && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => setDomains(domains.filter((_, i) => i !== index))}
                      >
                        <FaRegTrashCan />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="add-btn"
                  onClick={() => setDomains([...domains, ""])}
                >
                  <FaPlus /> Add Domain
                </button>
              </>
            ) : (
              <div className="domain-input-row">
                <input
                  type="url"
                  placeholder="Enter domain URL"
                  value={singleDomain}
                  onChange={(e) => setSingleDomain(e.target.value)}
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

        {/* ================= GENERATED LINKS ================= */}
        <div className="links-section">
          <h3>Generated Links</h3>

          {!generatedLinks.length ? (
            <p className="empty-text">No links created yet.</p>
          ) : (
            <ul>
              {generatedLinks.map((item, index) => (
                <li key={index}>
                  <p>{item.originalUrl}</p>

                  <div>
                    <a href={item.shortUrl} target="_blank">
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
