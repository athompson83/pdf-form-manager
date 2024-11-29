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
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  PlayArrow as TestIcon,
  ContentCopy as CopyIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { BubbleConfig } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bubble-tabpanel-${index}`}
      aria-labelledby={`bubble-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const BubbleIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [bubbleConfig, setBubbleConfig] = useState<BubbleConfig>({
    apiKey: '',
    appName: '',
    environment: 'development',
    endpoint: '',
    webhookUrl: '',
    enableSync: true,
  });
  const [testData, setTestData] = useState({
    templateId: '',
    formFields: {},
  });

  useEffect(() => {
    fetchBubbleConfig();
  }, []);

  const fetchBubbleConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bubble/config');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch Bubble configuration');
      }

      setBubbleConfig(data.data.config);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/bubble/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bubbleConfig),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save configuration');
      }

      setSuccess('Configuration saved successfully');
      setConfigDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      setTestResponse(null);

      const response = await fetch('/api/bubble/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bubbleConfig),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Connection test failed');
      }

      setTestResponse(data.data);
      setSuccess('Connection test successful');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFields = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/bubble/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Field synchronization failed');
      }

      setSuccess('Fields synchronized successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <Typography variant="h4">Bubble.io Integration</Typography>
        <Box>
          <IconButton onClick={() => setConfigDialogOpen(true)}>
            <SettingsIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<TestIcon />}
            onClick={handleTestConnection}
            sx={{ ml: 1 }}
          >
            Test Connection
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

      <Card>
        <CardContent>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Configuration" />
            <Tab label="Field Mapping" />
            <Tab label="Webhooks" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Current Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">App Name:</Typography>
                      <Typography>{bubbleConfig.appName}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Environment:</Typography>
                      <Typography>{bubbleConfig.environment}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Endpoint:</Typography>
                      <Typography>{bubbleConfig.endpoint}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Webhook URL:</Typography>
                      <Typography>{bubbleConfig.webhookUrl}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Sync Enabled:</Typography>
                      <Typography>
                        {bubbleConfig.enableSync ? 'Yes' : 'No'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleSyncFields}
                        disabled={loading || !bubbleConfig.enableSync}
                      >
                        Sync Fields
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => setTestDialogOpen(true)}
                      >
                        Test Webhook
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" gutterBottom>
              Field Mapping
            </Typography>
            {/* Field mapping component will be implemented separately */}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" gutterBottom>
              Webhook Configuration
            </Typography>
            {/* Webhook configuration component will be implemented separately */}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bubble.io Configuration</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={bubbleConfig.apiKey}
                onChange={(e) =>
                  setBubbleConfig((prev) => ({
                    ...prev,
                    apiKey: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="App Name"
                value={bubbleConfig.appName}
                onChange={(e) =>
                  setBubbleConfig((prev) => ({
                    ...prev,
                    appName: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Environment"
                value={bubbleConfig.environment}
                onChange={(e) =>
                  setBubbleConfig((prev) => ({
                    ...prev,
                    environment: e.target.value,
                  }))
                }
                select
                SelectProps={{ native: true }}
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Endpoint"
                value={bubbleConfig.endpoint}
                onChange={(e) =>
                  setBubbleConfig((prev) => ({
                    ...prev,
                    endpoint: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Webhook URL"
                value={bubbleConfig.webhookUrl}
                onChange={(e) =>
                  setBubbleConfig((prev) => ({
                    ...prev,
                    webhookUrl: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={bubbleConfig.enableSync}
                    onChange={(e) =>
                      setBubbleConfig((prev) => ({
                        ...prev,
                        enableSync: e.target.checked,
                      }))
                    }
                  />
                }
                label="Enable Field Synchronization"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveConfig}
            variant="contained"
            disabled={loading}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Test Results</DialogTitle>
        <DialogContent>
          {testResponse && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Status:
              </Typography>
              <Alert
                severity={testResponse.success ? 'success' : 'error'}
                sx={{ mb: 2 }}
              >
                {testResponse.message}
              </Alert>

              <Typography variant="subtitle2" gutterBottom>
                Response Details:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <pre style={{ margin: 0, overflow: 'auto' }}>
                  {JSON.stringify(testResponse.details, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BubbleIntegration;
