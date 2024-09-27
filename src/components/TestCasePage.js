import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './TestCasesPage.css'; // Add some styling if needed

const TestCasesPage = () => {
  const { id } = useParams();  // Get the problem ID from the route params
  const [problem, setProblem] = useState(null);

  useEffect(() => {
    // Fetch the problem details from the backend
    axios.get(`https://bear-grader-server.onrender.com/api/problems/${id}`)
      .then(res => setProblem(res.data))
      .catch(err => console.error('Error fetching problem:', err));
  }, [id]);

  if (!problem) {
    return <div>Loading...</div>;
  }

  return (
    <div className="testcases-container">
      <h1>Test Cases for {problem.title}</h1>

      <table className="testcases-table">
        <thead>
          <tr>
            <th>Test Case #</th>
            <th>Input</th>
            <th>Expected Output</th>
          </tr>
        </thead>
        <tbody>
          {problem.testCases.map((testCase, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td><pre>{testCase.input}</pre></td>
              <td><pre>{testCase.output}</pre></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TestCasesPage;
