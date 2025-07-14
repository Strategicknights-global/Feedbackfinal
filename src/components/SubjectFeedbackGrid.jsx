// src/components/SubjectFeedbackGrid.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import SemesterSelector from './SemesterSelector';
import { FaRegSmileBeam, FaRegSmile, FaRegMeh, FaRegFrown, FaRegAngry, FaPaperPlane, FaBookOpen, FaFlask, FaSpinner } from 'react-icons/fa'; // Added FaSpinner for loading

// Import the new CSS file
import './SubjectFeedbackGrid.css';

// Map rating values to their icons
const ratingIcons = {
  5: FaRegSmileBeam, // Excellent
  4: FaRegSmile,     // Good
  3: FaRegMeh,       // Average
  2: FaRegFrown,     // Poor
  1: FaRegAngry,     // Very Poor
};

const SubjectFeedbackGrid = ({ form }) => {
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  // STATE STRUCTURE: { questionId: { subjectId: ratingValue } }
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(''); // For success/error messages

  const currentUser = auth.currentUser;
  const rollNumber = currentUser?.email.split('@')[0];
  const yearOfJoining = rollNumber ? `20${rollNumber.substring(0, 2)}` : null;
  const deptCode = rollNumber ? rollNumber.substring(8, 11) : null;

  const fetchDataForForm = useCallback(async () => {
    if (!selectedSemester || !deptCode || !form.id) {
      // console.log("Skipping fetch: missing semester, deptCode, or form.id", { selectedSemester, deptCode, formId: form.id });
      return;
    }
    setLoading(true);
    setMessage(''); // Clear any previous messages
    try {
      const subjectQuery = query(collection(db, 'subjects'), where('deptCode', '==', deptCode), where('semester', '==', selectedSemester));
      const subjectsSnapshot = await getDocs(subjectQuery);
      const fetchedSubjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(fetchedSubjects);

      const questionQuery = query(collection(db, 'questions'), where('formId', '==', form.id));
      const questionsSnapshot = await getDocs(questionQuery);
      const fetchedQuestions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuestions(fetchedQuestions);

      // Reset ratings when data for a new semester/form is fetched
      setRatings({});

      // If no subjects found for the selected semester/dept
      if (fetchedSubjects.length === 0 && fetchedQuestions.length > 0) {
        setMessage("No subjects found for this semester in your department. Please contact administration.");
      } else if (fetchedQuestions.length === 0 && fetchedSubjects.length > 0) {
        setMessage("No questions found for this feedback form. Please contact administration.");
      } else if (fetchedSubjects.length === 0 && fetchedQuestions.length === 0) {
         setMessage("No subjects or questions found for this form/semester combination. Please contact administration.");
      }


    } catch (error) {
      console.error("Error fetching data: ", error);
      setMessage("Error: Could not load form data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedSemester, deptCode, form.id]);

  useEffect(() => {
    fetchDataForForm();
  }, [fetchDataForForm]);

  const handleRatingChange = (questionId, subjectId, value) => {
    setRatings(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], [subjectId]: parseInt(value, 10) }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear messages before submitting

    // Basic validation to ensure all ratings are filled
    if (subjects.length === 0 || questions.length === 0) {
        setMessage("Cannot submit: No subjects or questions available.");
        return;
    }

    let allRatingsFilled = true;
    for (const q of questions) {
      for (const s of subjects) {
        if (!ratings[q.id]?.[s.id]) {
          allRatingsFilled = false;
          break;
        }
      }
      if (!allRatingsFilled) break;
    }

    if (!allRatingsFilled) {
      setMessage("Error: Please provide a rating for every subject and question.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        formId: form.id,
        formName: form.name,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        semester: selectedSemester,
        ratings: ratings,
        submittedAt: serverTimestamp()
      });
      setMessage('Thank you! Your feedback has been submitted successfully.');
      setRatings({}); // Clear ratings after successful submission
      // Optionally, you might want to prevent further submissions or redirect
    } catch (error) {
      console.error("Error submitting feedback: ", error);
      setMessage('An error occurred while submitting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render SemesterSelector first if no semester is chosen
  if (!selectedSemester) {
    return <SemesterSelector onSemesterSelect={setSelectedSemester} yearOfJoining={yearOfJoining} />;
  }

  // Render loading state
  if (loading) {
    return (
      <div className="feedback-loading">
        <FaSpinner className="spinner-icon" />
        <p>Loading feedback form...</p>
      </div>
    );
  }

  // Render message if no subjects/questions are found after loading
  if (subjects.length === 0 || questions.length === 0) {
    return (
        <div className="feedback-no-data">
            <p className="message-info">{message || "No subjects or questions available for this semester/form."}</p>
            <button onClick={() => setSelectedSemester(null)} className="btn-secondary mt-4">
                Select Another Semester
            </button>
        </div>
    );
  }

  return (
    <div className="feedback-page-container">
      <h2 className="feedback-page-title">Provide Feedback for {form.name}</h2>
      <p className="semester-info">Selected Semester: {selectedSemester}</p>

      {message && (
        <div className={`feedback-message ${message.includes('Error') ? 'error-message' : 'success-message'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="feedback-form-layout">
        <div className="feedback-grid-wrapper">
          <table className="feedback-grid-table">
            <thead>
              <tr>
                <th className="question-header-cell">Question</th>
                {subjects.map(subject => (
                  <th key={subject.id} className="subject-header-cell">
                    <span className="subject-icon">{subject.type === 'Theory' ? <FaBookOpen /> : <FaFlask />}</span>
                    <span className="subject-name">{subject.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map(question => (
                <tr key={question.id}>
                  <td className="question-body-cell">{question.text}</td>
                  {subjects.map(subject => (
                    <td key={subject.id} className="rating-grid-cell">
                      <div className="rating-stack">
                        {[5, 4, 3, 2, 1].map(value => {
                          const IconComponent = ratingIcons[value];
                          const isSelected = ratings[question.id]?.[subject.id] === value;
                          return (
                            <label
                              key={value}
                              className={`rating-option ${isSelected ? `selected rating-${value}` : ''}`}
                              title={`Rate ${value} for ${subject.name} on "${question.text}"`}
                            >
                              <input
                                type="radio"
                                name={`rating-${question.id}-${subject.id}`} // Unique name for each radio group
                                value={value}
                                checked={isSelected}
                                onChange={() => handleRatingChange(question.id, subject.id, value)}
                                required // Make sure a selection is required for each
                              />
                              <span className="rating-value-label">{value}</span>
                              <IconComponent className="rating-icon-face" />
                            </label>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {subjects.length > 0 && questions.length > 0 && ( /* Only show submit if there's data to submit */
          <div className="submit-button-container">
            <button type="submit" className="btn btn-submit-feedback" disabled={isSubmitting}>
              {isSubmitting ? <><FaSpinner className="spinner-icon-inline" /> Submitting...</> : <><FaPaperPlane /> Submit Feedback</>}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SubjectFeedbackGrid;