import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { APIKey } from '../../types';

const APIKeyDetail: React.FC = () => {
  const [apiKey, setApiKey] = useState<APIKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAPIKey();
  }, [id]);

  const fetchAPIKey = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/api-keys/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch API key');
      }

      setApiKey(data.data.apiKey);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to revoke API key');
      }

      navigate('/api-keys');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!apiKey) {
    return <Typography>API key not found</Typography>;
  }

  const usageData = [
    {
      endpoint: '/api/templates',
      method: 'GET',
      count: 245,
      lastUsed: '2023-06-15T10:30:00Z',
    },
    {
      endpoint: '/api/templates/fill',
      method: 'POST',
      count: 123,
      lastUsed: '2023-06-15T11:45:00Z',
    },
  ];

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
        <Typography variant="h4">{apiKey.name}</Typography>
        {apiKey.status === 'active' && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => setRevokeDialogOpen(true)}
          >
            Revoke Key
          </Button>
        )}
      </Box>

      {apiKey.status === 'revoked' && (
        <Alert
          severity="warning"
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
        >
          This API key has been revoked and can no longer be used.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={apiKey.status}
                  color={apiKey.status === 'active' ? 'success' : 'default'}
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Permissions
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {apiKey.permissions.map((permission) => (
                    <Chip key={permission} label={permission} size="small" />
                  ))}
                </Box>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography>
                  {new Date(apiKey.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Used
                </Typography>
                <Typography>
                  {apiKey.lastUsed
                    ? new Date(apiKey.lastUsed).toLocaleString()
                    : 'Never'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Usage Statistics
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Endpoint</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell>Last Used</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usageData.map((row) => (
                      <TableRow key={`${row.endpoint}-${row.method}`}>
                        <TableCell>{row.endpoint}</TableCell>
                        <TableCell>{row.method}</TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell>
                          {new Date(row.lastUsed).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revoke Dialog */}
      <Dialog
        open={revokeDialogOpen}
        onClose={() => setRevokeDialogOpen(false)}
      >
        <DialogTitle>Revoke API Key</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to revoke this API key? This action cannot be
            undone, and any applications using this key will stop working
            immediately.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRevoke} color="error">
            Revoke
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default APIKeyDetail;
