import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { auth, db } from '../firebase';  // Import Firebase Auth and Database
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';  // For reading username
import { useNavigate } from 'react-router-dom';  // For redirection after logout
import './ProblemList.css';

const ProblemList = () => {
  const [problems, setProblems] = useState([]);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  // Fetch problems from the backend
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;

        // Fetch the username from the Firebase Realtime Database
        const userRef = ref(db, `users/${uid}`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data && data.username) {
            setUsername(data.username);
          }
        });
      } else {
        navigate('/login');  // Redirect to login if not logged in
      }
    });

    
    axios.get('https://bear-grader-server.onrender.com/api/problems')
      .then(response => {
        setProblems(response.data);
      })
      .catch(error => {
        console.error('Error fetching problems:', error);
      });

      return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/login');  // Redirect to login after logout
    });
  };

  return (
    <div className="problem-list">
      <div className="problem-list-header">
        <h1>Available Problems</h1>
        {username && (
          <div>
            <p className="welcome-message">Welcome, {username}</p>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>

      <ul>
        {problems.map((problem) => (
          <li key={problem.id}>
            <a href={`/problem/${problem.id}`}>{problem.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProblemList;
