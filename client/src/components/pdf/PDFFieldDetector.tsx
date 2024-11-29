import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Paper,
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
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { PDFDocument, PDFField } from '../../types';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import { useFeedback } from '../../context/FeedbackContext';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFFieldDetector: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.5);
  const [fields, setFields] = useState<PDFField[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<PDFField | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'text',
    required: false,
    validation: '',
    defaultValue: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showProgress, hideProgress, showToast } = useFeedback();

  useEffect(() => {
    if (pdfFile) {
      const url = URL.createObjectURL(pdfFile);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfFile]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setLoading(true);
      setPdfFile(file);

      // Create form data
      const formData = new FormData();
      formData.append('pdf', file);

      // Upload PDF and detect fields
      const response = await fetch('/api/pdf/detect-fields', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to detect fields');
      }

      setFields(data.data.fields);
      setSuccess('Fields detected successfully');
      showToast('Successfully detected form fields', 'success');
    } catch (err: any) {
      setError(err.message);
      showToast('Failed to detect fields in PDF', 'error');
    } finally {
      setLoading(false);
      hideProgress();
    }
  };

  const handleSaveField = async () => {
    try {
      setLoading(true);
      setError(null);

      const method = selectedField ? 'PUT' : 'POST';
      const url = selectedField
        ? `/api/pdf/fields/${selectedField._id}`
        : '/api/pdf/fields';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save field');
      }

      setSuccess('Field saved successfully');
      setDialogOpen(false);
      
      // Refresh fields
      const fieldsResponse = await fetch('/api/pdf/fields');
      const fieldsData = await fieldsResponse.json();
      setFields(fieldsData.data.fields);
      showToast('Field saved successfully', 'success');
    } catch (err: any) {
      setError(err.message);
      showToast('Failed to save field', 'error');
    } finally {
      setLoading(false);
      hideProgress();
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!window.confirm('Are you sure you want to delete this field?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/pdf/fields/${fieldId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete field');
      }

      setSuccess('Field deleted successfully');
      setFields(fields.filter((field) => field._id !== fieldId));
      showToast('Field deleted successfully', 'success');
    } catch (err: any) {
      setError(err.message);
      showToast('Failed to delete field', 'error');
    } finally {
      setLoading(false);
      hideProgress();
    }
  };

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'text',
      required: false,
      validation: '',
      defaultValue: '',
    });
    setSelectedField(null);
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
        <Typography variant="h4">PDF Field Detection</Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload PDF
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
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
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {pdfUrl ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <Typography component="span" sx={{ mx: 2 }}>
                      Page {currentPage} of {numPages}
                    </Typography>
                    <Button
                      onClick={() =>
                        setCurrentPage(Math.min(numPages, currentPage + 1))
                      }
                      disabled={currentPage >= numPages}
                    >
                      Next
                    </Button>
                    <Button
                      onClick={() => setScale(scale + 0.2)}
                      sx={{ ml: 2 }}
                    >
                      Zoom In
                    </Button>
                    <Button
                      onClick={() => setScale(Math.max(0.5, scale - 0.2))}
                    >
                      Zoom Out
                    </Button>
                  </Box>
                  <Paper
                    variant="outlined"
                    sx={{ maxHeight: 800, overflow: 'auto' }}
                  >
                    <Document
                      file={pdfUrl}
                      onLoadSuccess={handleDocumentLoadSuccess}
                      loading={
                        <CircularProgress
                          sx={{ m: 2 }}
                          size={40}
                          thickness={6}
                        />
                      }
                    >
                      <Page
                        pageNumber={currentPage}
                        scale={scale}
                        renderAnnotationLayer={true}
                        renderTextLayer={true}
                      />
                    </Document>
                  </Paper>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 400,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                  }}
                >
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Upload a PDF to detect form fields
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select PDF
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
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
                <Typography variant="h6">Detected Fields</Typography>
                <Tooltip title="Re-detect Fields">
                  <IconButton
                    onClick={() => handleFileUpload({ target: { files: [pdfFile] } } as any)}
                    disabled={!pdfFile || loading}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <List>
                {fields.map((field) => (
                  <ListItem
                    key={field._id}
                    sx={{
                      bgcolor: 'background.paper',
                      mb: 1,
                      borderRadius: 1,
                    }}
                  >
                    <ListItemText
                      primary={field.name}
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={field.type}
                            size="small"
                            sx={{ mr: 0.5 }}
                          />
                          {field.required && (
                            <Chip
                              label="Required"
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setSelectedField(field);
                          setFormData({
                            name: field.name,
                            type: field.type,
                            required: field.required,
                            validation: field.validation || '',
                            defaultValue: field.defaultValue || '',
                          });
                          setDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteField(field._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {fields.length === 0 && !loading && (
                <Typography
                  color="text.secondary"
                  sx={{ textAlign: 'center', mt: 2 }}
                >
                  No fields detected
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

      {/* Edit Field Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedField ? 'Edit Field' : 'Add Field'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Field Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Field Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Field Type"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="checkbox">Checkbox</MenuItem>
                  <MenuItem value="radio">Radio</MenuItem>
                  <MenuItem value="select">Select</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Validation Rule"
                value={formData.validation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    validation: e.target.value,
                  }))
                }
                helperText="Enter regex pattern or validation rule"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Default Value"
                value={formData.defaultValue}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultValue: e.target.value,
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveField} variant="contained">
            {selectedField ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PDFFieldDetector;
