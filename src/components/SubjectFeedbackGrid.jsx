// src/components/SubjectFeedbackGrid.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import RatingIcon from './RatingIcon';
import SemesterSelector from './SemesterSelector';

const RATING_VALUES = [5, 4, 3, 2, 1];

// This component now accepts the selected `form` as a prop
const SubjectFeedbackGrid = ({ form }) => {
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  
  const currentUser = auth.currentUser;
  const rollNumber = currentUser?.email.split('@')[0];
  const yearOfJoining = rollNumber ? `20${rollNumber.substring(0, 2)}` : null;
  const deptCode = rollNumber ? rollNumber.substring(8, 11) : null;

  const fetchDataForForm = useCallback(async () => {
    // We use form.id from props, no need for selectedFormId state here
    if (!selectedSemester || !deptCode || !form.id) return;

    setLoading(true);
    setMessage('');
    try {
      const subjectQuery = query(collection(db, 'subjects'), 
        where('deptCode', '==', deptCode),
        where('semester', '==', selectedSemester)
      );
      const subjectsSnapshot = await getDocs(subjectQuery);
      const subjectsList = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(subjectsList);

      const questionQuery = query(collection(db, 'questions'), where('formId', '==', form.id));
      const questionsSnapshot = await getDocs(questionQuery);
      const questionsList = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuestions(questionsList);
      
      if (subjectsList.length === 0 || questionsList.length === 0) {
        setMessage("No feedback items found for your selection. Please contact your administrator.");
      }
      setRatings({});
    } catch (error) {
      console.error("Error fetching data: ", error);
      setMessage("Error: Could not load form data.");
    } finally {
      setLoading(false);
    }
  }, [selectedSemester, deptCode, form.id]);

  useEffect(() => {
    fetchDataForForm();
  }, [fetchDataForForm]);

  const theorySubjects = subjects.filter(s => s.type === 'Theory');
  const labSubjects = subjects.filter(s => s.type === 'Lab');

  const handleRatingChange = (questionId, subjectName, value) => {
    setRatings(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], [subjectName]: parseInt(value, 10) }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allSubjects = [...theorySubjects, ...labSubjects];
    for (const q of questions) {
      for (const s of allSubjects) {
        if (!ratings[q.id]?.[s.name]) {
          setMessage("Error: Please complete all feedback ratings.");
          return;
        }
      }
    }
    setIsSubmitting(true);
    setMessage('');
    try {
      await addDoc(collection(db, 'feedback'), {
        formId: form.id, // Use form.id from props
        formName: form.name, // Use form.name from props
        userId: currentUser.uid,
        userEmail: currentUser.email,
        semester: selectedSemester,
        ratings: ratings,
        submittedAt: serverTimestamp()
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

  // --- RENDER LOGIC ---
  if (!selectedSemester) {
    return <SemesterSelector onSemesterSelect={setSelectedSemester} yearOfJoining={yearOfJoining} />;
  }

  return (
    <div>
      {loading && <p className="text-center font-semibold text-slate-500">Loading...</p>}
      
      {message && <p className={`text-center font-bold my-4 ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}

      {!loading && (questions.length > 0) && (subjects.length > 0) && (
        <form onSubmit={handleSubmit}>
          {/* Theory Subjects Table */}
          {theorySubjects.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-indigo-700 mb-4">Theory Subjects</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-100 z-10" rowSpan="2">Question</th>
                      {theorySubjects.map(subject => (<th key={subject.id} className="py-3 px-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider" colSpan="5">{subject.name}</th>))}
                    </tr>
                    <tr>
                      {theorySubjects.map(subject => (RATING_VALUES.map(value => (<th key={`${subject.id}-${value}`} className="py-2 px-1 text-center text-xs font-bold text-slate-500 w-12">{value}</th>))))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {questions.map((question) => (
                      <tr key={question.id}>
                        <td className="py-4 px-4 text-sm font-medium text-slate-800 sticky left-0 bg-white hover:bg-slate-50 z-10 align-top">{question.text}</td>
                        {theorySubjects.map(subject => (
                          RATING_VALUES.map(value => (
                            <td key={`${subject.id}-${value}`} style={{ padding: '0.5rem', textAlign: 'center' }}>
                              <RatingIcon
                                value={value}
                                name={`${question.id}-${subject.name}`}
                                selectedValue={ratings[question.id]?.[subject.name]}
                                onChange={(e) => handleRatingChange(question.id, subject.name, e.target.value)}
                              />
                            </td>
                          ))
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lab Subjects Table */}
          {labSubjects.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-indigo-700 mb-4">Lab Subjects</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-100 z-10" rowSpan="2">Question</th>
                      {labSubjects.map(subject => (<th key={subject.id} className="py-3 px-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider" colSpan="5">{subject.name}</th>))}
                    </tr>
                    <tr>
                      {labSubjects.map(subject => (RATING_VALUES.map(value => (<th key={`${subject.id}-${value}`} className="py-2 px-1 text-center text-xs font-bold text-slate-500 w-12">{value}</th>))))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {questions.map((question) => (
                      <tr key={question.id}>
                        <td className="py-4 px-4 text-sm font-medium text-slate-800 sticky left-0 bg-white hover:bg-slate-50 z-10 align-top">{question.text}</td>
                        {labSubjects.map(subject => (
                          RATING_VALUES.map(value => (
                            <td key={`${subject.id}-${value}`} style={{ padding: '0.5rem', textAlign: 'center' }}>
                              <RatingIcon
                                value={value}
                                name={`${question.id}-${subject.name}`}
                                selectedValue={ratings[question.id]?.[subject.name]}
                                onChange={(e) => handleRatingChange(question.id, subject.name, e.target.value)}
                              />
                            </td>
                          ))
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="text-center mt-8">
            <button type="submit" className="px-12 py-3 font-semibold text-white bg-blue-600 rounded-lg" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// Don't forget to add the default export!
export default SubjectFeedbackGrid;