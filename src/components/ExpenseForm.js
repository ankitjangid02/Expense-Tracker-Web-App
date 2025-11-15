import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExpenseForm.css';

const ExpenseForm = ({ onAddExpense }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    type: 'debit'
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    
    if (!formData.reason.trim()) {
      setError('Please enter a reason for this expense');
      return;
    }

    onAddExpense({
      amount: amount,
      reason: formData.reason.trim(),
      type: formData.type
    });

    // Reset form
    setFormData({
      amount: '',
      reason: '',
      type: 'debit'
    });

    // Navigate back to dashboard
    navigate('/');
  };

  return (
    <div className="expense-form-container">
      <div className="form-wrapper">
        <h2>Add New Expense</h2>
        
        <form onSubmit={handleSubmit} className="expense-form">
          <div className="input-group">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              step="0.01"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reason">Reason</label>
            <input
              type="text"
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Enter reason for expense"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="type">Transaction Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="debit">Money Debited (Expense)</option>
              <option value="credit">Money Credited (Income)</option>
            </select>
          </div>

          <div className="date-time-display">
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="button-group">
            <button type="submit" className="submit-btn">
              Add {formData.type === 'debit' ? 'Expense' : 'Income'}
            </button>
            <button type="button" onClick={() => navigate('/')} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;