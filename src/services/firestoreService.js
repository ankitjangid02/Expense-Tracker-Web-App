import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';

// User operations
export const createUserProfile = async (uid, userData) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...userData,
      createdAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserBalance = async (uid, newBalance) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      currentBalance: newBalance,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user balance:', error);
    return { success: false, error: error.message };
  }
};

// Transaction operations
export const addTransaction = async (uid, transactionData) => {
  try {
    console.log('addTransaction called with:');
    console.log('- uid:', uid);
    console.log('- transactionData:', transactionData);
    
    const fullTransactionData = {
      ...transactionData,
      userId: uid,
      createdAt: new Date().toISOString(),
      date: transactionData.date || new Date().toISOString().split('T')[0],
      time: transactionData.time || new Date().toLocaleTimeString()
    };
    
    console.log('Full transaction data to save:', fullTransactionData);
    console.log('Attempting to save to Firestore collection: transactions');
    
    const transactionRef = await addDoc(collection(db, 'transactions'), fullTransactionData);
    
    const resultData = {
      ...fullTransactionData,
      id: transactionRef.id
    };
    
    console.log('Transaction successfully saved to Firestore with ID:', transactionRef.id);
    console.log('Complete result data:', resultData);
    
    return { 
      success: true, 
      id: transactionRef.id,
      data: resultData
    };
  } catch (error) {
    console.error('Error adding transaction:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    return { success: false, error: error.message };
  }
};

export const getUserTransactions = async (uid) => {
  try {
    console.log('getUserTransactions called with uid:', uid);
    console.log('Database instance:', db);
    
    // First try without ordering to see if that's the issue
    console.log('Attempting to query transactions collection...');
    
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', uid)
      // Temporarily remove orderBy to test
    );
    
    console.log('Query created, attempting to fetch documents...');
    const querySnapshot = await getDocs(q);
    console.log('Query executed, snapshot size:', querySnapshot.size);
    
    const transactions = [];
    
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      console.log('Processing document:', doc.id, 'with data:', docData);
      transactions.push({
        id: doc.id,
        ...docData
      });
    });
    
    // Sort by createdAt in JavaScript instead
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log('Final transactions array:', transactions);
    return { success: true, data: transactions };
  } catch (error) {
    console.error('Error getting user transactions:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error object:', error);
    return { success: false, error: error.message };
  }
};

export const updateTransaction = async (transactionId, updateData) => {
  try {
    await updateDoc(doc(db, 'transactions', transactionId), {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return { success: false, error: error.message };
  }
};

export const deleteTransaction = async (transactionId) => {
  try {
    await deleteDoc(doc(db, 'transactions', transactionId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return { success: false, error: error.message };
  }
};

// Get transactions within date range
export const getTransactionsInDateRange = async (uid, startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', uid),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const transactions = [];
    
    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: transactions };
  } catch (error) {
    console.error('Error getting transactions in date range:', error);
    return { success: false, error: error.message };
  }
};

// Analytics operations
export const getTransactionStats = async (uid) => {
  try {
    const transactions = await getUserTransactions(uid);
    
    if (!transactions.success) {
      return transactions;
    }
    
    const data = transactions.data;
    const totalExpenses = data
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalIncome = data
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const netSavings = totalIncome - totalExpenses;
    
    // Category breakdown
    const categories = {};
    data
      .filter(t => t.type === 'debit')
      .forEach(t => {
        const category = t.reason.toLowerCase();
        categories[category] = (categories[category] || 0) + parseFloat(t.amount);
      });
    
    return {
      success: true,
      data: {
        totalExpenses: totalExpenses.toFixed(2),
        totalIncome: totalIncome.toFixed(2),
        netSavings: netSavings.toFixed(2),
        totalTransactions: data.length,
        categories,
        transactions: data
      }
    };
  } catch (error) {
    console.error('Error getting transaction stats:', error);
    return { success: false, error: error.message };
  }
};

// Delete all user data
export const deleteUserData = async (uid) => {
  try {
    console.log('Starting deletion of all data for user:', uid);
    
    // Delete all user transactions
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', uid)
    );
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    console.log(`Found ${transactionsSnapshot.size} transactions to delete`);
    
    const deletePromises = [];
    transactionsSnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    // Delete user profile
    deletePromises.push(deleteDoc(doc(db, 'users', uid)));
    
    // Execute all deletions
    await Promise.all(deletePromises);
    
    console.log('All user data deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user data:', error);
    return { success: false, error: error.message };
  }
};
