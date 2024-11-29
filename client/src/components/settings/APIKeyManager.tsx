import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface APIKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  status: 'active' | 'revoked';
  permissions: string[];
}

const APIKeyManager: React.FC = () => {
  const { token } = useAuth();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    permissions: [] as string[],
  });
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const availablePermissions = [
    'templates:read',
    'templates:write',
    'forms:fill',
    'webhooks:manage',
  ];

  useEffect(() => {
    fetchAPIKeys();
  }, [token]);

  const fetchAPIKeys = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/api-keys', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch API keys');
      const data = await response.json();
      setApiKeys(data);
    } catch (err) {
      setError('Failed to load API keys');
    }
  };

  const handleCreateKey = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/api-keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newKeyData),
      });

      if (!response.ok) throw new Error('Failed to create API key');

      const data = await response.json();
      setApiKeys([...apiKeys, data]);
      setIsDialogOpen(false);
      setNewKeyData({ name: '', permissions: [] });
      setSuccessMessage('API key created successfully');
    } catch (err) {
      setError('Failed to create API key');
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/api-keys/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to revoke API key');

      await fetchAPIKeys();
      setSuccessMessage('API key revoked successfully');
    } catch (err) {
      setError('Failed to revoke API key');
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setSuccessMessage('API key copied to clipboard');
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            API Key Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsDialogOpen(true)}
          >
            Generate New API Key
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>API Key</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Used</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell>{apiKey.name}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {`${apiKey.key.substring(0, 8)}...`}
                      <IconButton
                        size="small"
                        onClick={() => handleCopyKey(apiKey.key)}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={apiKey.status}
                      color={apiKey.status === 'active' ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(apiKey.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {apiKey.lastUsed
                      ? new Date(apiKey.lastUsed).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    {apiKey.permissions.map((permission) => (
                      <Chip
                        key={permission}
                        label={permission}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="error"
                      onClick={() => handleRevokeKey(apiKey.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Create API Key Dialog */}
        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
          <DialogTitle>Generate New API Key</DialogTitle>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Key Name"
              value={newKeyData.name}
              onChange={(e) =>
                setNewKeyData({ ...newKeyData, name: e.target.value })
              }
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Permissions</InputLabel>
              <Select
                multiple
                value={newKeyData.permissions}
                onChange={(e) =>
                  setNewKeyData({
                    ...newKeyData,
                    permissions: e.target.value as string[],
                  })
                }
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {availablePermissions.map((permission) => (
                  <MenuItem key={permission} value={permission}>
                    {permission}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateKey} variant="contained">
              Generate
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default APIKeyManager;
