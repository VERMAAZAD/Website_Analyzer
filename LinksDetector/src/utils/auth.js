export const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload; 
  } catch (err) {
    console.error("Token decode failed", err);
    return null;
  }
};

// Extract just the role
export const getRole = () => {
  const user = getUserFromToken();
  return user?.role || null;
};
