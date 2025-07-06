// src/components/GeneralFeedback.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import RatingIcon from './RatingIcon';

const RATING_VALUES = [5, 4, 3, 2, 1];

const GeneralFeedback = ({ form }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const { currentUser } = auth;

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const q = query(collection(db, 'questions'), where("formId", "==", form.id));
      const querySnapshot = await getDocs(q);
      const fetchedQuestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuestions(fetchedQuestions);

      const initialAnswers = {};
      fetchedQuestions.forEach(ques => { initialAnswers[ques.id] = null; });
      setAnswers(initialAnswers);
      setLoading(false);
    };
    fetchQuestions();
  }, [form.id]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const responseData = {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      formId: form.id,
      formName: form.name,
      submittedAt: serverTimestamp(),
      answers: questions.map(q => ({
        questionId: q.id,
        questionText: q.text,
        answer: answers[q.id]
      }))
    };
    try {
      await addDoc(collection(db, "feedback"), responseData);
      setMessage('Thank you! Your feedback has been submitted successfully.');
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p className="text-center font-semibold text-slate-500">Loading questions...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-12 bg-white p-6 rounded-xl shadow-md border border-slate-200 mt-8">
      {questions.map(q => (
        <div key={q.id}>
          <p className="font-medium text-slate-800 mb-6">{q.text} <span className="text-red-500">*</span></p>
          {q.type === 'rating' ? (
            <div className="flex items-center justify-center space-x-4 sm:space-x-6">
              {RATING_VALUES.map(value => (
                <label key={value} className="group flex flex-col items-center cursor-pointer space-y-2">
                  <input type="radio" name={`question-${q.id}`} value={value}
                    checked={answers[q.id] === value}
                    onChange={() => handleAnswerChange(q.id, value)}
                    className="sr-only" required />
                  <RatingIcon value={value} selectedValue={answers[q.id]} />
                  <span className={`text-sm font-semibold transition-colors ${answers[q.id] === value ? 'text-indigo-700' : 'text-slate-500'}`}>{value}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea value={answers[q.id] || ''}
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              rows="4" className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl"
              placeholder="Your answer here..." required />
          )}
        </div>
      ))}
      {message && <p className={`text-center mt-6 font-semibold ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
      <div className="text-center pt-6">
        <button type="submit" disabled={isSubmitting}
          className="px-12 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-slate-400">
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  );
};

export default GeneralFeedback;