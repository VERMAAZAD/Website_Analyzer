import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layouts/Layout";
import "./LinkDetails.css";

const LinkDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/clockar/api/links/${id}/stats`);
        setData(res.data);
      } catch (err) {
        console.error("Error fetching link stats:", err);
      }
    };
    fetchData();
  }, [id]);

  if (!data)
    return (
      <Layout>
        <p className="loading">Loading link details...</p>
      </Layout>
    );

  return (
    <Layout>
      <div className="link-details-container">
        <h2 className="link-details-title">🔗 Link Analytics</h2>
        <p className="link-details-subtitle">ID: {data.linkId}</p>

        <div className="link-meta">
          <p>
            <strong>Target:</strong> {data.target}
          </p>
          <p>
            <strong>Created:</strong> {new Date(data.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="chain-section">
          <h3 className="chain-title">Chain Progress</h3>
          <ul className="chain-list">
            {data.chain && data.chain.length > 0 ? (
              data.chain.map((step) => (
                <li key={step.order} className="chain-step-item">
                  <div className="chain-step-left">
                    <span className="chain-step-number">{step.order}</span>
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chain-step-link"
                    >
                      {step.domain}
                    </a>
                  </div>
                  <span className="chain-step-clicks">
                    {step.clicks || 0} clicks
                  </span>
                </li>
              ))
            ) : (
              <li>No chain data available.</li>
            )}
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default LinkDetails;
