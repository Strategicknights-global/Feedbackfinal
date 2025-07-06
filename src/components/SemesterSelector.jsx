// src/components/SemesterSelector.jsx
import React, { useState } from 'react';

function SemesterSelector({ onSemesterSelect, yearOfJoining }) {
  const [selectedSemester, setSelectedSemester] = useState('');

  const currentYear = new Date().getFullYear();
  const academicYear = currentYear - parseInt(yearOfJoining, 10);
  
  // Calculate possible semesters
  const possibleSemesters = [];
  if (academicYear >= 0) possibleSemesters.push(1, 2);
  if (academicYear >= 1) possibleSemesters.push(3, 4);
  if (academicYear >= 2) possibleSemesters.push(5, 6);
  if (academicYear >= 3) possibleSemesters.push(7, 8);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSemester) {
      onSemesterSelect(parseInt(selectedSemester, 10));
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '560px' }}>
      <div className="content-card">
        <h1 className="text-2xl font-bold text-center">Welcome, Student!</h1>
        <p className="text-slate-600 text-center mt-2 mb-8">Please select your current semester to proceed.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="semester-select" className="font-semibold">Current Semester</label>
            <select
              id="semester-select"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl"
              required
            >
              <option value="" disabled>-- Choose your semester --</option>
              {possibleSemesters.map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full mt-4">
            Proceed to Feedback Form
          </button>
        </form>
      </div>
    </div>
  );
}

export default SemesterSelector;