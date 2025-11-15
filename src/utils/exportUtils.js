import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Export transactions to Excel
export const exportToExcel = (transactions, filename = 'transactions') => {
  try {
    // Prepare data for Excel
    const excelData = transactions.map((transaction, index) => ({
      'S.No': index + 1,
      'Date': transaction.date,
      'Time': transaction.time || 'N/A',
      'Reason': transaction.reason,
      'Amount (₹)': parseFloat(transaction.amount).toFixed(2),
      'Type': transaction.type === 'debit' ? 'Expense (Debited)' : 'Income (Credited)',
      'Balance Impact': transaction.type === 'debit' ? `-₹${parseFloat(transaction.amount).toFixed(2)}` : `+₹${parseFloat(transaction.amount).toFixed(2)}`
    }));

    // Calculate summary
    const totalExpenses = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalIncome = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const netBalance = totalIncome - totalExpenses;

    // Add summary rows
    excelData.push({});
    excelData.push({
      'S.No': 'SUMMARY',
      'Date': '',
      'Time': '',
      'Reason': '',
      'Amount (₹)': '',
      'Type': '',
      'Balance Impact': ''
    });
    excelData.push({
      'S.No': '',
      'Date': '',
      'Time': '',
      'Reason': 'Total Expenses',
      'Amount (₹)': totalExpenses.toFixed(2),
      'Type': 'Debited',
      'Balance Impact': `-₹${totalExpenses.toFixed(2)}`
    });
    excelData.push({
      'S.No': '',
      'Date': '',
      'Time': '',
      'Reason': 'Total Income',
      'Amount (₹)': totalIncome.toFixed(2),
      'Type': 'Credited',
      'Balance Impact': `+₹${totalIncome.toFixed(2)}`
    });
    excelData.push({
      'S.No': '',
      'Date': '',
      'Time': '',
      'Reason': 'Net Balance',
      'Amount (₹)': Math.abs(netBalance).toFixed(2),
      'Type': netBalance >= 0 ? 'Positive' : 'Negative',
      'Balance Impact': netBalance >= 0 ? `+₹${netBalance.toFixed(2)}` : `-₹${Math.abs(netBalance).toFixed(2)}`
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Auto-size columns
    const colWidths = [
      { wch: 8 },  // S.No
      { wch: 12 }, // Date
      { wch: 12 }, // Time
      { wch: 30 }, // Reason
      { wch: 12 }, // Amount
      { wch: 18 }, // Type
      { wch: 15 }  // Balance Impact
    ];
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, finalFilename);
    
    return { success: true, filename: finalFilename };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: error.message };
  }
};

// Export reports to PDF
export const exportReportToPDF = (reportData, reportType = 'monthly') => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('Expense Tracker Report', 20, 20);
    
    // Add report type and date
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, 20, 35);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    
    let yPosition = 60;

    // Add summary statistics
    if (reportData.summary) {
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text('Summary Statistics', 20, yPosition);
      yPosition += 15;

      const summaryData = [
        ['Total Expenses', `₹${reportData.summary.totalExpenses || 0}`],
        ['Total Income', `₹${reportData.summary.totalIncome || 0}`],
        ['Net Savings', `₹${(reportData.summary.totalIncome || 0) - (reportData.summary.totalExpenses || 0)}`],
        ['Total Transactions', reportData.summary.totalTransactions || 0]
      ];

      doc.autoTable({
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [102, 126, 234] },
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }

    // Add transaction details if available
    if (reportData.transactions && reportData.transactions.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text('Transaction Details', 20, yPosition);
      yPosition += 15;

      const transactionData = reportData.transactions.slice(0, 50).map((transaction, index) => [
        index + 1,
        transaction.date,
        transaction.reason,
        `₹${parseFloat(transaction.amount).toFixed(2)}`,
        transaction.type === 'debit' ? 'Expense' : 'Income'
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['#', 'Date', 'Reason', 'Amount', 'Type']],
        body: transactionData,
        theme: 'striped',
        headStyles: { fillColor: [102, 126, 234] },
        styles: { fontSize: 8 },
      });
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `expense_report_${reportType}_${timestamp}.pdf`;

    // Save PDF
    doc.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, error: error.message };
  }
};

// Export specific date range to Excel
export const exportDateRangeToExcel = (transactions, startDate, endDate) => {
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return transactionDate >= start && transactionDate <= end;
  });

  const filename = `transactions_${startDate}_to_${endDate}`;
  return exportToExcel(filteredTransactions, filename);
};

// Helper function to format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

// Helper function to calculate report data
export const calculateReportData = (transactions) => {
  const totalExpenses = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const totalIncome = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return {
    totalExpenses: totalExpenses.toFixed(2),
    totalIncome: totalIncome.toFixed(2),
    netSavings: (totalIncome - totalExpenses).toFixed(2),
    totalTransactions: transactions.length,
    transactions
  };
};