import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
} from '@mui/icons-material';
import { APIKey, Permission } from '../../types';

const PERMISSIONS: { value: Permission; label: string }[] = [
  { value: 'templates:read', label: 'Read Templates' },
  { value: 'templates:write', label: 'Write Templates' },
  { value: 'forms:fill', label: 'Fill Forms' },
  { value: 'webhooks:manage', label: 'Manage Webhooks' },
];

const APIKeyList: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    permissions: [] as Permission[],
  });
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/api-keys');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch API keys');
      }

      setApiKeys(data.data.apiKeys);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newKeyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create API key');
      }

      setNewlyCreatedKey(data.data.key);
      await fetchAPIKeys();
      setCreateDialogOpen(false);
      setNewKeyData({ name: '', permissions: [] });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRevoke = async () => {
    if (!selectedKey) return;

    try {
      const response = await fetch(`/api/api-keys/${selectedKey._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to revoke API key');
      }

      setApiKeys((prev) =>
        prev.map((key) =>
          key._id === selectedKey._id
            ? { ...key, status: 'revoked' }
            : key
        )
      );
      setDeleteDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
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
        <Typography variant="h4">API Keys</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create API Key
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {newlyCreatedKey && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            New API Key Created
          </Typography>
          <Box sx={{ mt: 1, mb: 2 }}>
            <TextField
              fullWidth
              value={newlyCreatedKey}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <IconButton
                    onClick={() => copyToClipboard(newlyCreatedKey)}
                    size="small"
                  >
                    <CopyIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Make sure to copy your API key now. You won't be able to see it again!
          </Typography>
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Key</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Used</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey._id}>
                    <TableCell>{apiKey.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                          size="small"
                          value={
                            showKeys[apiKey._id]
                              ? apiKey.key
                              : '•'.repeat(20)
                          }
                          InputProps={{
                            readOnly: true,
                            sx: { fontFamily: 'monospace' },
                          }}
                        />
                        <IconButton
                          onClick={() => toggleKeyVisibility(apiKey._id)}
                          size="small"
                        >
                          {showKeys[apiKey._id] ? (
                            <HideIcon />
                          ) : (
                            <ViewIcon />
                          )}
                        </IconButton>
                        <IconButton
                          onClick={() => copyToClipboard(apiKey.key)}
                          size="small"
                        >
                          <Tooltip
                            open={copiedKey === apiKey.key}
                            title="Copied!"
                            placement="top"
                          >
                            <CopyIcon />
                          </Tooltip>
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {apiKey.permissions.map((permission) => (
                          <Chip
                            key={permission}
                            label={
                              PERMISSIONS.find((p) => p.value === permission)
                                ?.label || permission
                            }
                            size="small"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={apiKey.status}
                        color={
                          apiKey.status === 'active' ? 'success' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {apiKey.lastUsed
                        ? new Date(apiKey.lastUsed).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => {
                          setSelectedKey(apiKey);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={apiKey.status === 'revoked'}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {apiKeys.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        No API keys found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create API Key</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Key Name"
              value={newKeyData.name}
              onChange={(e) =>
                setNewKeyData((prev) => ({ ...prev, name: e.target.value }))
              }
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Permissions</InputLabel>
              <Select
                multiple
                value={newKeyData.permissions}
                onChange={(e) =>
                  setNewKeyData((prev) => ({
                    ...prev,
                    permissions: e.target.value as Permission[],
                  }))
                }
                input={<OutlinedInput label="Permissions" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={
                          PERMISSIONS.find((p) => p.value === value)?.label ||
                          value
                        }
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              >
                {PERMISSIONS.map((permission) => (
                  <MenuItem key={permission.value} value={permission.value}>
                    {permission.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!newKeyData.name || newKeyData.permissions.length === 0}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Revoke API Key</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to revoke the API key "{selectedKey?.name}"?
            This action cannot be undone, and any applications using this key
            will stop working immediately.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRevoke} color="error">
            Revoke
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default APIKeyList;
