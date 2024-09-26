import React, { useState } from 'react';
import { auth, db } from './firebase';  // Import the Firebase Auth and Database instances
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, set } from 'firebase/database';  // Use Firebase Realtime Database for storing the username

const AuthSystem = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');  // New username field
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  // Signup function with username
  const handleSignup = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        const user = userCredential.user;
        setUser(user);
        console.log('Signed up:', user);

        // Store the username in Firebase Realtime Database
        set(ref(db, `users/${user.uid}`), {
          username: username,  // Store the username with the user's UID
          email: email
        });

        console.log('Username saved to database:', username);
      })
      .catch(error => {
        setError(error.message);
        console.error('Error signing up:', error);
      });
  };

  // Login function
  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        setUser(userCredential.user);
        console.log('Logged in:', userCredential.user);
      })
      .catch(error => {
        setError(error.message);
        console.error('Error logging in:', error);
      });
  };

  // Logout function
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setUser(null);
        console.log('Logged out');
      })
      .catch(error => {
        setError(error.message);
        console.error('Error logging out:', error);
      });
  };

  return (
    <div>
      <h2>Firebase Auth System</h2>

      {/* If user is logged in, show logout button */}
      {user ? (
        <div>
          <p>Welcome, {user.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div>
            <button onClick={handleSignup}>Sign Up</button>
            <button onClick={handleLogin}>Login</button>
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}
    </div>
  );
};

export default AuthSystem;
