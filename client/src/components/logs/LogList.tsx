import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Chip,
  TextField,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Log, FilterOptions } from '../../types';

const LOG_ACTIONS = [
  'template:create',
  'template:update',
  'template:delete',
  'template:fill',
  'user:create',
  'user:update',
  'user:delete',
  'apiKey:create',
  'apiKey:revoke',
  'auth:login',
  'auth:logout',
];

const LogList: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    action: '',
    status: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/logs?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch logs');
      }

      setLogs(data.data.logs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/logs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to export logs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
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
        <Typography variant="h4">Activity Logs</Typography>
        <Box>
          <IconButton onClick={() => setFilterDialogOpen(true)}>
            <FilterIcon />
          </IconButton>
          <IconButton onClick={fetchLogs}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ ml: 1 }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {typeof log.userId === 'string'
                        ? log.userId
                        : log.userId.email}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        color={getStatusColor(log.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {log.details.duration}ms
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailsOpen(true);
                          }}
                          size="small"
                        >
                          <InfoIcon />
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

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filter Logs</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={filters.action}
                  label="Action"
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      action: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  {LOG_ACTIONS.map((action) => (
                    <MenuItem key={action} value={action}>
                      {action}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={filters.startDate ? new Date(filters.startDate) : null}
                onChange={(date) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: date ? date.toISOString() : '',
                  }))
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={filters.endDate ? new Date(filters.endDate) : null}
                onChange={(date) =>
                  setFilters((prev) => ({
                    ...prev,
                    endDate: date ? date.toISOString() : '',
                  }))
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort By"
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="createdAt">Timestamp</MenuItem>
                  <MenuItem value="action">Action</MenuItem>
                  <MenuItem value="status">Status</MenuItem>
                  <MenuItem value="duration">Duration</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Sort Order</InputLabel>
                <Select
                  value={filters.sortOrder}
                  label="Sort Order"
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortOrder: e.target.value as 'asc' | 'desc',
                    }))
                  }
                >
                  <MenuItem value="desc">Newest First</MenuItem>
                  <MenuItem value="asc">Oldest First</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={() => setFilterDialogOpen(false)}
            fullWidth
          >
            Apply Filters
          </Button>
        </Box>
      </Dialog>

      {/* Log Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Timestamp
                </Typography>
                <Typography>
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Action
                </Typography>
                <Typography>{selectedLog.action}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={selectedLog.status}
                  color={getStatusColor(selectedLog.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  User
                </Typography>
                <Typography>
                  {typeof selectedLog.userId === 'string'
                    ? selectedLog.userId
                    : selectedLog.userId.email}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Duration
                </Typography>
                <Typography>{selectedLog.details.duration}ms</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Method & Path
                </Typography>
                <Typography>
                  {selectedLog.details.method} {selectedLog.details.path}
                </Typography>
              </Grid>
              {selectedLog.details.error && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="error">
                    Error
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, bgcolor: 'error.light', color: 'error.main' }}
                  >
                    <Typography>{selectedLog.details.error}</Typography>
                  </Paper>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Request Body
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <pre style={{ margin: 0, overflow: 'auto' }}>
                    {JSON.stringify(selectedLog.details.requestBody, null, 2)}
                  </pre>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Response Body
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <pre style={{ margin: 0, overflow: 'auto' }}>
                    {JSON.stringify(selectedLog.details.responseBody, null, 2)}
                  </pre>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LogList;
