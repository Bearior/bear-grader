import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ref, set, onValue, push, query, orderByChild, equalTo } from 'firebase/database';  // Import Firebase functions
import { auth, db } from '../firebase';  // Import Firebase Auth and Database
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';  // For redirection after logout
import './ProblemDetails.css';

// Import CodeMirror for code editing
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/clike/clike';  // C++ mode

const ProblemDetails = () => {
  const { id } = useParams();
  const [problem, setProblem] = useState({});
  const [code, setCode] = useState('');  // This will hold the CodeMirror value
  const [response, setResponse] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [username, setUsername] = useState('');
  const [latestScore, setLatestScore] = useState(null);
  const navigate = useNavigate();

  // Fetch the problem details from the backend
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;

        const submissionRef = query(ref(db, `submissions/problem_${id}`), orderByChild('userId'), equalTo(uid));
        onValue(submissionRef, (snapshot) => {
          let latestSubmission = null;
          snapshot.forEach(sub => {
            latestSubmission = sub.val();  // Get the latest submission for this user
          });
          if (latestSubmission) {
            setLatestScore(latestSubmission.score);  // Set the latest score
          }
        });

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

    
    axios.get(`http://localhost:3001/api/problems/${id}`)
      .then(res => setProblem(res.data));

    
    const submissionsRef = ref(db, `submissions/problem_${id}`);
    onValue(submissionsRef, (snapshot) => {
      const submissionsData = snapshot.val();
      if (submissionsData) {
        setSubmissions(Object.values(submissionsData));  // Convert from object to array
      }
    });

    return () => unsubscribe();
  }, [id, navigate]);

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/login');  // Redirect to login after logout
    });
  };


  const handleSubmit = () => {
    const user = auth.currentUser;

    if (!user) {
      alert('You need to be logged in to submit a solution.');
      return;
    }

    const uid = user.uid;

    // Call the backend to process the submission
    // This example assumes you're calling your backend API to evaluate the code
    axios.post('http://localhost:3001/api/submit', {
      problemId: id,
      code: code
    })
      .then(res => {
        if (res.data.score !== undefined) {
          // Save the submission in Firebase with the user's UID
          const newSubmissionRef = push(ref(db, `submissions/problem_${id}`));
          set(newSubmissionRef, {
            submissionId: newSubmissionRef.key,
            problemId: id,
            code: code,
            score: res.data.score,
            results: res.data.results,
            userId: uid,  // Store the user's UID
            timestamp: new Date().toISOString()
          });

          alert(`Score: ${res.data.score}%`);
          setResponse(res.data);
        } else {
          alert('Unexpected response from server.');
        }
      })
      .catch(error => {
        console.error('Error submitting code:', error);
        alert('Error submitting code. Please try again.');
      });
  };


  console.log(username);

  return (
    <div className="problem-details">
      <div className="problem-header">
        <h1>{problem.title}</h1>
        {/* Display username and logout button */}
        {username && (
          <div>
            <p>Welcome, {username}</p>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
  
      <p className="problem-description">{problem.description} </p>
      <a href={problem.file} target="_blank" rel="noopener noreferrer"> [Open problem]</a>
  
      {latestScore !== null && (
        <div className="latest-score">
          <p>Your latest score: {latestScore}% {latestScore === 100 ? '✅' : '❌'}</p>
        </div>
      )}
  
      <p>This problem has {problem.testCases ? problem.testCases.length : 0} test cases.</p>
  
      {/* CodeMirror component for code input */}
      <div className="code-editor">
        <CodeMirror
          value={code}
          options={{
            mode: 'text/x-c++src',  // Set mode to C++
            theme: 'material',       // Use the Material theme
            lineNumbers: true,       // Show line numbers
          }}
          onBeforeChange={(editor, data, value) => {
            setCode(value);  // Update the code state with the new value
          }}
        />
      </div>
  
      <button className="submit-button" onClick={handleSubmit}>Submit Code</button>
  
      {/* Display submission results */}
      {response && response.results && (
        <div className="test-results">
          <h3>Test Results</h3>
          <ul>
            {response.results.map((result, index) => (
              <li key={index}>
                {result.success ? '✅' : '❌'} {result.message}
              </li>
            ))}
          </ul>
          <h3>Score: {response.score}%</h3>
        </div>
      )}
  
      {/* Show previous submissions */}
      <div className="previous-submissions">
        <h3>Previous Submissions</h3>
        <ul>
          {submissions.map((sub, index) => (
            <li key={index}>
              Score: {sub.score}%, Submitted by: {username}, Submitted at: {new Date(sub.timestamp).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProblemDetails;
