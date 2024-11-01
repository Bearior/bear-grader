import React, { useState } from 'react';
import { auth, db } from './firebase';  // Import Firebase Auth and Database instances
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';  // For querying Firebase Realtime Database
import { useNavigate } from 'react-router-dom';  // To handle redirection
import './AuthForm.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');  // Can be username or email
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Function to check if identifier is a valid email
  const isValidEmail = (identifier) => {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(identifier);
  };

  // Login function (with username or email)
  const handleLogin = () => {
    setError('');  // Reset errors

    if (isValidEmail(identifier)) {
      // If it's an email, log in directly with the email
      signInWithEmailAndPassword(auth, identifier, password)
        .then(userCredential => {
          console.log('Logged in:', userCredential.user);
          navigate('/');  // Redirect to the home page after login
        })
        .catch(error => {
          setError(error.message);
          console.error('Error logging in:', error);
        });
    } else {
      // If it's a username, query Firebase Realtime Database for the associated email
      const userRef = ref(db, 'users');
      get(userRef).then(snapshot => {
        const users = snapshot.val();
        const userEmail = Object.values(users).find(user => user.username === identifier)?.email;

        if (userEmail) {
          // If email is found, log in using the retrieved email
          signInWithEmailAndPassword(auth, userEmail, password)
            .then(userCredential => {
              console.log('Logged in:', userCredential.user);
              navigate('/');
            })
            .catch(error => {
              setError(error.message);
              console.error('Error logging in:', error);
            });
        } else {
          setError('Username not found');
        }
      }).catch(error => {
        setError('Error fetching user data');
        console.error('Error fetching user data:', error);
      });
    }
  };

  // Navigate to sign-up page
  const handleSignupRedirect = () => {
    navigate('/signup');  // Redirect to a sign-up page
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login</h2>
        <p>- Bear's grader for review -</p>
        <input
          type="text"
          placeholder="Username or Email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div>
          <button onClick={handleLogin}>Login</button>
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="auth-link">
          <p>
            Don't have an account? <a onClick={handleSignupRedirect}>Sign up here</a>
          </p>
        </div>
      </div>
    </div>
  );
  
};

export default Login;
