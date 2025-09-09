import React, { useState } from "react";
import axios from "axios";
import "./CommentBot.css";
import { handleError, handleSuccess } from "../../toastutils";

function CommentBot() {
  const [domains, setDomains] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleRunBot = async () => {
    if (!domains || !name || !email || !comment) {
      handleError("All required fields must be filled");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // JWT from login

      const res = await axios.post(
        `${import.meta.env.VITE_API_URI}/commenting/run-bot`,
        {
          domains: domains.split("\n").map((d) => d.trim()).filter(Boolean),
          name,
          email,
          website,
          comment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResults(res.data.results || []);
      handleSuccess("Bot executed successfully");
    } catch (err) {
      handleError(err.response?.data?.message || "Error running bot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comment-panel">
      <h2>💬 Comment Bot Panel</h2>

      <textarea
        placeholder="Enter domains (one per line)"
        value={domains}
        onChange={(e) => setDomains(e.target.value)}
      />

      <input
        type="text"
        placeholder="Your Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Your Email *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="text"
        placeholder="Your Website (optional)"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />

      <textarea
        placeholder="Your Comment *"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button onClick={handleRunBot} disabled={loading}>
        {loading ? "Running..." : "Run Comment Bot"}
      </button>

      {results.length > 0 && (
        <div className="results">
          <h3>Results</h3>
          <ul>
            {results.map((r, idx) => (
              <li key={idx} className={r.status}>
                <strong>{r.domain}</strong> →{" "}
                {r.status === "success" ? "✅ Success" : `❌ Failed (${r.error})`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CommentBot;
