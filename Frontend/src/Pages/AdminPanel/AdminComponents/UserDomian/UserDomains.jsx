import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Layout from '../Layouts/Layout';
import './UserDomains.css';

const CATEGORY_OPTIONS = ['All', 'natural', 'casino', 'dating'];

const UserDomains = () => {  
const { userId } = useParams();
const [searchParams] = useSearchParams();
const name = searchParams.get('name');
  const [domains, setDomains] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true); // 🟡 Add loading state

  const token = localStorage.getItem('token');


  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setLoading(true); // ⏳ Start loading
        const res = await axios.get(
          `${import.meta.env.VITE_API_URI}/admin/user/${userId}/domains`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const allDomains = res.data;

        // Sort: non-200 status first
        const sorted = [
          ...allDomains.filter(d => d.statusCode !== 200),
          ...allDomains.filter(d => d.statusCode === 200),
        ];

        setDomains(sorted);
      } catch (err) {
        console.error('Error fetching user domains:', err);
      } finally {
        setLoading(false); // ✅ Stop loading regardless of outcome
      }
    };

    fetchDomains();
  }, [userId, token]);

  const filteredDomains =
    filter === 'All' ? domains : domains.filter(d => d.superCategory === filter);

  return (
    <Layout>
      <div className="user-domains-page">
        <h2>Domains of {decodeURIComponent(name)}</h2>

        <div className="filter-buttons">
          {CATEGORY_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`filter-btn ${filter === opt ? 'active' : ''}`}
              onClick={() => setFilter(opt)}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : filteredDomains.length === 0 ? (
          <p>No domains found.</p>
        ) : (
          <ul className="domain-list">
            {filteredDomains.map(domain => (
              <li
                key={domain._id}
                className={`domain-item ${domain.statusCode !== 200 ? 'error' : ''}`}
              >
                <span className="url">{domain.domain}</span>
                <span className="status">Status: {domain.statusCode}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
};

export default UserDomains;
