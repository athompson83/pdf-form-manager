import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

function BubbleTestConsole({ pdfData, bubbleConfig, fieldMapping }) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [error, setError] = useState('');

  const generateWebhook = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/webhook/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfId: pdfData.filename,
          bubbleConfig,
          fieldMapping,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate webhook');
      }

      const data = await response.json();
      setWebhookUrl(data.webhookUrl);
    } catch (error) {
      setError(error.message);
    }
  };

  const testWebhook = async () => {
    try {
      const testData = {};
      Object.entries(fieldMapping).forEach(([pdfField, bubbleField]) => {
        testData[bubbleField] = `Test Value for ${pdfField}`;
      });

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: testData }),
      });

      if (!response.ok) {
        throw new Error('Webhook test failed');
      }

      const result = await response.json();
      setTestResults([
        {
          timestamp: new Date().toISOString(),
          success: true,
          message: 'Webhook test successful',
          data: result,
        },
        ...testResults,
      ]);
    } catch (error) {
      setTestResults([
        {
          timestamp: new Date().toISOString(),
          success: false,
          message: error.message,
        },
        ...testResults,
      ]);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Paper elevation={3}>
        <Box p={3}>
          <Typography variant="h6" gutterBottom>
            Test Your Integration
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              onClick={generateWebhook}
              disabled={webhookUrl !== ''}
              sx={{ mb: 2 }}
            >
              Generate Webhook URL
            </Button>

            {webhookUrl && (
              <>
                <TextField
                  fullWidth
                  value={webhookUrl}
                  label="Webhook URL"
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <Button
                  variant="contained"
                  onClick={testWebhook}
                  sx={{ mt: 2 }}
                >
                  Test Webhook
                </Button>
              </>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Test Results
          </Typography>

          <List>
            {testResults.map((result, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={result.message}
                  secondary={new Date(result.timestamp).toLocaleString()}
                  sx={{
                    color: result.success ? 'success.main' : 'error.main',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Paper>
    </Box>
  );
}

export default BubbleTestConsole;
