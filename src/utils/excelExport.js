import * as XLSX from 'exceljs';
import { saveAs } from 'file-saver';

export const exportTransactionsToExcel = async (transactions, userEmail = 'user') => {
  try {
    // Create a new workbook
    const workbook = new XLSX.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Expense Tracker';
    workbook.lastModifiedBy = 'Expense Tracker';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create worksheet
    const worksheet = workbook.addWorksheet('Transactions', {
      properties: { tabColor: { argb: 'FF667eea' } }
    });

    // Define columns
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 12 },
      { header: 'Description', key: 'reason', width: 30 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Running Balance', key: 'runningBalance', width: 18 }
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF667eea' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Calculate running balance and add data
    let runningBalance = 0;
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
    
    // Calculate initial balance from first transaction
    if (sortedTransactions.length > 0) {
      const firstTransaction = sortedTransactions[0];
      if (firstTransaction.type === 'credit') {
        runningBalance = parseFloat(firstTransaction.amount);
      } else {
        runningBalance = parseFloat(firstTransaction.amount); // Will be subtracted below
      }
    }

    sortedTransactions.forEach((transaction, index) => {
      const amount = parseFloat(transaction.amount);
      
      if (index === 0) {
        // For first transaction, set initial balance
        runningBalance = transaction.type === 'credit' ? amount : -amount;
      } else {
        // For subsequent transactions
        if (transaction.type === 'credit') {
          runningBalance += amount;
        } else {
          runningBalance -= amount;
        }
      }

      const row = worksheet.addRow({
        date: transaction.date,
        time: transaction.time,
        reason: transaction.reason || 'N/A',
        type: transaction.type === 'debit' ? 'Expense' : 'Income',
        amount: `₹${amount.toFixed(2)}`,
        runningBalance: `₹${runningBalance.toFixed(2)}`
      });

      // Style the row based on type
      if (transaction.type === 'debit') {
        row.getCell('amount').font = { color: { argb: 'FFFF0000' } }; // Red for expenses
        row.getCell('type').font = { color: { argb: 'FFFF0000' } };
      } else {
        row.getCell('amount').font = { color: { argb: 'FF008000' } }; // Green for income
        row.getCell('type').font = { color: { argb: 'FF008000' } };
      }

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FA' }
        };
      }

      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.height = 20;
    });

    // Add summary section
    const summaryStartRow = worksheet.rowCount + 3;
    
    // Summary header
    const summaryHeaderRow = worksheet.getRow(summaryStartRow);
    summaryHeaderRow.getCell(1).value = 'TRANSACTION SUMMARY';
    summaryHeaderRow.getCell(1).font = { bold: true, size: 14 };
    summaryHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF667eea' }
    };
    summaryHeaderRow.getCell(1).font.color = { argb: 'FFFFFFFF' };
    worksheet.mergeCells(`A${summaryStartRow}:F${summaryStartRow}`);
    summaryHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
    summaryHeaderRow.height = 30;

    // Calculate summary statistics
    const totalExpenses = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalIncome = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const netSavings = totalIncome - totalExpenses;

    // Add summary data
    const summaryData = [
      ['Total Income:', `₹${totalIncome.toFixed(2)}`],
      ['Total Expenses:', `₹${totalExpenses.toFixed(2)}`],
      ['Net Savings:', `₹${netSavings.toFixed(2)}`],
      ['Total Transactions:', transactions.length],
      ['Report Generated:', new Date().toLocaleString()]
    ];

    summaryData.forEach((data, index) => {
      const row = worksheet.getRow(summaryStartRow + 2 + index);
      row.getCell(1).value = data[0];
      row.getCell(2).value = data[1];
      row.getCell(1).font = { bold: true };
      
      if (data[0] === 'Net Savings:') {
        row.getCell(2).font = { 
          color: { argb: netSavings >= 0 ? 'FF008000' : 'FFFF0000' },
          bold: true
        };
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width, 12);
    });

    // Add borders to all cells with data
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `expense-tracker-report-${currentDate}.xlsx`;
    
    // Save file
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    saveAs(blob, filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: error.message };
  }
};

export const exportCustomReportToExcel = async (
  transactions, 
  reportType, 
  dateRange, 
  userEmail = 'user'
) => {
  try {
    const workbook = new XLSX.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Expense Tracker';
    workbook.created = new Date();

    // Create main worksheet
    const worksheet = workbook.addWorksheet(`${reportType} Report`, {
      properties: { tabColor: { argb: 'FF667eea' } }
    });

    // Add report header
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = `${reportType.toUpperCase()} EXPENSE REPORT`;
    titleRow.getCell(1).font = { bold: true, size: 16 };
    titleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF667eea' }
    };
    titleRow.getCell(1).font.color = { argb: 'FFFFFFFF' };
    worksheet.mergeCells('A1:F1');
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 35;

    // Add date range
    if (dateRange) {
      const dateRow = worksheet.getRow(2);
      dateRow.getCell(1).value = `Period: ${dateRange.start} to ${dateRange.end}`;
      dateRow.getCell(1).font = { bold: true, size: 12 };
      worksheet.mergeCells('A2:F2');
      dateRow.alignment = { horizontal: 'center' };
      dateRow.height = 25;
    }

    // Add transaction data starting from row 4
    const startRow = 4;
    worksheet.getRow(startRow).values = [
      'Date', 'Time', 'Description', 'Type', 'Amount', 'Category'
    ];
    
    const headerRow = worksheet.getRow(startRow);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF667eea' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add transactions
    transactions.forEach((transaction, index) => {
      const row = worksheet.getRow(startRow + 1 + index);
      row.values = [
        transaction.date,
        transaction.time,
        transaction.reason || 'N/A',
        transaction.type === 'debit' ? 'Expense' : 'Income',
        `₹${parseFloat(transaction.amount).toFixed(2)}`,
        transaction.category || 'Uncategorized'
      ];

      // Style based on transaction type
      if (transaction.type === 'debit') {
        row.getCell(5).font = { color: { argb: 'FFFF0000' } };
      } else {
        row.getCell(5).font = { color: { argb: 'FF008000' } };
      }

      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.height = 20;
    });

    // Auto-fit columns
    worksheet.columns = [
      { width: 15 }, { width: 12 }, { width: 30 }, 
      { width: 12 }, { width: 15 }, { width: 20 }
    ];

    // Generate and save
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    saveAs(blob, filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting custom report:', error);
    return { success: false, error: error.message };
  }
};