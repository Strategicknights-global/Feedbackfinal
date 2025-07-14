import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaChartBar, FaTable, FaInfoCircle, FaSpinner, FaUsers } from 'react-icons/fa'; // Removed FaStarHalfAlt as it's not used directly
import './FeedbackAnalysisReport.css'; // Make sure this CSS is linked

// Import Chart.js components
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Actual Chart Component using Chart.js
const RatingBarChart = ({ questionText, responses }) => {
  // Ensure labels are in order 1, 2, 3, 4, 5
  const labels = ['1', '2', '3', '4', '5'];
  const dataValues = labels.map(label => responses[label] || 0); // Ensure 0 if no responses for a scale

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Number of Responses',
        data: dataValues,
        backgroundColor: [
            'rgba(231, 76, 60, 0.8)', // Red for 1 (Strong Disagree / Very Bad)
            'rgba(243, 156, 18, 0.8)', // Orange for 2
            'rgba(241, 196, 15, 0.8)', // Yellow for 3 (Neutral)
            'rgba(46, 204, 113, 0.8)', // Green for 4
            'rgba(52, 152, 219, 0.8)', // Blue for 5 (Strongly Agree / Very Good)
        ],
        borderColor: [
            'rgba(231, 76, 60, 1)',
            'rgba(243, 156, 18, 1)',
            'rgba(241, 196, 15, 1)',
            'rgba(46, 204, 113, 1)',
            'rgba(52, 152, 219, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Essential for fitting chart into dynamic containers
    plugins: {
      legend: {
        display: false, // We usually don't need a legend for single bar charts
      },
      title: {
        display: true,
        text: questionText,
        font: {
          size: 18,
          weight: 'bold',
        },
        color: '#34495e',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Rating (1-5)',
          color: '#555',
        },
        grid: {
            display: false, // Remove vertical grid lines
        }
      },
      y: {
        title: {
          display: true,
          text: 'Number of Responses',
          color: '#555',
        },
        beginAtZero: true,
        ticks: {
            precision: 0, // Ensure Y-axis ticks are integers
        }
      },
    },
  };

  return (
    <div style={{ height: '300px', width: '100%' }}> {/* Define height for the chart container */}
        <Bar data={chartData} options={options} />
    </div>
  );
};


const FeedbackAnalysisReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formName, setFormName] = useState('');
  const [totalResponsesOverall, setTotalResponsesOverall] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  const formId = location.state?.formId; //

  const fetchAnalysisData = useCallback(async () => {
    if (!formId) { //
      setError("No form selected for analysis. Please go back to Admin Panel and select a form.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setReportData(null);
    setTotalResponsesOverall(0);

    try {
      // Fetch form name
      const formQuery = query(collection(db, 'forms'), where('__name__', '==', formId));
      const formDocSnapshot = await getDocs(formQuery);

      if (formDocSnapshot.empty) {
        setFormName('Unknown Form (ID: ' + formId + ')');
        setReportData({
          message: `Form with ID "${formId}" not found. Cannot generate report.`,
          questions: []
        });
        setLoading(false);
        return;
      } else {
        setFormName(formDocSnapshot.docs[0].data().name);
      }

      // Fetch questions for the form
      const questionsQuery = query(collection(db, 'questions'), where('formId', '==', formId));
      const questionsSnapshot = await getDocs(questionsQuery);
      const questionsList = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (questionsList.length === 0) {
        setReportData({
          message: "No questions found for this form. Cannot generate report.",
          questions: []
        });
        setLoading(false);
        return;
      }

      // Fetch feedback responses for the form
      const feedbackQuery = query(collection(db, 'feedback'), where('formId', '==', formId)); //
      const feedbackSnapshot = await getDocs(feedbackQuery);
      const feedbackList = feedbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); //

      setTotalResponsesOverall(feedbackList.length);

      const analysis = {};
      questionsList.forEach(q => {
        analysis[q.id] = {
          text: q.text,
          responses: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }, //
          totalResponses: 0,
          average: 0
        };
      });

      feedbackList.forEach(response => {
        if (response.ratings) { //
          Object.entries(response.ratings).forEach(([questionId, value]) => { //
            if (analysis[questionId] && typeof value === 'number' && value >= 1 && value <= 5) {
              analysis[questionId].responses[String(value)]++;
              analysis[questionId].totalResponses++;
            }
          });
        }
      });

      Object.values(analysis).forEach(q => {
        if (q.totalResponses > 0) {
          let sum = 0;
          for (let i = 1; i <= 5; i++) {
            sum += i * q.responses[String(i)];
          }
          q.average = (sum / q.totalResponses).toFixed(2);
        }
      });

      setReportData(analysis);

    } catch (err) {
      console.error("Error fetching analysis data: ", err);
      setError("Failed to fetch analysis report. Please try again. " + err.message);
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    fetchAnalysisData();
  }, [fetchAnalysisData]);

  if (loading) {
    return (
      <div className="analysis-container analysis-loading">
        <FaSpinner className="spinner-icon" />
        <p>Loading analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-container analysis-error">
        <FaInfoCircle className="info-icon" />
        <p className="error-message">{error}</p>
        <button onClick={() => navigate('/admin')} className="btn btn-secondary">Go Back to Admin Panel</button>
      </div>
    );
  }

  if (!reportData || (Object.keys(reportData).length === 0 && !reportData.message)) {
    return (
      <div className="analysis-container analysis-no-data">
        <FaInfoCircle className="info-icon" />
        <h2>Feedback Analysis Report for "{formName}"</h2>
        <p className="no-data-message">No relevant data to display for analysis. Please ensure questions and feedback with ratings exist for this form.</p>
        <button onClick={() => navigate('/admin')} className="btn btn-secondary">Go Back to Admin Panel</button>
      </div>
    );
  }

  const questionsAnalysisArray = Object.values(reportData);

  return (
    <div className="analysis-container">
      <h1 className="analysis-title">Feedback Analysis for "{formName}"</h1>
      <button onClick={() => navigate('/admin')} className="btn btn-secondary back-button">Go Back to Admin Panel</button>

      {reportData.message ? (
        <p className="info-message">{reportData.message}</p>
      ) : (
        <>
          {/* Summary Section */}
          <div className="analysis-summary">
            <p><FaUsers /> Total Feedback Submitted: <strong>{totalResponsesOverall}</strong></p>
            {questionsAnalysisArray.length > 0 && (
                <p><FaChartBar /> Questions Analyzed: <strong>{questionsAnalysisArray.length}</strong></p>
            )}
          </div>

          {/* Charts Section */}
          <div className="chart-section">
            <h2><FaChartBar /> Visual Insights</h2>
            <p className="section-description">Graphical representation of feedback ratings for each question.</p>
            <div className="chart-grid">
              {questionsAnalysisArray.map(q => (
                <div key={q.text} className="chart-card">
                    {/* Use the actual RatingBarChart component here */}
                    <RatingBarChart
                        questionText={q.text}
                        responses={q.responses}
                    />
                </div>
              ))}
            </div>
          </div>

          {/* Raw Averages Table */}
          <div className="analysis-raw-data">
            <h2><FaTable /> Detailed Question Averages</h2>
            <div className="table-responsive">
              <table className="analysis-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Avg. Rating (1-5)</th>
                    <th>Total Responses</th>
                    <th>Responses (1)</th>
                    <th>Responses (2)</th>
                    <th>Responses (3)</th>
                    <th>Responses (4)</th>
                    <th>Responses (5)</th>
                  </tr>
                </thead>
                <tbody>
                  {questionsAnalysisArray.map(q => (
                    <tr key={q.text}>
                      <td>{q.text}</td>
                      <td>{q.totalResponses > 0 ? q.average : 'N/A'}</td>
                      <td>{q.totalResponses}</td>
                      <td>{q.responses['1']}</td>
                      <td>{q.responses['2']}</td>
                      <td>{q.responses['3']}</td>
                      <td>{q.responses['4']}</td>
                      <td>{q.responses['5']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FeedbackAnalysisReport;