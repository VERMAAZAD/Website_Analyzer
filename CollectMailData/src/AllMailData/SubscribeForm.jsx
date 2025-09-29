import { useState } from "react";
import { handleSuccess, handleError } from "../utils/toastutils";

const SubscribeForm = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URI}/collectmail/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        handleSuccess(data.message);
        setFormData({ name: "", email: "" });
      } else {
        handleError(data.message || "Subscription failed");
      }
    } catch (err) {
      handleError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="subscribe-form">
      <h2>Subscribe</h2>

      <label>Name</label>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Your Name"
        required
      />

      <label>Email</label>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="you@example.com"
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Subscribe"}
      </button>
    </form>
  );
};

export default SubscribeForm;
