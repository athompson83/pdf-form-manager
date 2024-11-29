import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  status: 'success' | 'error' | 'warning';
  userId: string;
  userEmail: string;
  details: {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    error?: string;
    requestBody?: any;
    responseBody?: any;
  };
}

interface FilterState {
  action: string;
  status: string;
  startDate: string;
  endDate: string;
}

const ActivityLogs: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState<FilterState>({
    action: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchLogs();
  }, [token, filters]);

  const fetchLogs = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await fetch(
        `http://localhost:3001/api/logs?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch logs');

      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError('Failed to load activity logs');
    }
  };

  const handleFilterChange = (
    field: keyof FilterState,
    value: string
  ) => {
    setFilters({ ...filters, [field]: value });
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

  const formatDuration = (duration: number) => {
    return `${duration}ms`;
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Activity Logs
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="template_upload">Template Upload</MenuItem>
                  <MenuItem value="pdf_fill">PDF Fill</MenuItem>
                  <MenuItem value="webhook_trigger">Webhook Trigger</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Logs Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Path</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.status}
                      color={getStatusColor(log.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{log.userEmail}</TableCell>
                  <TableCell>{log.details.method}</TableCell>
                  <TableCell>{log.details.path}</TableCell>
                  <TableCell>{formatDuration(log.details.duration)}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => {
                        setSelectedLog(log);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Details Dialog */}
        <Dialog
          open={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Log Details</DialogTitle>
          <DialogContent>
            {selectedLog && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Request Details
                </Typography>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2">
                    Method: {selectedLog.details.method}
                  </Typography>
                  <Typography variant="body2">
                    Path: {selectedLog.details.path}
                  </Typography>
                  <Typography variant="body2">
                    Status Code: {selectedLog.details.statusCode}
                  </Typography>
                  <Typography variant="body2">
                    Duration: {formatDuration(selectedLog.details.duration)}
                  </Typography>
                </Paper>

                {selectedLog.details.error && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Error Details
                    </Typography>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="body2" color="error">
                        {selectedLog.details.error}
                      </Typography>
                    </Paper>
                  </>
                )}

                {selectedLog.details.requestBody && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Request Body
                    </Typography>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <pre>
                        {JSON.stringify(selectedLog.details.requestBody, null, 2)}
                      </pre>
                    </Paper>
                  </>
                )}

                {selectedLog.details.responseBody && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Response Body
                    </Typography>
                    <Paper sx={{ p: 2 }}>
                      <pre>
                        {JSON.stringify(selectedLog.details.responseBody, null, 2)}
                      </pre>
                    </Paper>
                  </>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ActivityLogs;
