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
  const [loading, setLoading] = useState(false);  // Loading state for submit button
  const navigate = useNavigate();

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

    axios.get(`https://bear-grader-server.onrender.com/api/problems/${id}`)
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
    setLoading(true);  // Set loading to true to disable the button

    const userRef = ref(db, `users/${uid}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.username) {
        const username = data.username;  // Retrieve the username
  
        // Call the backend API to submit the code along with the problem ID and username
        axios.post('https://bear-grader-server.onrender.com/api/submit', {
          problemId: id,
          code: code,
          username: username,  // Send the username
        })
          .then(res => {
            if (res.data.score !== undefined) {
              const newSubmissionRef = push(ref(db, `submissions/problem_${id}`));
              set(newSubmissionRef, {
                submissionId: newSubmissionRef.key,
                problemId: id,
                code: code,
                score: res.data.score,
                results: res.data.results,
                userId: uid,  // Store the user's UID
                username: username,  // Store the username in Firebase as well
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
          })
          .finally(() => {
            setLoading(false);  // Re-enable the button once the request completes
          });
      } else {
        alert('Error retrieving username.');
        setLoading(false);  // Re-enable the button if there was an error
      }
    }, {
      onlyOnce: true // Fetch the username only once
    });
  };

  return (
    <div className="problem-details">
      <div className="problem-header">
        <h1>{problem.title}</h1>
        {username && (
          <div>
            <p>Welcome, {username}</p>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>

      <p className="problem-description">{problem.description}</p>
      <a href={problem.file} target="_blank" rel="noopener noreferrer">[Open problem]</a>

      {latestScore !== null && (
        <div className="latest-score">
          <p>Your latest score: {latestScore}% {latestScore === 100 ? '✅' : '❌'}</p>
        </div>
      )}

      <p>This problem has {problem.testCases ? problem.testCases.length : 0} test cases.</p>

      <div className="code-editor">
        <CodeMirror
          value={code}
          options={{
            mode: 'text/x-c++src',
            theme: 'material',
            lineNumbers: true,
          }}
          onBeforeChange={(editor, data, value) => {
            setCode(value);
          }}
        />
      </div>

      {/* Disable the button when loading */}
      <button 
        className={`submit-button ${loading ? 'loading' : ''}`} 
        onClick={handleSubmit}
        disabled={loading}  // Disable button during loading
      >
        {loading ? 'Submitting...' : 'Submit Code'}
      </button>

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

      <div className="previous-submissions">
        <h3>Previous Submissions</h3>
        <ul>
          {submissions.map((sub, index) => (
            <li key={index}>
              Score: {sub.score}%, Submitted by: {sub.username}, Submitted at: {new Date(sub.timestamp).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProblemDetails;
