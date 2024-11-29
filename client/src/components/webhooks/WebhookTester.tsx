import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Paper,
  Chip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as TestIcon,
  ContentCopy as CopyIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { PDFTemplate } from '../../types';

interface WebhookTestData {
  templateId: string;
  formFields: Record<string, any>;
  metadata: {
    timestamp: string;
    source: string;
    userId: string;
    templateName: string;
    environment: string;
  };
}

const WebhookTester: React.FC = () => {
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate | null>(
    null
  );
  const [testData, setTestData] = useState<WebhookTestData>({
    templateId: '',
    formFields: {},
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'webhook-tester',
      userId: '',
      templateName: '',
      environment: 'test',
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [autoFormat, setAutoFormat] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch templates');
      }

      setTemplates(data.data.templates);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    try {
      const template = templates.find((t) => t._id === templateId);
      if (!template) return;

      setSelectedTemplate(template);
      
      // Initialize form fields with template fields
      const formFields: Record<string, any> = {};
      template.fields.forEach((field) => {
        formFields[field.name] = generateSampleValue(field.type);
      });

      setTestData((prev) => ({
        ...prev,
        templateId,
        formFields,
        metadata: {
          ...prev.metadata,
          templateName: template.name,
        },
      }));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const generateSampleValue = (type: string): any => {
    switch (type) {
      case 'text':
        return 'Sample Text';
      case 'number':
        return 123;
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'email':
        return 'sample@example.com';
      case 'phone':
        return '123-456-7890';
      case 'checkbox':
        return true;
      default:
        return 'Sample Value';
    }
  };

  const handleTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setTestResponse(null);

      const payload = {
        ...testData,
        metadata: includeMetadata ? testData.metadata : undefined,
      };

      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Test failed');
      }

      setTestResponse(data.data);
      setSuccess('Webhook test completed successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/webhook-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate?._id,
          testData,
          response: testResponse,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save test');
      }

      setSuccess('Test saved successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
  };

  const formatJson = (obj: any): string => {
    return JSON.stringify(obj, null, autoFormat ? 2 : 0);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Webhook Tester
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Configuration
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Template"
                    value={selectedTemplate?._id || ''}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.name}
                      </option>
                    ))}
                  </TextField>
                </Grid>

                {selectedTemplate && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Form Fields
                      </Typography>
                      {Object.entries(testData.formFields).map(([key, value]) => (
                        <TextField
                          key={key}
                          fullWidth
                          label={key}
                          value={value}
                          onChange={(e) =>
                            setTestData((prev) => ({
                              ...prev,
                              formFields: {
                                ...prev.formFields,
                                [key]: e.target.value,
                              },
                            }))
                          }
                          sx={{ mb: 2 }}
                        />
                      ))}
                    </Grid>

                    <Grid item xs={12}>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>Metadata</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={includeMetadata}
                                onChange={(e) =>
                                  setIncludeMetadata(e.target.checked)
                                }
                              />
                            }
                            label="Include Metadata"
                          />
                          {includeMetadata && (
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label="User ID"
                                  value={testData.metadata.userId}
                                  onChange={(e) =>
                                    setTestData((prev) => ({
                                      ...prev,
                                      metadata: {
                                        ...prev.metadata,
                                        userId: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label="Environment"
                                  value={testData.metadata.environment}
                                  onChange={(e) =>
                                    setTestData((prev) => ({
                                      ...prev,
                                      metadata: {
                                        ...prev.metadata,
                                        environment: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </Grid>
                            </Grid>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<TestIcon />}
                      onClick={handleTest}
                      disabled={!selectedTemplate || loading}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Test Webhook'
                      )}
                    </Button>
                    {testResponse && (
                      <Button
                        variant="outlined"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                      >
                        Save Test
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Test Results</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoFormat}
                      onChange={(e) => setAutoFormat(e.target.checked)}
                    />
                  }
                  label="Format JSON"
                />
              </Box>

              {testResponse ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Status:
                    </Typography>
                    <Chip
                      label={testResponse.status}
                      color={testResponse.success ? 'success' : 'error'}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Request Payload:
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, position: 'relative' }}
                    >
                      <IconButton
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                        onClick={() =>
                          copyToClipboard(formatJson(testResponse.request))
                        }
                      >
                        <CopyIcon />
                      </IconButton>
                      <pre style={{ margin: 0, overflow: 'auto' }}>
                        {formatJson(testResponse.request)}
                      </pre>
                    </Paper>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Response:
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, position: 'relative' }}
                    >
                      <IconButton
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                        onClick={() =>
                          copyToClipboard(formatJson(testResponse.response))
                        }
                      >
                        <CopyIcon />
                      </IconButton>
                      <pre style={{ margin: 0, overflow: 'auto' }}>
                        {formatJson(testResponse.response)}
                      </pre>
                    </Paper>
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary">
                  No test results yet. Configure and run a test to see results
                  here.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WebhookTester;
