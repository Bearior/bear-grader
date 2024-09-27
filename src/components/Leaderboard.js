import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';  // Import your Firebase database
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);  // Track expanded rows

  useEffect(() => {
    // Reference to the submissions node in Firebase
    const submissionsRef = ref(db, 'submissions');

    onValue(submissionsRef, (snapshot) => {
      const submissions = snapshot.val();
      const userScores = {};

      if (submissions) {
        // Iterate over each problem node
        Object.entries(submissions).forEach(([problemKey, problemData]) => {
          Object.entries(problemData).forEach(([submissionKey, submission]) => {
            const { userId, score, username } = submission;

            // Initialize user if they don't exist in userScores
            if (!userScores[userId]) {
              userScores[userId] = { username: username, totalScore: 0, bestScores: {} };
            }

            // Check if the score for the current problem is the best for this user
            if (!userScores[userId].bestScores[problemKey] || score > userScores[userId].bestScores[problemKey]) {
              userScores[userId].bestScores[problemKey] = score || 0;  // Initialize score to 0 if undefined
            }
          });
        });

        // Calculate the total score for each user by summing their best scores for each problem
        const leaderboard = Object.keys(userScores).map(userId => {
          const bestScores = userScores[userId].bestScores;
          const totalScore = Object.values(bestScores).reduce((acc, score) => acc + (score || 0), 0);  // Sum of best scores

          return {
            username: userScores[userId].username,
            totalScore,
            bestScores,
          };
        });

        // Sort users by total score (highest first)
        leaderboard.sort((a, b) => b.totalScore - a.totalScore);

        // Update leaderboard state
        setLeaderboardData(leaderboard);
      }
    });
  }, []);

  // Toggle the expand/collapse state of a row
  const toggleRow = (username) => {
    setExpandedRows((prevExpandedRows) =>
      prevExpandedRows.includes(username)
        ? prevExpandedRows.filter(row => row !== username)
        : [...prevExpandedRows, username]
    );
  };

  return (
    <div className="leaderboard">
      <h1>Leaderboard</h1>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Total Score</th>
            <th>Best Scores (Per Problem)</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((user, index) => (
            <React.Fragment key={user.username}>
              <tr onClick={() => toggleRow(user.username)} style={{ cursor: 'pointer' }}>
                <td>{index + 1}</td>
                <td>{user.username}</td>
                <td>{user.totalScore}</td>
                <td>{expandedRows.includes(user.username) ? "▼" : "▶"}</td> {/* Collapse/Expand Icon */}
              </tr>
              {expandedRows.includes(user.username) && (
                <tr>
                  <td colSpan="4">
                    {Object.entries(user.bestScores).map(([problemId, score], scoreIndex) => (
                      <div key={`${user.username}-${problemId}-${scoreIndex}`}>
                        Problem {problemId}: {score}
                      </div>
                    ))}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
