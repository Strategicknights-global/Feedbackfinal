import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { FaTrash } from 'react-icons/fa';

const AdminPanel = () => {
  const [forms, setForms] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [newFormName, setNewFormName] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [selectedFormId, setSelectedFormId] = useState('');
  const [loading, setLoading] = useState(true);

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
        return {...q, formName: form ? form.name : 'Unknown Form'};
      });

      setQuestions(questionsWithFormNames);

      if (formsList.length > 0 && !selectedFormId) {
        setSelectedFormId(formsList[0].id);
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
    setLoading(false);
  }, [selectedFormId]);

  useEffect(() => {
    fetchFormsAndQuestions();
  }, [fetchFormsAndQuestions]);

  const handleCreateForm = async (e) => {
    e.preventDefault();
    if (!newFormName.trim()) return;
    try {
      await addDoc(collection(db, 'forms'), { name: newFormName });
      setNewFormName('');
      fetchFormsAndQuestions();
    } catch (error) {
      console.error("Error creating form: ", error);
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!window.confirm("Are you sure? This will also delete all associated questions!")) return;
    try {
      // First, delete all questions associated with this form
      const q = query(collection(db, 'questions'), where("formId", "==", formId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, 'questions', d.id)));
      await Promise.all(deletePromises);
      
      // Then, delete the form itself
      await deleteDoc(doc(db, 'forms', formId));
      fetchFormsAndQuestions();
    } catch (error) {
      console.error("Error deleting form: ", error);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !selectedFormId) return;
    try {
      await addDoc(collection(db, 'questions'), {
        text: newQuestionText,
        formId: selectedFormId
      });
      setNewQuestionText('');
      fetchFormsAndQuestions();
    } catch (error) {
      console.error("Error creating question: ", error);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteDoc(doc(db, 'questions', questionId));
      fetchFormsAndQuestions();
    } catch (error) {
      console.error("Error deleting question: ", error);
    }
  };

  return (
    <div>
      <h1 className="page-title">Admin Panel</h1>
      {loading ? <div className="loading-spinner"></div> : (
        <div className="admin-panel">
          <div className="admin-panel__column">
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
                  />
                </div>
                <button type="submit" className="btn-primary">Create Form</button>
              </form>
            </div>
            <div className="content-card" style={{marginTop: '2rem'}}>
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
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="form-select">Assign to Form</label>
                  <select
                    id="form-select"
                    className="form-select"
                    value={selectedFormId}
                    onChange={(e) => setSelectedFormId(e.target.value)}
                  >
                    <option value="">Select a form</option>
                    {forms.map(form => (
                      <option key={form.id} value={form.id}>{form.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary">Add Question</button>
              </form>
            </div>
          </div>
          <div className="admin-panel__column">
            <div className="content-card">
              <h3>Existing Forms</h3>
              <div className="list-container">
                {forms.map(form => (
                  <div key={form.id} className="list-item">
                    <span className="list-item__text">{form.name}</span>
                    <button onClick={() => handleDeleteForm(form.id)} className="btn-danger"><FaTrash /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="content-card" style={{marginTop: '2rem'}}>
              <h3>Existing Questions</h3>
              <div className="list-container">
                {questions.map(q => (
                  <div key={q.id} className="list-item">
                    <div className="list-item__text">
                      {q.text}
                      <small>Form: {q.formName}</small>
                    </div>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="btn-danger"><FaTrash /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;