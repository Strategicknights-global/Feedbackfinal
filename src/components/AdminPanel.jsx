import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { FaTrash, FaPlus, FaSave, FaChartBar } from 'react-icons/fa';
import './AdminPanel.css';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const AdminPanel = () => {
  const [forms, setForms] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [newFormName, setNewFormName] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [selectedFormId, setSelectedFormId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingForm, setCreatingForm] = useState(false);
  const [creatingQuestion, setCreatingQuestion] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate hook

  const fetchFormsAndQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const formsSnapshot = await getDocs(collection(db, 'forms'));
      const formsList = formsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setForms(formsList);

      const questionsSnapshot = await getDocs(collection(db, 'questions'));
      const questionsList = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Add form name to each question for display
      const questionsWithFormNames = questionsList.map(q => {
        const form = formsList.find(f => f.id === q.formId);
        return { ...q, formName: form ? form.name : 'Unknown Form' };
      });

      setQuestions(questionsWithFormNames);

      // Automatically select the first form if none is selected and forms exist
      if (formsList.length > 0 && !selectedFormId) {
        setSelectedFormId(formsList[0].id);
      } else if (formsList.length === 0) {
        setSelectedFormId(''); // Clear selection if no forms exist
      }

    } catch (error) {
      console.error("Error fetching data: ", error);
      // Potentially show an error message to the user
    }
    setLoading(false);
  }, [selectedFormId]); // selectedFormId is a dependency if you want it to trigger re-fetch when form changes

  useEffect(() => {
    fetchFormsAndQuestions();
  }, [fetchFormsAndQuestions]);

  // Handler for form selection change
  const handleFormSelectChange = (e) => {
    setSelectedFormId(e.target.value);
  };

  const handleCreateForm = async (e) => {
    e.preventDefault();
    if (!newFormName.trim()) {
      alert("Form name cannot be empty.");
      return;
    }
    setCreatingForm(true);
    try {
      await addDoc(collection(db, 'forms'), { name: newFormName });
      setNewFormName('');
      await fetchFormsAndQuestions(); // Re-fetch to update the lists
    } catch (error) {
      console.error("Error creating form: ", error);
      alert("Failed to create form. Please try again.");
    } finally {
      setCreatingForm(false);
    }
  };

  const handleDeleteForm = async (formId, formName) => {
    if (!window.confirm(`Are you sure you want to delete the form "${formName}"? This will also delete all associated questions and feedback responses related to this form!`)) return;
    setLoading(true); // Show loading when deleting
    try {
      // First, delete all questions associated with this form
      const questionsQuery = query(collection(db, 'questions'), where("formId", "==", formId));
      const questionsSnapshot = await getDocs(questionsQuery);
      const deleteQuestionPromises = questionsSnapshot.docs.map(d => deleteDoc(doc(db, 'questions', d.id)));
      await Promise.all(deleteQuestionPromises);

      // Second, delete all feedback responses associated with this form
      const feedbackQuery = query(collection(db, 'feedback'), where("formId", "==", formId));
      const feedbackSnapshot = await getDocs(feedbackQuery);
      const deleteFeedbackPromises = feedbackSnapshot.docs.map(d => deleteDoc(doc(db, 'feedback', d.id)));
      await Promise.all(deleteFeedbackPromises);

      // Then, delete the form itself
      await deleteDoc(doc(db, 'forms', formId));
      
      // If the deleted form was selected, clear the selection and hide analysis
      if (selectedFormId === formId) {
        setSelectedFormId('');
      }
      await fetchFormsAndQuestions(); // Re-fetch to update the lists
    } catch (error) {
      console.error("Error deleting form: ", error);
      alert("Failed to delete form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) {
      alert("Question text cannot be empty.");
      return;
    }
    if (!selectedFormId) {
      alert("Please select a form to associate the question with.");
      return;
    }
    setCreatingQuestion(true);
    try {
      await addDoc(collection(db, 'questions'), {
        text: newQuestionText,
        formId: selectedFormId
      });
      setNewQuestionText('');
      await fetchFormsAndQuestions(); // Re-fetch to update the lists
    } catch (error) {
      console.error("Error creating question: ", error);
      alert("Failed to create question. Please try again.");
    } finally {
      setCreatingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId, questionText) => {
    if (!window.confirm(`Are you sure you want to delete the question: "${questionText}"?`)) return;
    setLoading(true); // Show loading when deleting
    try {
      await deleteDoc(doc(db, 'questions', questionId));
      await fetchFormsAndQuestions(); // Re-fetch to update the lists
    } catch (error) {
      console.error("Error deleting question: ", error);
      alert("Failed to delete question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // New handler for the "Analyze Feedback" button to navigate
  const handleAnalyzeFeedback = () => {
    if (selectedFormId) {
      navigate('/admin/analysis', { state: { formId: selectedFormId } });
    } else {
      alert("Please select a form to analyze.");
    }
  };

  return (
    <div className="admin-panel-container">
      <h1 className="page-title">Admin Panel</h1>
      {loading && <div className="loading-spinner">Loading data...</div>}

      {!loading && (
        <>
          <div className="admin-panel-grid">
            {/* Left Column: Create Forms and Questions */}
            <div className="admin-panel-column">
              <div className="content-card">
                <h3>Create New Form</h3>
                <form onSubmit={handleCreateForm}>
                  <div className="form-group">
                    <label htmlFor="new-form-name">Form Name</label>
                    <input
                      id="new-form-name"
                      type="text"
                      className="form-input"
                      value={newFormName}
                      onChange={(e) => setNewFormName(e.target.value)}
                      placeholder="e.g., Syllabus Feedback 2024"
                      disabled={creatingForm}
                      aria-describedby="formNameHelp"
                    />
                    <small id="formNameHelp" className="form-help-text">Enter a descriptive name for your new feedback form.</small>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={creatingForm}>
                    {creatingForm ? 'Creating...' : <><FaPlus /> Create Form</>}
                  </button>
                </form>
              </div>

              <div className="content-card">
                <h3>Add New Question</h3>
                <form onSubmit={handleCreateQuestion}>
                  <div className="form-group">
                    <label htmlFor="question-text">Question Text</label>
                    <input
                      id="question-text"
                      type="text"
                      className="form-input"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="e.g., The syllabus is relevant."
                      disabled={creatingQuestion}
                      aria-describedby="questionTextHelp"
                    />
                    <small id="questionTextHelp" className="form-help-text">Type the question you want to add to a form.</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="form-select">Assign to Form</label>
                    <select
                      id="form-select"
                      className="form-select"
                      value={selectedFormId}
                      onChange={handleFormSelectChange}
                      disabled={creatingQuestion || forms.length === 0}
                      aria-describedby="formSelectHelp"
                    >
                      <option value="">{forms.length === 0 ? 'No forms available' : 'Select a form'}</option>
                      {forms.map(form => (
                        <option key={form.id} value={form.id}>{form.name}</option>
                      ))}
                    </select>
                    <small id="formSelectHelp" className="form-help-text">Choose which existing form this question belongs to.</small>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={creatingQuestion || !selectedFormId}>
                    {creatingQuestion ? 'Adding...' : <><FaSave /> Add Question</>}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Existing Forms and Questions */}
            <div className="admin-panel-column">
              <div className="content-card">
                <h3>Existing Forms ({forms.length})</h3>
                {forms.length === 0 ? (
                  <p className="no-items-message">No forms created yet. Start by creating one!</p>
                ) : (
                  <div className="list-container">
                    {forms.map(form => (
                      <div
                        key={form.id}
                        className={`list-item ${selectedFormId === form.id ? 'selected-item' : ''}`}
                        onClick={() => setSelectedFormId(form.id)}
                      >
                        <span className="list-item__text">{form.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteForm(form.id, form.name); }}
                          className="btn btn-danger btn-icon"
                          title={`Delete form: ${form.name}`}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="form-group" style={{marginTop: '1.5rem', display: 'flex', justifyContent: 'center'}}>
                    <label htmlFor="select-form-for-analysis" className="sr-only">Select Form for Analysis</label>
                    <select
                      id="select-form-for-analysis"
                      className="form-select"
                      value={selectedFormId}
                      onChange={handleFormSelectChange}
                      disabled={forms.length === 0}
                      aria-label="Select form to view details or analyze feedback"
                      style={{ maxWidth: '250px', marginRight: '1rem' }}
                    >
                      <option value="">{forms.length === 0 ? 'No forms available' : 'Select form for details/analysis'}</option>
                      {forms.map(form => (
                        <option key={form.id} value={form.id}>{form.name}</option>
                      ))}
                    </select>
                    <button
                        onClick={handleAnalyzeFeedback} // Call the new navigation handler
                        className="btn btn-primary"
                        disabled={!selectedFormId}
                        title={selectedFormId ? "Analyze feedback for selected form" : "Select a form to analyze"}
                    >
                        <FaChartBar /> Analyze Feedback
                    </button>
                </div>
              </div>

              <div className="content-card">
                <h3>Existing Questions ({questions.filter(q => q.formId === selectedFormId).length} for selected form)</h3>
                <p className="form-help-text">Showing questions for: <strong>{forms.find(f => f.id === selectedFormId)?.name || 'No form selected'}</strong></p>
                
                {questions.filter(q => q.formId === selectedFormId).length === 0 ? (
                  <p className="no-items-message">No questions added yet for the selected form. Add some!</p>
                ) : (
                  <div className="list-container">
                    {questions
                      .filter(q => q.formId === selectedFormId) // Filter questions by selected form
                      .map(q => (
                        <div key={q.id} className="list-item">
                          <div className="list-item__text">
                            <span>{q.text}</span>
                            <small className="list-item__subtext">Form: {q.formName}</small>
                          </div>
                          <button
                            onClick={() => handleDeleteQuestion(q.id, q.text)}
                            className="btn btn-danger btn-icon"
                            title={`Delete question: ${q.text}`}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;