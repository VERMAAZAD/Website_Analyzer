import React, { useEffect, useState } from "react";
import "./AllmailData.css";
import Layout from "../components/Layouts/Layout";

const AllmailData = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState(
    localStorage.getItem("selectedCategory") || "traffic"
  );

  // 🧩 Map frontend category → backend category
  const categoryMap = {
    traffic: "dating",
    adswebsite: "adswebsite",
    natural: "natural",
    casinotraffic: "casino",
  };

  const fetchUsers = async (selectedCategory = category) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Unauthorized");
        setLoading(false);
        return;
      }

      // Map frontend → backend category name
      const backendCategory = categoryMap[selectedCategory] || "dating";

      const res = await fetch(
        `${import.meta.env.VITE_API_URI}/collectmail/users?category=${backendCategory}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setError(data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Listen for category changes (triggered from Header)
  useEffect(() => {
    const handleCategoryChange = () => {
      const selected = localStorage.getItem("selectedCategory") || "traffic";
      setCategory(selected);
      fetchUsers(selected);
    };

    window.addEventListener("categoryChange", handleCategoryChange);

    // Initial load
    fetchUsers(category);

    return () => window.removeEventListener("categoryChange", handleCategoryChange);
  }, []);

  return (
    <Layout>
      <div className="allmail-container">
        <h2>
          All Subscribed Users{" "}
          <span style={{ color: "#777", fontSize: "0.8em" }}>
            ({category.toUpperCase()} category)
          </span>
        </h2>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <p className="error">{error}</p>
        ) : users.length === 0 ? (
          <p className="no-data">No data found for this category</p>
        ) : (
          <div className="table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Landing Page</th>
                  <th>User IP</th>
                  <th>User Country</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.landingPageUrl}</td>
                    <td>{user.ip || ""}</td>
                    <td>{user.geo?.country || ""}</td>
                    <td>{new Date(user.createdAt).toLocaleString()}</td>
                    <td>
                      <button
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this user?")) {
                            const token = localStorage.getItem("token");
                            await fetch(
                              `${import.meta.env.VITE_API_URI}/collectmail/users/${user._id}`,
                              {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              }
                            );
                            setUsers(users.filter((u) => u._id !== user._id));
                          }
                        }}
                        style={{ color: "red", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AllmailData;
