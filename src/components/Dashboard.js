import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = ({ balance, expenses, onDeleteExpense }) => {
  console.log('Dashboard received expenses:', expenses?.length || 0, 'items');
  console.log('Dashboard expenses data:', expenses);
  
  const recentExpenses = expenses.slice(-5).reverse(); // Show last 5 expenses
  const totalExpenses = expenses
    .filter(expense => {
      const isDebit = expense.type === 'debit';
      console.log('Expense filter - type:', expense.type, 'isDebit:', isDebit, 'amount:', expense.amount);
      return isDebit;
    })
    .reduce((sum, expense) => {
      const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount;
      console.log('Adding expense amount:', amount, 'to sum:', sum);
      return sum + amount;
    }, 0);
    
  const totalIncome = expenses
    .filter(expense => expense.type === 'credit')
    .reduce((sum, expense) => {
      const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount;
      return sum + amount;
    }, 0);
    
  console.log('Dashboard totals - Expenses:', totalExpenses, 'Income:', totalIncome);
  
  useEffect(() => {
    console.log('Dashboard useEffect - expenses changed, new count:', expenses?.length || 0);
  }, [expenses]);

  const handleDeleteExpense = async (transactionId, amount, type, reason) => {
    if (window.confirm(`Are you sure you want to delete this ${type === 'debit' ? 'expense' : 'income'}: ${reason} (₹${parseFloat(amount).toFixed(2)})?`)) {
      await onDeleteExpense(transactionId, amount, type);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <Link to="/add-expense" className="quick-add-btn">
          + Add Expense
        </Link>
      </div>

      <div className="balance-cards">
        <div className="balance-card current-balance">
          <h3>Current Balance</h3>
          <p className={`balance-amount ${balance < 0 ? 'negative' : 'positive'}`}>
            ₹{balance.toFixed(2)}
          </p>
        </div>
        
        <div className="balance-card total-expenses">
          <h3>Total Expenses</h3>
          <p className="expense-amount">
            ₹{totalExpenses.toFixed(2)}
          </p>
        </div>
        
        <div className="balance-card total-income">
          <h3>Total Income</h3>
          <p className="income-amount">
            ₹{totalIncome.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="recent-transactions">
        <div className="section-header">
          <h2>Recent Transactions</h2>
          <Link to="/expenses" className="view-all-link">
            View All
          </Link>
        </div>
        
        {recentExpenses.length === 0 ? (
          <div className="no-transactions">
            <p>No transactions yet. <Link to="/add-expense">Add your first expense</Link></p>
          </div>
        ) : (
          <div className="transactions-list">
            {recentExpenses.map(expense => (
              <div key={expense.id} className={`transaction-item ${expense.type}`}>
                <div className="transaction-info">
                  <h4>{expense.reason}</h4>
                  <p className="transaction-date">{expense.date} at {expense.time}</p>
                </div>
                <div className="transaction-right">
                  <div className={`transaction-amount ${expense.type}`}>
                    {expense.type === 'debit' ? '-' : '+'}₹{
                      (typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount).toFixed(2)
                    }
                  </div>
                  <button 
                    className="delete-btn-small"
                    onClick={() => handleDeleteExpense(expense.id, expense.amount, expense.type, expense.reason)}
                    title="Delete transaction"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/add-expense" className="action-btn">
            Add Transaction
          </Link>
          <Link to="/expenses" className="action-btn">
            View Expenses
          </Link>
          <Link to="/reports" className="action-btn">
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;