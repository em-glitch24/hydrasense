// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();

  // If not logged in, redirect to login page
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // User is authenticated, render the protected component
  return children;
}
