import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ProblemList from './components/Problemlists';
import ProblemDetails from './components/ProblemDetails';
import AuthSystem from './Authsystem';
import PrivateRoute from './Privateroute';  // Import the PrivateRoute component
import Login from './login';  // Import Login component
import Signup from './signup'; 

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public route for login */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <ProblemList />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/problem/:id" 
          element={
            <PrivateRoute>
              <ProblemDetails />
            </PrivateRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
