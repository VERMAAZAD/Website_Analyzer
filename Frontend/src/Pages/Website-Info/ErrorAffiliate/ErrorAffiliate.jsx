import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ErrorAffiliate.css";

const ErrorAffiliate = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const category = params.get("category");

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [total, setTotal] = useState(0);

  const token = localStorage.getItem("token");
  const superCategory = localStorage.getItem("superCategory") || "natural";

  const apiBase =
    superCategory === "casino"
      ? "casino/scraper"
      : superCategory === "dating"
      ? "dating/scraper"
      : "api/scraper";

  const fetchErrors = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/affiliate-mismatch`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { category },
        }
      );

      setErrors(res.data.errors || []);
      setTotal(res.data.mismatchCount || 0);
    } catch (err) {
      console.error("Failed to load affiliate errors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, [category]);

  return (
      <section className="affiliate-errors">
        <div className="page-header">

          <h2>
            Affiliate Mismatch Errors
            {category && <span> — {category}</span>}
          </h2>

          <p className="count-info">
            Total Mismatches: <strong>{total}</strong>
          </p>
        </div>

        {loading ? (
          <p>Loading affiliate mismatches...</p>
        ) : errors.length === 0 ? (
          <p className="empty-state">🎉 No affiliate mismatches found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="error-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Domain</th>
                  <th>Page Affiliate</th>
                  <th>Category Affiliate</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((item, index) => (
                  <tr key={item._id || index}>
                    <td>{index + 1}</td>
                    <td className="domain">{item.domain}</td>
                    <td className="bad-link">{item.affiliateLink}</td>
                    <td className="good-link">
                      {item.categoryAffiliateLink}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
  );
};

export default ErrorAffiliate;
