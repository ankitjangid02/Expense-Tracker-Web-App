import React from 'react';
import { motion } from 'framer-motion';

class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chart Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div 
          className="chart-error"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 2rem',
            background: 'rgba(255, 107, 107, 0.1)',
            borderRadius: '15px',
            border: '2px solid rgba(255, 107, 107, 0.2)',
            minHeight: '300px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h3 style={{ 
            color: '#e53e3e', 
            marginBottom: '0.5rem',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            Chart Loading Error
          </h3>
          <p style={{ 
            color: '#666', 
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            maxWidth: '300px'
          }}>
            Unable to load chart visualization. This might be due to invalid data or a temporary issue.
          </p>
          <motion.button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 Refresh Page
          </motion.button>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;