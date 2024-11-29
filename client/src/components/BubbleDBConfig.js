import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';

function BubbleDBConfig({ onConfigSave, config }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localConfig, setLocalConfig] = useState(config);

  const handleInputChange = (field) => (event) => {
    setLocalConfig({
      ...localConfig,
      [field]: event.target.value,
    });
  };

  const testConnection = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/bubble/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(localConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Bubble database');
      }

      const data = await response.json();
      onConfigSave(localConfig);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Paper elevation={3}>
        <Box p={3}>
          <Typography variant="h6" gutterBottom>
            Connect to Bubble Database
          </Typography>
          
          <TextField
            fullWidth
            label="API Key"
            value={localConfig.apiKey}
            onChange={handleInputChange('apiKey')}
            margin="normal"
            type="password"
          />
          
          <TextField
            fullWidth
            label="App Name"
            value={localConfig.appName}
            onChange={handleInputChange('appName')}
            margin="normal"
            helperText="Your Bubble application name (e.g., my-app)"
          />
          
          <TextField
            fullWidth
            label="Data Type"
            value={localConfig.dataType}
            onChange={handleInputChange('dataType')}
            margin="normal"
            helperText="The Bubble data type to map fields to"
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={testConnection}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Connect'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default BubbleDBConfig;
