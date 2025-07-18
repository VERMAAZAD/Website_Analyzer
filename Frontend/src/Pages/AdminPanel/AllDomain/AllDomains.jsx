import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AllDomains.css';
import Layout from '../AdminComponents/Layouts/Layout';

const AllDomains = () => {
  const [domains, setDomains] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URI}/admin/scraped-data`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setDomains(res.data));
  }, []);

  return (
    <Layout>
    <div className="all-domains">
      <h2>All Scraped Domains</h2>
      <ul>
        {domains.map((site, index) => (
          <li key={index}>{site.domain} - {site.statusCode}</li>
        ))}
      </ul>
    </div>
    </Layout>
  );
};

export default AllDomains;