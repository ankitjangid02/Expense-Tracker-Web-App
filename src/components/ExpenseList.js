import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './ExpenseList.css';

const ExpenseList = ({ expenses, onDeleteExpense }) => {
  const [searchParams] = useSearchParams();
  const [filteredExpenses, setFilteredExpenses] = useState(expenses);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    let filtered = [...expenses];
    
    // Apply date filter if URL parameters exist
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (startDate && endDate) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return expenseDate >= start && expenseDate <= end;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = parseFloat(a.amount);
          bValue = parseFloat(b.amount);
          break;
        case 'reason':
          aValue = a.reason.toLowerCase();
          bValue = b.reason.toLowerCase();
          break;
        default: // date
          aValue = new Date(a.date + ' ' + a.time);
          bValue = new Date(b.date + ' ' + b.time);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredExpenses(filtered);
  }, [expenses, searchParams, sortBy, sortOrder]);

  const getTotalAmount = (type) => {
    return filteredExpenses
      .filter(expense => expense.type === type)
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  };

  const clearFilters = () => {
    window.location.href = '/expenses';
  };

  const handleDeleteExpense = async (transactionId, amount, type, reason) => {
    if (window.confirm(`Are you sure you want to delete this ${type === 'debit' ? 'expense' : 'income'}: ${reason} (₹${parseFloat(amount).toFixed(2)})?`)) {
      await onDeleteExpense(transactionId, amount, type);
    }
  };

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const hasDateFilter = startDate && endDate;

  return (
    <div className="expense-list">
      <div className="list-header">
        <h1>Expense List</h1>
        {hasDateFilter && (
          <div className="filter-info">
            <p>Showing expenses from {startDate} to {endDate}</p>
            <button onClick={clearFilters} className="clear-filter-btn">
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="no-expenses">
          <p>
            {hasDateFilter 
              ? 'No expenses found for the selected date range.' 
              : 'No expenses recorded yet.'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="summary-cards">
            <div className="summary-card expenses">
              <h3>Total Expenses</h3>
              <p>₹{getTotalAmount('debit').toFixed(2)}</p>
            </div>
            <div className="summary-card income">
              <h3>Total Income</h3>
              <p>₹{getTotalAmount('credit').toFixed(2)}</p>
            </div>
            <div className="summary-card net">
              <h3>Net Amount</h3>
              <p className={getTotalAmount('credit') - getTotalAmount('debit') >= 0 ? 'positive' : 'negative'}>
                ₹{(getTotalAmount('credit') - getTotalAmount('debit')).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="list-controls">
            <div className="sort-controls">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="reason">Reason</option>
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          <div className="expenses-table">
            <div className="table-header">
              <div>Date & Time</div>
              <div>Reason</div>
              <div>Type</div>
              <div>Amount</div>
              <div>Actions</div>
            </div>
            
            {filteredExpenses.map(expense => (
              <div key={expense.id} className={`table-row ${expense.type}`}>
                <div className="date-time">
                  <div>{expense.date}</div>
                  <div className="time">{expense.time}</div>
                </div>
                <div className="reason">{expense.reason}</div>
                <div className={`type ${expense.type}`}>
                  {expense.type === 'debit' ? 'Expense' : 'Income'}
                </div>
                <div className={`amount ${expense.type}`}>
                  {expense.type === 'debit' ? '-' : '+'}₹{parseFloat(expense.amount).toFixed(2)}
                </div>
                <div className="actions">
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteExpense(expense.id, expense.amount, expense.type, expense.reason)}
                    title="Delete transaction"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseList;