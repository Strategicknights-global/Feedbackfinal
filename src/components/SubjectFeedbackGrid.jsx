// src/components/SubjectFeedbackGrid.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import SemesterSelector from './SemesterSelector';
import { FaRegSmileBeam, FaRegSmile, FaRegMeh, FaRegFrown, FaRegAngry, FaPaperPlane, FaBookOpen, FaFlask } from 'react-icons/fa';

// Map rating values to their icons
const ratingIcons = {
  5: FaRegSmileBeam,
  4: FaRegSmile,
  3: FaRegMeh,
  2: FaRegFrown,
  1: FaRegAngry,
};

const SubjectFeedbackGrid = ({ form }) => {
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  // STATE STRUCTURE: { questionId: { subjectId: ratingValue } }
  const [ratings, setRatings] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const currentUser = auth.currentUser;
  const rollNumber = currentUser?.email.split('@')[0];
  const yearOfJoining = rollNumber ? `20${rollNumber.substring(0, 2)}` : null;
  const deptCode = rollNumber ? rollNumber.substring(8, 11) : null;

  // Fetching logic remains the same
  const fetchDataForForm = useCallback(async () => {
    if (!selectedSemester || !deptCode || !form.id) return;
    setLoading(true);
    setMessage('');
    try {
      const subjectQuery = query(collection(db, 'subjects'), where('deptCode', '==', deptCode), where('semester', '==', selectedSemester));
      const subjectsSnapshot = await getDocs(subjectQuery);
      setSubjects(subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const questionQuery = query(collection(db, 'questions'), where('formId', '==', form.id));
      const questionsSnapshot = await getDocs(questionQuery);
      setQuestions(questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      setRatings({});
    } catch (error) {
      console.error("Error fetching data: ", error);
      setMessage("Error: Could not load form data.");
    } finally {
      setLoading(false);
    }
  }, [selectedSemester, deptCode, form.id]);

  useEffect(() => { fetchDataForForm(); }, [fetchDataForForm]);

  const handleRatingChange = (questionId, subjectId, value) => {
    setRatings(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], [subjectId]: parseInt(value, 10) }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate that all ratings are filled
    for (const q of questions) {
      for (const s of subjects) {
        if (!ratings[q.id]?.[s.id]) {
          setMessage("Error: Please complete all feedback ratings.");
          return;
        }
      }
    }
    setIsSubmitting(true);
    setMessage('');
    try {
      await addDoc(collection(db, 'feedback'), {
        formId: form.id, formName: form.name, userId: currentUser.uid, userEmail: currentUser.email,
        semester: selectedSemester, ratings: ratings, submittedAt: serverTimestamp()
      });
      setMessage('Thank you! Your feedback has been submitted successfully.');
      setRatings({});
    } catch (error) {
      console.error("Error submitting feedback: ", error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedSemester) return <SemesterSelector onSemesterSelect={setSelectedSemester} yearOfJoining={yearOfJoining} />;
  if (loading) return <p className="text-center font-semibold">Loading...</p>;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="feedback-grid-container">
          <table className="feedback-grid-table">
            <thead>
              <tr>
                <th className="question-header-cell">Question</th>
                {subjects.map(subject => (
                  <th key={subject.id} className="subject-header-cell">
                    {subject.type === 'Theory' ? <FaBookOpen /> : <FaFlask />}
                    {subject.name}
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
                      {/* This is the vertical stack of ratings inside each cell */}
                      <div className="rating-stack">
                        {[5, 4, 3, 2, 1].map(value => {
                          const IconComponent = ratingIcons[value];
                          const isSelected = ratings[question.id]?.[subject.id] === value;
                          return (
                            <label key={value} className={`rating-stack-item ${isSelected ? `selected rating-${value}` : ''}`}>
                              <input
                                type="radio"
                                name={`${question.id}-${subject.id}`}
                                value={value}
                                checked={isSelected}
                                onChange={() => handleRatingChange(question.id, subject.id, value)}
                                required
                              />
                              <span className="rating-number">{value}</span>
                              <div className="rating-circle">
                                <IconComponent className="icon-face" />
                              </div>
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
        
        {message && <p className={`text-center font-bold my-4 ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}

        {subjects.length > 0 && (
          <div className="mt-8">
            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : <><FaPaperPlane /> Submit Feedback</>}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SubjectFeedbackGrid;