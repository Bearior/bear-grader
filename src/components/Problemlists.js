import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { auth, db } from '../firebase';  // Import Firebase Auth and Database
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';  // For reading submissions
import { useNavigate } from 'react-router-dom';  // For redirection after logout
import './ProblemList.css';  // Add this for additional styling

const ProblemList = () => {
  const [problems, setProblems] = useState([]);
  const [username, setUsername] = useState('');
  const [latestScores, setLatestScores] = useState({});  // Store latest score per problem
  const navigate = useNavigate();

  // Fetch username and user-related data
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

    return () => unsubscribe();
  }, [navigate]);

  // Fetch problems from the backend
  useEffect(() => {
    axios.get('https://bear-grader-server.onrender.com/api/problems')
      .then(response => {
        setProblems(response.data);

        // After problems are fetched, query Firebase for latest submissions
        const user = auth.currentUser;
        if (user) {
          const uid = user.uid;

          response.data.forEach((problem) => {
            const submissionsRef = query(ref(db, `submissions/problem_${problem.id}`), orderByChild('userId'), equalTo(uid));
            onValue(submissionsRef, (snapshot) => {
              let latestSubmission = null;
              snapshot.forEach(sub => {
                latestSubmission = sub.val();  // Get the latest submission
              });
              if (latestSubmission) {
                setLatestScores(prevScores => ({
                  ...prevScores,
                  [problem.id]: latestSubmission.score  // Store score for each problem
                }));
              } else {
                setLatestScores(prevScores => ({
                  ...prevScores,
                  [problem.id]: 0  // If no submission, set score to 0
                }));
              }
            });
          });
        }
      })
      .catch(error => {
        console.error('Error fetching problems:', error);
      });
  }, []);

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/login');  // Redirect to login after logout
    });
  };

  const getProgressBarColor = (score) => {
    if (score === 100) {
      return 'green';
    } else if (score > 0 && score < 100) {
      return 'yellow';
    } else {
      return 'grey';
    }
  };

  const handleCardClick = (problemId) => {
    navigate(`/problem/${problemId}`);  // Navigate to the problem details page when clicking the card
  };

  return (
    <div className="container">  {/* Added container for padding */}
      {username && (
        <div className="header">
          <p>Welcome, {username}</p>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      )}

      <h1>Available Problems</h1>
      <div className="problem-list">
        {problems.map((problem) => (
          <div key={problem.id} className="problem-card" onClick={() => handleCardClick(problem.id)}>
            <div className="problem-title">{problem.title}</div>
            <p>Latest Score: {latestScores[problem.id] !== undefined ? latestScores[problem.id] : 0}%</p>
            <progress 
              value={latestScores[problem.id] !== undefined ? latestScores[problem.id] : 0} 
              max="100"
              style={{ backgroundColor: getProgressBarColor(latestScores[problem.id] || 0), width: '100%', height: '20px' }}
            ></progress>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProblemList;
