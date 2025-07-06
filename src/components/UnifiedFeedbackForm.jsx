// src/components/UnifiedFeedbackForm.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import GeneralFeedback from './GeneralFeedback';      // Import the general form
import SubjectFeedbackGrid from './SubjectFeedbackGrid';  // Import the subject grid form

function UnifiedFeedbackForm() {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null); // Will store the entire form object
  const [loading, setLoading] = useState(true);

  // Fetch all available feedback forms on component mount
  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      try {
        const formsSnapshot = await getDocs(collection(db, 'forms'));
        const formsList = formsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setForms(formsList);
      } catch (error) {
        console.error("Error fetching forms: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  const handleFormChange = (e) => {
    const formId = e.target.value;
    if (formId) {
      const formObject = forms.find(f => f.id === formId);
      setSelectedForm(formObject);
    } else {
      setSelectedForm(null);
    }
  };

  return (
    <div className="w-full bg-slate-50 rounded-2xl shadow-2xl p-6 sm:p-10 my-8 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">
          Student Feedback Portal
        </h1>
        <p className="mt-2 text-slate-600">Your feedback helps us improve.</p>
      </div>

      <div className="mb-8">
        <label htmlFor="form-selection" className="block text-lg font-semibold text-slate-800 mb-3">Select Feedback Form</label>
        {loading ? (
          <p>Loading forms...</p>
        ) : (
          <select 
            id="form-selection"
            className="w-full max-w-sm p-3 bg-white border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500"
            onChange={handleFormChange}
            defaultValue=""
          >
            <option value="" disabled>-- Choose a form to begin --</option>
            {forms.map(form => (
              <option key={form.id} value={form.id}>{form.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* --- CONDITIONAL RENDERING LOGIC --- */}
      {/* This is the core of the new system. It checks the 'type' of the selected form. */}
      {selectedForm && (
        <div className="mt-12">
          {selectedForm.type === 'subject' ? (
            // If the form type is 'subject', render the grid component
            <SubjectFeedbackGrid form={selectedForm} />
          ) : (
            // Otherwise, render the general feedback component
            <GeneralFeedback form={selectedForm} />
          )}
        </div>
      )}
    </div>
  );
}

export default UnifiedFeedbackForm;