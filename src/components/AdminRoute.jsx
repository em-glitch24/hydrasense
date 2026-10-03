// src/components/AdminRoute.jsx - NEW COMPONENT
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AdminRoute({ children }) {
  const { currentUser, isAdmin } = useAuth();

  // If not logged in, redirect to admin login
  if (!currentUser) {
    return <Navigate to="/admin/login" />;
  }

  // If logged in but not admin, redirect to admin login with error
  if (!isAdmin) {
    console.log("❌ Access denied: User is not an admin");
    return <Navigate to="/admin/login" />;
  }

  // User is authenticated and is admin
  return children;
}
