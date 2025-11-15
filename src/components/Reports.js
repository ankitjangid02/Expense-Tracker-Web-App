import React, { useState, useMemo, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { motion } from 'framer-motion';
import { exportTransactionsToExcel, exportCustomReportToExcel } from '../utils/excelExport';
import ChartErrorBoundary from './ChartErrorBoundary';
import './Reports.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = ({ expenses }) => {
  const [reportType, setReportType] = useState('monthly');
  const [isExporting, setIsExporting] = useState(false);
  
  // Debug logging
  console.log('Reports component rendered with expenses:', expenses?.length || 0, 'transactions');
  
  useEffect(() => {
    console.log('Reports useEffect - expenses updated:', expenses?.length || 0);
  }, [expenses]);

  const handleExportToExcel = async () => {
    if (expenses.length === 0) {
      console.log('No data to export');
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportTransactionsToExcel(expenses);
      if (result.success) {
        console.log(`Report exported as ${result.filename}`);
      } else {
        console.error('Failed to export report');
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCustomExport = async () => {
    if (expenses.length === 0) {
      console.log('No data to export');
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportCustomReportToExcel(
        expenses,
        reportType,
        {
          start: format(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          end: format(new Date(), 'yyyy-MM-dd')
        }
      );
      if (result.success) {
        console.log(`${reportType} report exported as ${result.filename}`);
      } else {
        console.error('Failed to export custom report');
      }
    } catch (error) {
      console.error('Custom export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const processedData = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return { labels: [], expenseData: [], incomeData: [] };
    }
    
    const now = new Date();
    let labels = [];
    let expenseData = [];
    let incomeData = [];

    switch (reportType) {
      case 'weekly':
        // Get last 12 weeks
        for (let i = 11; i >= 0; i--) {
          const weekStart = startOfWeek(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000));
          const weekEnd = endOfWeek(weekStart);
          const label = `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`;
          
          const weekExpenses = expenses.filter(expense => {
            try {
              if (!expense || !expense.date) return false;
              const expenseDate = new Date(expense.date);
              return !isNaN(expenseDate.getTime()) && expenseDate >= weekStart && expenseDate <= weekEnd;
            } catch (error) {
              console.warn('Error filtering expense by date:', expense, error);
              return false;
            }
          });

          labels.push(label);
          expenseData.push(
            weekExpenses
              .filter(e => e.type === 'debit')
              .reduce((sum, e) => sum + parseFloat(e.amount), 0)
          );
          incomeData.push(
            weekExpenses
              .filter(e => e.type === 'credit')
              .reduce((sum, e) => sum + parseFloat(e.amount), 0)
          );
        }
        break;

      case 'monthly':
        // Get last 12 months
        for (let i = 11; i >= 0; i--) {
          const monthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
          const monthEnd = endOfMonth(monthStart);
          const label = format(monthStart, 'MMM yyyy');
          
          const monthExpenses = expenses.filter(expense => {
            try {
              if (!expense || !expense.date) return false;
              const expenseDate = new Date(expense.date);
              return !isNaN(expenseDate.getTime()) && expenseDate >= monthStart && expenseDate <= monthEnd;
            } catch (error) {
              console.warn('Error filtering expense by date:', expense, error);
              return false;
            }
          });

          labels.push(label);
          expenseData.push(
            monthExpenses
              .filter(e => e.type === 'debit')
              .reduce((sum, e) => sum + parseFloat(e.amount), 0)
          );
          incomeData.push(
            monthExpenses
              .filter(e => e.type === 'credit')
              .reduce((sum, e) => sum + parseFloat(e.amount), 0)
          );
        }
        break;

      case 'yearly':
        // Get last 5 years
        for (let i = 4; i >= 0; i--) {
          const yearStart = startOfYear(new Date(now.getFullYear() - i, 0, 1));
          const yearEnd = endOfYear(yearStart);
          const label = format(yearStart, 'yyyy');
          
          const yearExpenses = expenses.filter(expense => {
            try {
              if (!expense || !expense.date) return false;
              const expenseDate = new Date(expense.date);
              return !isNaN(expenseDate.getTime()) && expenseDate >= yearStart && expenseDate <= yearEnd;
            } catch (error) {
              console.warn('Error filtering expense by date:', expense, error);
              return false;
            }
          });

          labels.push(label);
          expenseData.push(
            yearExpenses
              .filter(e => e.type === 'debit')
              .reduce((sum, e) => sum + parseFloat(e.amount), 0)
          );
          incomeData.push(
            yearExpenses
              .filter(e => e.type === 'credit')
              .reduce((sum, e) => sum + parseFloat(e.amount), 0)
          );
        }
        break;
        
      default:
        // Default to monthly if no valid reportType
        break;
    }

    return { labels, expenseData, incomeData };
  }, [expenses, reportType]);

  // Expense categories for pie chart
  const categoryData = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return { labels: ['No Data'], data: [1] };
    }

    const categories = {};
    expenses
      .filter(expense => expense && expense.type === 'debit' && expense.reason && expense.amount)
      .forEach(expense => {
        try {
          const category = expense.reason.toLowerCase() || 'uncategorized';
          const amount = parseFloat(expense.amount) || 0;
          categories[category] = (categories[category] || 0) + amount;
        } catch (error) {
          console.warn('Error processing expense for category:', expense, error);
        }
      });

    const sortedCategories = Object.entries(categories)
      .filter(([, amount]) => amount > 0)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Top 10 categories

    if (sortedCategories.length === 0) {
      return { labels: ['No Expenses'], data: [1] };
    }

    return {
      labels: sortedCategories.map(([category]) => category.charAt(0).toUpperCase() + category.slice(1)),
      data: sortedCategories.map(([, amount]) => amount)
    };
  }, [expenses]);

  const barChartData = {
    labels: processedData.labels,
    datasets: [
      {
        label: 'Expenses',
        data: processedData.expenseData,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Income',
        data: processedData.incomeData,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: processedData.labels,
    datasets: [
      {
        label: 'Net Savings',
        data: processedData.labels.map((_, index) => 
          processedData.incomeData[index] - processedData.expenseData[index]
        ),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const pieChartData = {
    labels: categoryData.labels,
    datasets: [
      {
        data: categoryData.data,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#FF6384', '#36A2EB',
          '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384'
        ],
        hoverBackgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#FF6384', '#36A2EB',
          '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384'
        ]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Financial Report`,
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return '₹' + value.toFixed(2);
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Net Savings Trend`,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: 'Top Expense Categories',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <motion.div 
      className="reports"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="reports-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="header-top">
          <h1>Financial Reports</h1>
          <div className="export-buttons">
            <motion.button 
              className="export-btn primary"
              onClick={handleExportToExcel}
              disabled={isExporting || expenses.length === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isExporting ? 'Exporting...' : '📊 Export All Data'}
            </motion.button>
            <motion.button 
              className="export-btn secondary"
              onClick={handleCustomExport}
              disabled={isExporting || expenses.length === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isExporting ? 'Exporting...' : `📈 Export ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`}
            </motion.button>
          </div>
        </div>
        <div className="report-type-selector">
          <motion.button 
            className={reportType === 'weekly' ? 'active' : ''}
            onClick={() => setReportType('weekly')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Weekly
          </motion.button>
          <motion.button 
            className={reportType === 'monthly' ? 'active' : ''}
            onClick={() => setReportType('monthly')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Monthly
          </motion.button>
          <motion.button 
            className={reportType === 'yearly' ? 'active' : ''}
            onClick={() => setReportType('yearly')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Yearly
          </motion.button>
        </div>
      </motion.div>

      {expenses.length === 0 ? (
        <motion.div 
          className="no-data"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p>No expense data available for generating reports.</p>
        </motion.div>
      ) : (
        <motion.div 
          className="charts-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="chart-section">
            <h2>Income vs Expenses</h2>
            <div className="chart-wrapper">
              <ChartErrorBoundary>
                <Bar data={barChartData} options={chartOptions} />
              </ChartErrorBoundary>
            </div>
          </div>

          <div className="chart-section">
            <h2>Net Savings Trend</h2>
            <div className="chart-wrapper">
              <ChartErrorBoundary>
                <Line data={lineChartData} options={lineChartOptions} />
              </ChartErrorBoundary>
            </div>
          </div>

          <div className="chart-section">
            <h2>Expense Categories</h2>
            <div className="chart-wrapper pie-chart">
              <ChartErrorBoundary>
                <Pie data={pieChartData} options={pieChartOptions} />
              </ChartErrorBoundary>
            </div>
          </div>

          <div className="summary-stats">
            <h2>Summary Statistics</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <h3>Total Expenses</h3>
                <p>₹{expenses.filter(e => e.type === 'debit').reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2)}</p>
              </div>
              <div className="stat-item">
                <h3>Total Income</h3>
                <p>₹{expenses.filter(e => e.type === 'credit').reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2)}</p>
              </div>
              <div className="stat-item">
                <h3>Average Transaction</h3>
                <p>₹{expenses.length > 0 ? (expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0) / expenses.length).toFixed(2) : '0.00'}</p>
              </div>
              <div className="stat-item">
                <h3>Total Transactions</h3>
                <p>{expenses.length}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Reports;