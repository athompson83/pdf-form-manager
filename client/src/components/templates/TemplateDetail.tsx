import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  FileCopy as FileCopyIcon,
} from '@mui/icons-material';
import { Template, PDFField, TemplateFormData } from '../../types';
import PDFPreview from '../PDFPreview';

const TemplateDetail: React.FC = () => {
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fillDialogOpen, setFillDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>({});

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch template');
      }

      setTemplate(data.data.template);
      
      // Initialize form data with default values
      const initialData: TemplateFormData = {};
      data.data.template.fields.forEach((field: PDFField) => {
        initialData[field.name] = field.defaultValue || '';
      });
      setFormData(initialData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete template');
      }

      navigate('/templates');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFillTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${id}/fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formData }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fill template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template?.name}-filled.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setFillDialogOpen(false);
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

  if (!template) {
    return <Typography>Template not found</Typography>;
  }

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
        <Typography variant="h4">{template.name}</Typography>
        <Box>
          <IconButton onClick={() => setFillDialogOpen(true)}>
            <FileCopyIcon />
          </IconButton>
          <IconButton onClick={() => navigate(`/templates/${id}/edit`)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => setDeleteDialogOpen(true)}>
            <DeleteIcon />
          </IconButton>
          <IconButton
            href={`/api/templates/${id}/download`}
            download={`${template.name}.pdf`}
          >
            <DownloadIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Template Details
              </Typography>
              <Typography color="text.secondary" paragraph>
                {template.description}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={template.status}
                  color={template.status === 'active' ? 'success' : 'default'}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={`Used ${template.usageCount} times`}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Form Fields
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Field Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>Default Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {template.fields.map((field) => (
                      <TableRow key={field.name}>
                        <TableCell>{field.name}</TableCell>
                        <TableCell>{field.type}</TableCell>
                        <TableCell>
                          {field.required ? (
                            <Chip
                              label="Required"
                              color="primary"
                              size="small"
                            />
                          ) : (
                            <Chip
                              label="Optional"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>{field.defaultValue || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <PDFPreview templateId={template._id} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{template.name}"? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fill Template Dialog */}
      <Dialog
        open={fillDialogOpen}
        onClose={() => setFillDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Fill Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {template.fields.map((field) => (
              <Grid item xs={12} key={field.name}>
                {field.type === 'checkbox' ? (
                  <TextField
                    select
                    fullWidth
                    label={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field.name]: e.target.value,
                      }))
                    }
                    required={field.required}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </TextField>
                ) : (
                  <TextField
                    fullWidth
                    label={field.name}
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field.name]: e.target.value,
                      }))
                    }
                    required={field.required}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFillDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleFillTemplate} variant="contained">
            Generate PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateDetail;
