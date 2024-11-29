import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Alert,
} from '@mui/material';

function BubbleIntegrationGuide({ pdfFields, bubbleConfig, onFieldMapping }) {
  const [bubbleFields, setBubbleFields] = useState([]);
  const [mapping, setMapping] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBubbleFields();
  }, [bubbleConfig]);

  const fetchBubbleFields = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/bubble/fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bubbleConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Bubble fields');
      }

      const data = await response.json();
      setBubbleFields(data.fields);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleMappingChange = (pdfField) => (event) => {
    setMapping({
      ...mapping,
      [pdfField]: event.target.value,
    });
  };

  const handleSaveMapping = () => {
    onFieldMapping(mapping);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Paper elevation={3}>
        <Box p={3}>
          <Typography variant="h6" gutterBottom>
            Map PDF Fields to Bubble Database
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {pdfFields.map((field) => (
              <Grid item xs={12} key={field.name}>
                <FormControl fullWidth>
                  <InputLabel>{`Map "${field.name}"`}</InputLabel>
                  <Select
                    value={mapping[field.name] || ''}
                    onChange={handleMappingChange(field.name)}
                    label={`Map "${field.name}"`}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {bubbleFields.map((bubbleField) => (
                      <MenuItem key={bubbleField.id} value={bubbleField.id}>
                        {bubbleField.name} ({bubbleField.type})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSaveMapping}
              disabled={Object.keys(mapping).length === 0}
            >
              Save Mapping
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default BubbleIntegrationGuide;
