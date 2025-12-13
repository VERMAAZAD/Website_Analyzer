import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getRole } from "../../utils/auth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [checkingSSO, setCheckingSSO] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Already authenticated
    if (token) {
      setCheckingSSO(false);
      return;
    }

    // Look for SSO token
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get("ssoToken");

    if (!ssoToken) {
      setCheckingSSO(false);
      return;
    }

    fetch(`${import.meta.env.VITE_API_URI}/ssoauth/sso-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ssoToken }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          localStorage.setItem("token", data.jwtToken);
          localStorage.setItem("ssoToken", data.ssoToken); // 🔥 FIX
          localStorage.setItem("loggedInUser", JSON.stringify(data.user));

          // Clean URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }
      })
      .finally(() => setCheckingSSO(false));
  }, []);

  // Still validating SSO
  if (checkingSSO) {
    return <div>Checking authentication...</div>;
  }

  // Not authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Role check
  const role = getRole();
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
