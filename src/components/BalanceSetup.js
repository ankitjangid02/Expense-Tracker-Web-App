import React, { useState } from 'react';
import './BalanceSetup.css';

const BalanceSetup = ({ onSetBalance }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const balanceAmount = parseFloat(amount);
    
    if (isNaN(balanceAmount) || balanceAmount < 0) {
      setError('Please enter a valid positive number');
      return;
    }
    
    onSetBalance(balanceAmount);
  };

  return (
    <div className="balance-setup">
      <div className="setup-container">
        <h1>Welcome to Expense Tracker</h1>
        <p>Please enter your initial balance to get started</p>
        
        <form onSubmit={handleSubmit} className="balance-form">
          <div className="input-group">
            <label htmlFor="balance">Initial Balance (₹)</label>
            <input
              type="number"
              id="balance"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              placeholder="Enter your initial balance"
              step="0.01"
              required
            />
          </div>
          
          {error && <div className="error">{error}</div>}
          
          <button type="submit" className="submit-btn">
            Set Balance & Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default BalanceSetup;