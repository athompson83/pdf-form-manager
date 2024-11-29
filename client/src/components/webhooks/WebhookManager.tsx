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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as TestIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { Webhook } from '../../types';

const WebhookManager: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    events: [] as string[],
    isActive: true,
    headers: {} as Record<string, string>,
    retryCount: 3,
  });
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/webhooks');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch webhooks');
      }

      setWebhooks(data.data.webhooks);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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

      setSuccess(
        `Webhook ${selectedWebhook ? 'updated' : 'created'} successfully`
      );
      setDialogOpen(false);
      fetchWebhooks();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!window.confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete webhook');
      }

      setSuccess('Webhook deleted successfully');
      fetchWebhooks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTest = async (webhook: Webhook) => {
    try {
      setTestLoading(true);
      setTestResponse(null);
      
      // Generate test data based on PDF fields
      const testData = {
        templateId: 'test-template-id',
        formFields: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          address: '123 Main St',
          // Add more fields based on your PDF template
        },
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'webhook-test',
          userId: 'test-user-id',
        },
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
        throw new Error(data.message || 'Test failed');
      }

      setTestResponse(data.data);
      setTestDialogOpen(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTestLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      events: [],
      isActive: true,
      headers: {},
      retryCount: 3,
    });
    setSelectedWebhook(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
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
        <Typography variant="h4">Webhooks</Typography>
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

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Events</TableCell>
                  <TableCell>Last Triggered</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook._id}>
                    <TableCell>{webhook.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          sx={{
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {webhook.url}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(webhook.url)}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={webhook.isActive ? 'Active' : 'Inactive'}
                        color={webhook.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {webhook.events.map((event) => (
                        <Chip
                          key={event}
                          label={event}
                          size="small"
                          sx={{ mr: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      {webhook.lastTriggered
                        ? new Date(webhook.lastTriggered).toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton
                          onClick={() => {
                            setSelectedWebhook(webhook);
                            setFormData(webhook);
                            setDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Test">
                        <IconButton
                          onClick={() => handleTest(webhook)}
                          disabled={testLoading}
                        >
                          <TestIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDelete(webhook._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedWebhook ? 'Update' : 'Create'}
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
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Response Status:
            </Typography>
            <Chip
              label={testResponse?.status || 'Unknown'}
              color={testResponse?.success ? 'success' : 'error'}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" gutterBottom>
              Response Time:
            </Typography>
            <Typography sx={{ mb: 2 }}>
              {testResponse?.duration}ms
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              Response Headers:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <pre style={{ margin: 0, overflow: 'auto' }}>
                {JSON.stringify(testResponse?.headers, null, 2)}
              </pre>
            </Paper>

            <Typography variant="subtitle2" gutterBottom>
              Response Body:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <pre style={{ margin: 0, overflow: 'auto' }}>
                {JSON.stringify(testResponse?.body, null, 2)}
              </pre>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WebhookManager;
