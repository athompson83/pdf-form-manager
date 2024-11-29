import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  PlayArrow as TestIcon,
} from '@mui/icons-material';
import { PDFField, BubbleField, Webhook } from '../../types';
import { useFeedback } from '../../context/FeedbackContext';

const PDFWebhookManager: React.FC<{
  pdfFields: PDFField[];
  onBubbleFieldsDetected: (fields: BubbleField[]) => void;
}> = ({ pdfFields, onBubbleFieldsDetected }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'POST',
    headers: {},
    enabled: true,
    description: '',
    fieldMapping: {},
    retryCount: 3,
    timeout: 30000,
  });
  const { showProgress, hideProgress, showToast, setProcessingStatus } = useFeedback();

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      showProgress('Loading webhooks...');
      const response = await fetch('/api/webhooks');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch webhooks');
      }

      setWebhooks(data.data.webhooks);
      showToast('Successfully loaded webhooks', 'success');
    } catch (err: any) {
      showToast('Failed to load webhooks', 'error');
    } finally {
      setLoading(false);
      hideProgress();
    }
  };

  const handleSaveWebhook = async () => {
    try {
      showProgress(selectedWebhook ? 'Updating webhook...' : 'Creating webhook...');
      
      const method = selectedWebhook ? 'PUT' : 'POST';
      const url = selectedWebhook
        ? `/api/webhooks/${selectedWebhook._id}`
        : '/api/webhooks';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save webhook');
      }

      setSuccess('Webhook saved successfully');
      setDialogOpen(false);
      fetchWebhooks();
      showToast(
        `Webhook ${selectedWebhook ? 'updated' : 'created'} successfully`,
        'success'
      );
      resetForm();
    } catch (err: any) {
      showToast('Failed to save webhook', 'error');
    } finally {
      hideProgress();
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!window.confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      showProgress('Deleting webhook...');
      
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete webhook');
      }

      setSuccess('Webhook deleted successfully');
      setWebhooks(webhooks.filter((webhook) => webhook._id !== webhookId));
      showToast('Webhook deleted successfully', 'success');
    } catch (err: any) {
      showToast('Failed to delete webhook', 'error');
    } finally {
      hideProgress();
    }
  };

  const handleTestWebhook = async (webhook: Webhook) => {
    try {
      setProcessingStatus(`Testing webhook: ${webhook.name}...`);
      
      const testData = {
        pdfFields: pdfFields.map((field) => ({
          name: field.name,
          type: field.type,
          value: getTestValue(field.type),
        })),
      };

      const response = await fetch(`/api/webhooks/${webhook._id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Webhook test failed');
      }

      setTestResponse(data.data);
      setTestDialogOpen(true);

      // If the webhook response contains Bubble fields, notify the parent
      if (data.data.bubbleFields) {
        onBubbleFieldsDetected(data.data.bubbleFields);
      }
      showToast(
        data.success ? 'Webhook test successful' : 'Webhook test failed',
        data.success ? 'success' : 'error'
      );
    } catch (err: any) {
      showToast('Webhook test failed', 'error');
    } finally {
      setProcessingStatus('');
    }
  };

  const getTestValue = (fieldType: string) => {
    switch (fieldType) {
      case 'text':
        return 'Test Value';
      case 'number':
        return 123;
      case 'date':
        return new Date().toISOString();
      case 'checkbox':
        return true;
      case 'radio':
        return 'option1';
      case 'select':
        return 'option1';
      default:
        return 'Test Value';
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      method: 'POST',
      headers: {},
      enabled: true,
      description: '',
      fieldMapping: {},
      retryCount: 3,
      timeout: 30000,
    });
    setSelectedWebhook(null);
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">PDF Webhooks</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            Add Webhook
          </Button>
        </Box>
      </Box>

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
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <List>
                {webhooks.map((webhook) => (
                  <ListItem
                    key={webhook._id}
                    sx={{
                      bgcolor: 'background.paper',
                      mb: 1,
                      borderRadius: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1">{webhook.name}</Typography>
                          <Chip
                            label={webhook.method}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                          {webhook.enabled ? (
                            <Chip
                              label="Active"
                              size="small"
                              color="success"
                              sx={{ ml: 1 }}
                            />
                          ) : (
                            <Chip
                              label="Inactive"
                              size="small"
                              color="error"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {webhook.url}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {webhook.description}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Test Webhook">
                        <IconButton
                          edge="end"
                          onClick={() => handleTestWebhook(webhook)}
                          disabled={!webhook.enabled || loading}
                        >
                          <TestIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          edge="end"
                          onClick={() => {
                            setSelectedWebhook(webhook);
                            setFormData({
                              name: webhook.name,
                              url: webhook.url,
                              method: webhook.method,
                              headers: webhook.headers,
                              enabled: webhook.enabled,
                              description: webhook.description,
                              fieldMapping: webhook.fieldMapping,
                              retryCount: webhook.retryCount,
                              timeout: webhook.timeout,
                            });
                            setDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteWebhook(webhook._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {webhooks.length === 0 && !loading && (
                <Typography
                  color="text.secondary"
                  sx={{ textAlign: 'center', mt: 2 }}
                >
                  No webhooks configured
                </Typography>
              )}

              {loading && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mt: 2,
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedWebhook ? 'Edit Webhook' : 'Create Webhook'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL"
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Method</InputLabel>
                <Select
                  value={formData.method}
                  label="Method"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      method: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="POST">POST</MenuItem>
                  <MenuItem value="PUT">PUT</MenuItem>
                  <MenuItem value="PATCH">PATCH</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enabled}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        enabled: e.target.checked,
                      }))
                    }
                  />
                }
                label="Enabled"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Retry Count"
                value={formData.retryCount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    retryCount: parseInt(e.target.value),
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Timeout (ms)"
                value={formData.timeout}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    timeout: parseInt(e.target.value),
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveWebhook}
            variant="contained"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : selectedWebhook ? (
              'Update'
            ) : (
              'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Response Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Webhook Test Results</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Response:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={JSON.stringify(testResponse, null, 2)}
            InputProps={{
              readOnly: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PDFWebhookManager;
