import React, { createContext, useContext, useState } from 'react';
import { LinearProgress, Snackbar, Alert } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface FeedbackContextType {
  showProgress: (message: string) => void;
  hideProgress: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  showSnackbar: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
  setProcessingStatus: (status: string) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const showProgress = (message: string) => {
    setProgressMessage(message);
    setProgressVisible(true);
  };

  const hideProgress = () => {
    setProgressVisible(false);
    setProgressMessage('');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    toast[type](message, {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  return (
    <FeedbackContext.Provider
      value={{
        showProgress,
        hideProgress,
        showToast,
        showSnackbar,
        setProcessingStatus,
      }}
    >
      {progressVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress />
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '8px 16px',
            textAlign: 'center',
            borderBottom: '1px solid #e0e0e0'
          }}>
            {progressMessage}
          </div>
        </div>
      )}
      
      {processingStatus && (
        <div style={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          backgroundColor: '#f5f5f5',
          padding: '8px 16px',
          borderRadius: 4,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 9998
        }}>
          <LinearProgress style={{ marginBottom: 8 }} />
          {processingStatus}
        </div>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <ToastContainer />
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};
