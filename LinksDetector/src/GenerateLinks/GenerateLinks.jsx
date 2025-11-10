import React, { useState } from "react";
import Layout from "../components/Layouts/Layout";
import { createLink, getStats } from "../api";
import LinkForm from "./LinkForm";
import LinkResults from "./LinkResults";
import "./GenerateLinks.css";

const GenerateLinks = () => {
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [linkId, setLinkId] = useState("");

  const handleCreateLink = async (payload) => {
    const data = await createLink(payload);
    setResult(data);
    setLinkId(data.linkId);
  };

  const handleFetchStats = async () => {
    if (!linkId) return alert("No linkId found");
    const s = await getStats(linkId);
    setStats(s);
  };

  return (
    <Layout>
      <div className="generate-links-wrapper">
        <div className="left-panel">
          <LinkForm onCreate={handleCreateLink} />
        </div>
        <div className="right-panel">
          <LinkResults result={result} stats={stats} onFetchStats={handleFetchStats} />
        </div>
      </div>
    </Layout>
  );
};

export default GenerateLinks;
