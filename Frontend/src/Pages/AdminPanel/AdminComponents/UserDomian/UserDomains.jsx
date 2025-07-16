// File: AdminPanel/UserDomains.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Layout from '../Layouts/Layout';
import './UserDomains.css';

const UserDomains = () => {
  const { id, name } = useParams();
  const [domains, setDomains] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/admin/user/${id}/domains`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allDomains = res.data;

        // ✅ Sort: show non-200 domains first
        const sorted = [
          ...allDomains.filter(d => d.statusCode !== 200),
          ...allDomains.filter(d => d.statusCode === 200),
        ];
        setDomains(sorted);
      } catch (err) {
        console.error('Error fetching user domains:', err);
      }
    };

    fetchDomains();
  }, [id, token]);

  return (
    <Layout>
      <div className="user-domains-page">
        <h2>Domains of {decodeURIComponent(name)}</h2>

        {domains.length === 0 ? (
          <p>No domains found.</p>
        ) : (
          <ul className="domain-list">
            {domains.map((domain) => (
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
