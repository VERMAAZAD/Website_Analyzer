import React from "react";
import { Navigate } from "react-router-dom";
import { getRole } from "../../utils/auth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const role = getRole();

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;