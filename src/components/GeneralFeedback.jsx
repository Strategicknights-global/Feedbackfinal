// src/components/GeneralFeedback.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { FaRegSmileBeam, FaRegSmile, FaRegMeh, FaRegFrown, FaRegAngry, FaPaperPlane } from 'react-icons/fa';

// Map rating values to their corresponding icons
const ratingIcons = {
  5: FaRegSmileBeam,
  4: FaRegSmile,
  3: FaRegMeh,
  2: FaRegFrown,
  1: FaRegAngry,
};

const GeneralFeedback = ({ form }) => {
  const [questions, setQuestions] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  
  const currentUser = auth.currentUser;

  // Fetch questions (this logic remains the same)
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!form.id) return;
      setLoading(true);
      try {
        const q = query(collection(db, "questions"), where("formId", "==", form.id));
        const querySnapshot = await getDocs(q);
        const questionsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuestions(questionsList);
        setRatings({});
      } catch (error) {
        console.error("Error fetching questions: ", error);
        setMessage("Error: Could not load questions.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [form.id]);

  const handleRatingChange = (questionId, value) => {
    setRatings(prev => ({ ...prev, [questionId]: parseInt(value, 10) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // (Submit logic remains the same)
    if (Object.keys(ratings).length !== questions.length) {
      setMessage("Error: Please answer all questions before submitting.");
      return;
    }
    setIsSubmitting(true);
    setMessage('');
    try {
      await addDoc(collection(db, 'feedback'), {
        formId: form.id, formName: form.name, userId: currentUser.uid, userEmail: currentUser.email,
        ratings: ratings, submittedAt: serverTimestamp()
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

  if (loading) return <p className="text-center">Loading questions...</p>;

  return (
    <form onSubmit={handleSubmit}>
      {questions.map(question => (
        // This is the main container for one question row
        <div key={question.id} className="feedback-row">
          <p className="question-text">{question.text} *</p>
          
          {/* This group holds the 5 rating options */}
          <div className="rating-group">
            {[5, 4, 3, 2, 1].map(value => {
              const IconComponent = ratingIcons[value];
              const isSelected = ratings[question.id] === value;
              return (
                // Each option is a clickable label
                <label key={value} className={`rating-option ${isSelected ? `selected rating-${value}` : ''}`}>
                   <input
                    type="radio"
                    name={question.id}
                    value={value}
                    checked={isSelected}
                    onChange={() => handleRatingChange(question.id, value)}
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
        </div>
      ))}
      
      {message && (
        <p className={`text-center font-bold my-4 ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>
      )}

      {questions.length > 0 && (
        <div className="text-center mt-8">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : <><FaPaperPlane /> Submit Feedback</>}
          </button>
        </div>
      )}
    </form>
  );
};

export default GeneralFeedback;