import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./UserTraffic.css";
import Layout from "../components/Layouts/Layout";

const UserTraffic = () => {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [locationStats, setLocationStats] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("todayTotal");
  const [notes, setNotes] = useState({});
  const [editingDomain, setEditingDomain] = useState(null);
  const [tempNote, setTempNote] = useState("");

  const [category, setCategory] = useState(
    localStorage.getItem("selectedCategory") || "traffic"
  );


  const fetchDomains = (cat) => {
    setLoadingDomains(true);
    const token = localStorage.getItem("token");
    axios.get(`${import.meta.env.VITE_API_URI}/${cat}/unique/domains`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
      .then((res) => {
        setDomains(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingDomains(false));
  };


  useEffect(() => {
    const handleCategoryChange = () => {
      const newCategory = localStorage.getItem("selectedCategory") || "traffic";
      setCategory(newCategory);
      fetchDomains(newCategory); // reload data automatically
    };
     window.addEventListener("categoryChange", handleCategoryChange);
    return () => window.removeEventListener("categoryChange", handleCategoryChange);
  }, []);

  const handleDomainClick = (domain) => {
    setSelectedDomain(domain);
    setLoadingStats(true);
    const token = localStorage.getItem("token");
    axios.get(`${import.meta.env.VITE_API_URI}/${category}/stats/domain/${domain}`,{
      headers: {
      Authorization: `Bearer ${token}`,
    },
    })
    
      .then((res) => {
        console.log("Location stats:", res.data); // debug
        setLocationStats(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingStats(false));
  };

    const filteredDomains = domains.filter((d) =>
    d.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

   const sortedDomains = [...filteredDomains].sort((a, b) => {
    if (sortOption === "todayTotal") {
      return b.todayTotal - a.todayTotal; 
    } else if (sortOption === "totalChangePercent") {
      return (b.totalChangePercent || 0) - (a.totalChangePercent || 0);
    } else if (sortOption === "uniqueChangePercent") {
      return (b.uniqueChangePercent || 0) - (a.uniqueChangePercent || 0);
    } else {
      return 0;
    }
  });

  const totalTraffic = sortedDomains.reduce((sum, d) => sum + Number(d.todayTotal ?? 0), 0);
const totalUniqueTraffic = sortedDomains.reduce((sum, d) => sum + Number(d.todayUnique ?? 0), 0);

const fetchNotes = () => {
  const token = localStorage.getItem("token");

  axios
    .get(`${import.meta.env.VITE_API_URI}/${category}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      const map = {};
      res.data.data.forEach((n) => {
        map[n.domain] = n.domainNote;
      });
      setNotes(map);
    })
    .catch((err) => console.error(err));
};

const saveNote = (domain) => {
  const token = localStorage.getItem("token");

   setNotes((prev) => ({
    ...prev,
    [domain]: tempNote,
  }));

  setEditingDomain(null);
  setTempNote("");

  axios
    .post(
      `${import.meta.env.VITE_API_URI}/${category}/notes/add`,
      {
        domain,
        notes: tempNote,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .catch((err) => {console.error(err); fetchNotes();} );
};

const deleteNote = (domain) => {
  const token = localStorage.getItem("token");

  setNotes((prev) => {
    const updated = { ...prev };
    delete updated[domain];
    return updated;
  });

  axios
    .delete(`${import.meta.env.VITE_API_URI}/${category}/notes/${domain}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .catch((err) => {
      console.error(err);
     fetchNotes();
    });
};

 useEffect(() => {
    fetchDomains(category);
    fetchNotes();
  }, [category]);

  return (
    <Layout>
      <div className="allmail-container">
        <h2>All Domains Traffic</h2>
         <div className="traffic-controls">
          <input
            type="text"
            className="domain-search"
            placeholder="Search domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="sort-dropdown"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="todayTotal">Today’s Traffic (High → Low)</option>
            <option value="totalChangePercent">Change (Views %)</option>
            <option value="uniqueChangePercent">Change (Unique %)</option>
          </select>
        </div>
        {loadingDomains ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading domains...</p>
          </div>
        ) : (
         <div className="table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Change (Views)</th>
                  <th>Change (Unique)</th>
                  <th>Today Traffic({totalTraffic})</th>
                  <th>Today Unique Traffic({totalUniqueTraffic})</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {sortedDomains.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", color: "#888" }}>
                      No domain data available
                    </td>
                  </tr>
                ) : (
                  sortedDomains.map((domain) => (
                    <tr
                      key={domain.domain}
                      onClick={() => handleDomainClick(domain.domain)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <Link to={`/traffic/${domain.domain}`}>{domain.domain}</Link>
                      </td>
                      <td
                        style={{
                          color:
                            domain.totalChangePercent === "N/A"
                              ? "gray"
                              : domain.totalChangePercent < 0
                              ? "red"
                              : "green",
                        }}
                      >
                        {typeof  domain.totalChangePercent !== "number"
                          ? `${domain.totalChangePercent}%`
                          : "N/A"}
                      </td>
                      <td
                        style={{
                          color:
                            domain.uniqueChangePercent === "N/A"
                              ? "gray"
                              : domain.uniqueChangePercent < 0
                              ? "red"
                              : "green",
                        }}
                      >
                        {typeof domain.uniqueChangePercent !== undefined
                          ? `${domain.uniqueChangePercent}%`
                          : "N/A"}
                      </td>
                      <td>{domain.todayTotal}</td>
                      <td>{domain.todayUnique}</td>
                      <td>
                        {editingDomain === domain.domain ? (
                          <div className="note-edit">
                            <input
                              type="text"
                              value={tempNote}
                              onChange={(e) => setTempNote(e.target.value)}
                              placeholder="Write note..."
                            />

                            <button
                              className="note-save"
                              onClick={(e) => {
                                e.stopPropagation();
                                saveNote(domain.domain);
                              }}
                            >
                              <i class="fa-solid fa-check"></i>
                            </button>

                            <button
                              className="note-cancel"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingDomain(null);
                                setTempNote("");
                              }}
                            >
                              <i class="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        ) : notes[domain.domain] ? (
                          <div className="note-display">
                            <span>{notes[domain.domain]}</span>

                            <button
                              className="note-update"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingDomain(domain.domain);
                                setTempNote(notes[domain.domain]);
                              }}
                            >
                              <i className="fa-solid fa-pencil"></i>
                            </button>

                            <button
                              className="note-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNote(domain.domain);
                              }}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        ) : (
                          <button
                            className="note-add"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDomain(domain.domain);
                              setTempNote("");
                            }}
                          >
                            Add Note
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserTraffic;