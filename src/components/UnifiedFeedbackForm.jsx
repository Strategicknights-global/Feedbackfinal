// src/components/UnifiedFeedbackForm.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { FaWpforms } from 'react-icons/fa';

// Import your two main form components
import GeneralFeedback from './GeneralFeedback';
import SubjectFeedbackGrid from './SubjectFeedbackGrid';

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

  // --- THIS IS THE RENDERING LOGIC ---
  const renderSelectedForm = () => {
    // If no form is selected, show nothing.
    if (!selectedForm) {
      return null;
    }

    // Check the 'type' of the selected form.
    // This is why adding the 'type' in the Admin Panel was crucial.
    switch (selectedForm.type) {
      case 'subject':
        // If the form type is 'subject', render the grid component.
        // The grid component itself contains the SemesterSelector logic.
        return <SubjectFeedbackGrid form={selectedForm} />;
      
      case 'general':
        // If the form type is 'general', render the vertical list component.
        return <GeneralFeedback form={selectedForm} />;
      
      default:
        // As a fallback, render the general form if type is missing or unknown.
        console.warn(`Unknown or missing form type for form: ${selectedForm.name}. Defaulting to general layout.`);
        return <GeneralFeedback form={selectedForm} />;
    }
  };

  return (
    <div className="content-card">
      <div className="text-center mb-10">
        <h1 className="page-title">
          <FaWpforms />
          Student Feedback Portal
        </h1>
        <p className="mt-2 text-slate-600">Your feedback helps us improve.</p>
      </div>

      <div className="form-group">
        <label htmlFor="form-selection" className="block text-lg font-semibold text-slate-800 mb-3">Select Feedback Form</label>
        {loading ? (
          <p>Loading forms...</p>
        ) : (
          <select 
            id="form-selection"
            className="form-select"
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

      {/* --- This is where the magic happens --- */}
      {/* The renderSelectedForm function will now show the correct component. */}
      {selectedForm && (
        <div className="mt-12">
          {renderSelectedForm()}
        </div>
      )}
    </div>
  );
}

export default UnifiedFeedbackForm;