import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
} from '@mui/material';
import { useFeedback } from '../../context/FeedbackContext';

export const BubbleFieldMapping: React.FC<{
  pdfFields: any[];
  onMappingComplete: (mapping: any[]) => void;
}> = ({ pdfFields, onMappingComplete }) => {
  const [bubbleFields, setBubbleFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mappings, setMappings] = useState<any[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');
  const { showProgress, hideProgress, showToast, setProcessingStatus } = useFeedback();

  useEffect(() => {
    fetchBubbleFields();
  }, []);

  const fetchBubbleFields = async () => {
    try {
      showProgress('Loading Bubble fields...');
      const response = await fetch('/api/bubble/fields');
      if (!response.ok) throw new Error('Failed to fetch Bubble fields');
      
      const data = await response.json();
      setBubbleFields(data.fields);
      showToast('Successfully loaded Bubble fields', 'success');
    } catch (error) {
      showToast('Failed to load Bubble fields', 'error');
    } finally {
      setLoading(false);
      hideProgress();
    }
  };

  const handleFieldMapping = async (pdfField: any, bubbleField: string) => {
    try {
      setProcessingStatus(`Mapping ${pdfField.name} to ${bubbleField}...`);
      
      const response = await fetch('/api/field-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfFieldId: pdfField._id,
          bubbleFieldName: bubbleField,
        }),
      });

      if (!response.ok) throw new Error('Failed to create mapping');

      const newMapping = {
        pdfField,
        bubbleField: bubbleFields.find(f => f.name === bubbleField),
      };

      setMappings([...mappings, newMapping]);
      showToast(`Successfully mapped ${pdfField.name} to ${bubbleField}`, 'success');
    } catch (error) {
      showToast(`Failed to map ${pdfField.name}`, 'error');
    } finally {
      setProcessingStatus('');
    }
  };

  const handleMappingComplete = async () => {
    try {
      showProgress('Validating and saving field mappings...');
      
      const response = await fetch('/api/field-mapping/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mappings }),
      });

      if (!response.ok) throw new Error('Validation failed');

      const { validationResults } = await response.json();
      
      if (validationResults.some((r: any) => r.severity === 'error')) {
        showToast('Please fix validation errors before proceeding', 'error');
        return;
      }

      onMappingComplete(mappings);
      showToast('Field mappings completed successfully', 'success');
    } catch (error) {
      showToast('Failed to complete field mapping', 'error');
    } finally {
      hideProgress();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Map PDF Fields to Bubble Fields
      </Typography>

      {pdfFields.map((pdfField) => {
        const existingMapping = mappings.find(m => m.pdfField._id === pdfField._id);

        return (
          <Card key={pdfField._id} sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle1">{pdfField.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Type: {pdfField.type}
                    {pdfField.required && (
                      <Chip
                        label="Required"
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                </Box>

                {existingMapping ? (
                  <Box display="flex" alignItems="center">
                    <Typography variant="body2" sx={{ mr: 2 }}>
                      Mapped to: {existingMapping.bubbleField.name}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => {
                        const newMappings = mappings.filter(
                          m => m.pdfField._id !== pdfField._id
                        );
                        setMappings(newMappings);
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                ) : (
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Select Bubble Field</InputLabel>
                    <Select
                      value={selectedField}
                      onChange={(e) => {
                        setSelectedField(e.target.value);
                        handleFieldMapping(pdfField, e.target.value);
                      }}
                      label="Select Bubble Field"
                    >
                      {bubbleFields.map((bubbleField) => (
                        <MenuItem
                          key={bubbleField.name}
                          value={bubbleField.name}
                          disabled={mappings.some(
                            m => m.bubbleField.name === bubbleField.name
                          )}
                        >
                          {bubbleField.name} ({bubbleField.type})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </CardContent>
          </Card>
        );
      })}

      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          onClick={handleMappingComplete}
          disabled={mappings.length === 0}
        >
          Complete Mapping
        </Button>
      </Box>
    </Box>
  );
};
