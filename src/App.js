import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { addTransaction, getUserTransactions, deleteTransaction } from './services/firestoreService';
import './App.css';
import './themes/darkMode.css';

// Components
import AuthContainer from './components/AuthContainer';
import Navbar from './components/Navbar';
import BalanceSetup from './components/BalanceSetup';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Reports from './components/Reports';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/auth" />;
};

// Main App Component
function AppContent() {
  const { currentUser, userProfile, updateUserBalance } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsBalanceSetup, setNeedsBalanceSetup] = useState(false);

  // Load user data on auth state change
  useEffect(() => {
    const loadUserData = async () => {
      console.log('App loadUserData called - currentUser:', !!currentUser, 'userProfile:', !!userProfile);
      
      if (currentUser && userProfile) {
        try {
          console.log('Loading user transactions for:', currentUser.uid);
          setLoading(true);
          
          console.log('Calling getUserTransactions...');
          const result = await getUserTransactions(currentUser.uid);
          console.log('getUserTransactions result:', result);
          
          if (result.success) {
            console.log('Successfully loaded', result.data.length, 'transactions');
            console.log('Transaction data structure:', result.data);
            setExpenses(result.data || []);
          } else {
            console.error('Failed to load transactions:', result.error);
            console.error('Error details:', result);
            setExpenses([]);
          }
          
          // Check if user needs to set up initial balance
          if (typeof userProfile.currentBalance === 'undefined' || userProfile.currentBalance === null) {
            console.log('User needs balance setup');
            setNeedsBalanceSetup(true);
          } else {
            console.log('User balance exists:', userProfile.currentBalance);
            setNeedsBalanceSetup(false);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setExpenses([]);
        } finally {
          setLoading(false);
        }
      } else if (currentUser && !userProfile) {
        // User is logged in but profile not loaded yet
        console.log('User logged in, waiting for profile...');
        // Set a timeout to prevent infinite waiting
        setTimeout(() => {
          if (!userProfile) {
            console.log('Profile loading timeout, setting loading to false');
            setLoading(false);
          }
        }, 3000);
      } else {
        // User not logged in
        console.log('No user, clearing data and stopping loading');
        setExpenses([]);
        setNeedsBalanceSetup(false);
        setLoading(false);
      }
    };

    // Add a small delay to prevent immediate loading state
    const timeoutId = setTimeout(loadUserData, 100);
    return () => clearTimeout(timeoutId);
  }, [currentUser, userProfile]);

  const addExpense = async (expenseData) => {
    if (!currentUser || !userProfile) {
      console.error('Cannot add expense: user or profile not available');
      return;
    }

    try {
      console.log('Adding expense:', expenseData);
      const result = await addTransaction(currentUser.uid, expenseData);
      if (result.success) {
        console.log('Transaction added successfully:', result.data);
        
        // Add to local state immediately for UI responsiveness
        const newTransaction = {
          ...result.data,
          id: result.data.id || result.id
        };
        console.log('Adding transaction to local state:', newTransaction);
        setExpenses(prev => {
          console.log('Previous expenses count:', prev.length);
          const updated = [newTransaction, ...prev];
          console.log('New expenses count:', updated.length);
          return updated;
        });
        
        // Update user balance
        const currentBalance = userProfile.currentBalance || 0;
        const newBalance = currentBalance + 
          (expenseData.type === 'credit' ? 
            parseFloat(expenseData.amount) : 
            -parseFloat(expenseData.amount));
        
        console.log('Updating balance from', currentBalance, 'to', newBalance);
        const updateResult = await updateUserBalance(newBalance);
        
        if (!updateResult.success) {
          console.error('Failed to update balance:', updateResult.error);
        }
        
        // Show success message
        if (expenseData.type === 'credit') {
          console.log(`💰 Income of ₹${expenseData.amount} added successfully!`);
        } else {
          console.log(`💸 Expense of ₹${expenseData.amount} recorded successfully!`);
        }
      } else {
        console.error('Failed to add transaction:', result.error);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const deleteExpense = async (transactionId, transactionAmount, transactionType) => {
    if (!currentUser || !userProfile) {
      console.error('Cannot delete expense: user or profile not available');
      return;
    }

    try {
      console.log('Deleting transaction:', transactionId, 'Amount:', transactionAmount, 'Type:', transactionType);
      const result = await deleteTransaction(transactionId);
      
      if (result.success) {
        console.log('Transaction deleted successfully from Firestore');
        
        // Remove from local state
        setExpenses(prev => {
          const updated = prev.filter(expense => expense.id !== transactionId);
          console.log('Removed transaction from local state. New count:', updated.length);
          return updated;
        });
        
        // Update user balance - reverse the transaction
        const currentBalance = userProfile.currentBalance || 0;
        const balanceAdjustment = transactionType === 'credit' ? 
          -parseFloat(transactionAmount) : // Remove income (subtract)
          parseFloat(transactionAmount);   // Remove expense (add back)
        
        const newBalance = currentBalance + balanceAdjustment;
        
        console.log('Updating balance from', currentBalance, 'to', newBalance, 'adjustment:', balanceAdjustment);
        const updateResult = await updateUserBalance(newBalance);
        
        if (!updateResult.success) {
          console.error('Failed to update balance after deletion:', updateResult.error);
        }
        
        console.log('Transaction deleted successfully!');
      } else {
        console.error('Failed to delete transaction:', result.error);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const setInitialBalance = async (amount) => {
    if (!currentUser) return;

    try {
      console.log('Setting initial balance:', amount);
      const result = await updateUserBalance(parseFloat(amount));
      if (result.success) {
        setNeedsBalanceSetup(false);
        console.log(`🎆 Initial balance of ₹${parseFloat(amount).toFixed(2)} set successfully!`);
      } else {
        console.error(`Failed to set initial balance: ${result.error}`);
      }
    } catch (error) {
      console.error('Error setting initial balance:', error);
    }
  };

  // Show loading spinner
  if (loading) {
    return <LoadingSpinner text="Initializing your expense tracker..." debug={true} />;
  }

  // Show auth screen if not logged in
  if (!currentUser) {
    return <AuthContainer />;
  }

  // Show balance setup if needed
  if (needsBalanceSetup) {
    return <BalanceSetup onSetBalance={setInitialBalance} />;
  }

  const currentBalance = userProfile?.currentBalance || 0;
  console.log('App - currentBalance calculated:', currentBalance, 'from userProfile:', userProfile?.currentBalance);

  return (
    <Router>
      <div className="App">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Navbar />
          <div className="container">
            <AnimatePresence mode="wait">
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      {(() => {
                        console.log('Rendering Dashboard with:', { 
                          balance: currentBalance, 
                          expensesCount: expenses?.length || 0,
                          expenses: expenses 
                        });
                        return (
                          <Dashboard 
                            balance={currentBalance} 
                            expenses={expenses} 
                            userProfile={userProfile}
                            onDeleteExpense={deleteExpense}
                          />
                        );
                      })()}
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/add-expense" 
                  element={
                    <ProtectedRoute>
                      <ExpenseForm onAddExpense={addExpense} />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/expenses" 
                  element={
                    <ProtectedRoute>
                      <ExpenseList expenses={expenses} onDeleteExpense={deleteExpense} />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute>
                      <Reports expenses={expenses} />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/auth" element={<AuthContainer />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
