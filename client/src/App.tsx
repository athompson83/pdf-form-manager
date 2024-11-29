import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { FeedbackProvider } from './context/FeedbackContext';
import PrivateRoute from './components/auth/PrivateRoute';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Layout Components
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';

// Feature Components
import TemplateList from './components/templates/TemplateList';
import TemplateDetail from './components/templates/TemplateDetail';
import TemplateForm from './components/templates/TemplateForm';
import APIKeyList from './components/apiKeys/APIKeyList';
import APIKeyDetail from './components/apiKeys/APIKeyDetail';
import UserList from './components/users/UserList';
import UserProfile from './components/users/UserProfile';
import LogList from './components/logs/LogList';
import BubbleConfig from './components/bubble/BubbleConfig';
import BubbleTestConsole from './components/bubble/BubbleTestConsole';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <FeedbackProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Template Routes */}
                <Route path="/templates" element={<TemplateList />} />
                <Route path="/templates/new" element={<TemplateForm />} />
                <Route path="/templates/:id" element={<TemplateDetail />} />
                <Route path="/templates/:id/edit" element={<TemplateForm />} />

                {/* API Key Routes */}
                <Route path="/api-keys" element={<APIKeyList />} />
                <Route path="/api-keys/:id" element={<APIKeyDetail />} />

                {/* User Routes */}
                <Route path="/users" element={<UserList />} />
                <Route path="/profile" element={<UserProfile />} />

                {/* Log Routes */}
                <Route path="/logs" element={<LogList />} />

                {/* Bubble Integration Routes */}
                <Route path="/bubble/config" element={<BubbleConfig />} />
                <Route path="/bubble/test" element={<BubbleTestConsole />} />
              </Route>
            </Routes>
          </Router>
        </FeedbackProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
