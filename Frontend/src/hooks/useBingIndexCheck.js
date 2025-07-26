import { useEffect, useState } from "react";
import axios from "axios";

const useBingIndexCheck = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUnindexed = async () => {
      const token = localStorage.getItem("token");

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URI}/api/scraper/index-check`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setDomains(res.data.unindexed || []);
      } catch (err) {
        console.error("Error fetching unindexed domains:", err);
        setError("Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUnindexed();
  }, []);

  return { domains, loading, error };
};

export default useBingIndexCheck;
