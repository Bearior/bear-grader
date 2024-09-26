import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';  // Import Firebase Auth instance

const PrivateRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>;  // Show a loading indicator while Firebase checks auth status
  }

  return user ? children : <Navigate to="/login" />;  // Redirect to login if not authenticated
};

export default PrivateRoute;
