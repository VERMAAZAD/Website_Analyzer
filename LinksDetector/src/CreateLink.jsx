import { useState } from "react";
import { createShortLink } from "./api";

export default function CreateLink() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await createShortLink(url);
      setShortUrl(data.shortUrl);
  };

  return (
    <div style={{ width: "400px", margin: "auto" }}>
      <h2>Create Short Link</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="Enter URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          style={{
            width: "100%", padding: "10px", marginBottom: "10px"
          }}
        />
        <button
          style={{ width: "100%", padding: "10px" }}
          type="submit"
        >
          Generate
        </button>
      </form>

      {shortUrl && (
        <p>
          Short URL: <a href={shortUrl} target="_blank">{shortUrl}</a>
        </p>
      )}
    </div>
  );
}
