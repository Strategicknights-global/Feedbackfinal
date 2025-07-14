// src/components/RatingBarChart.jsx
import React from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RatingBarChart = ({ questionText, responses }) => {
  const labels = Object.keys(responses).sort(); // Labels '1', '2', '3', '4', '5'
  const dataValues = labels.map(label => responses[label]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Number of Responses',
        data: dataValues,
        backgroundColor: [
            'rgba(231, 76, 60, 0.8)', // Red for 1
            'rgba(243, 156, 18, 0.8)', // Orange for 2
            'rgba(241, 196, 15, 0.8)', // Yellow for 3
            'rgba(46, 204, 113, 0.8)', // Green for 4
            'rgba(52, 152, 219, 0.8)', // Blue for 5
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
    maintainAspectRatio: false, // Important for fitting into parent container
    plugins: {
      legend: {
        display: false,
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
            display: false,
        }
      },
      y: {
        title: {
          display: true,
          text: 'Count',
          color: '#555',
        },
        beginAtZero: true,
        ticks: {
            precision: 0, // Ensure integer ticks
        }
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default RatingBarChart;