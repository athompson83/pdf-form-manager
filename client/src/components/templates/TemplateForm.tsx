import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Alert,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { Template, PDFField } from '../../types';

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
];

const TemplateForm: React.FC = () => {
  const [template, setTemplate] = useState<Partial<Template>>({
    name: '',
    description: '',
    fields: [],
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode) {
      fetchTemplate();
    }
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('name', template.name || '');
      formData.append('description', template.description || '');
      formData.append('fields', JSON.stringify(template.fields));
      formData.append('status', template.status || 'active');

      if (file) {
        formData.append('pdf', file);
      }

      const url = isEditMode ? `/api/templates/${id}` : '/api/templates';
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save template');
      }

      setSuccess('Template saved successfully');
      setTimeout(() => {
        navigate('/templates');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (index: number, field: Partial<PDFField>) => {
    const updatedFields = [...(template.fields || [])];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setTemplate((prev) => ({ ...prev, fields: updatedFields }));
  };

  const addField = () => {
    setTemplate((prev) => ({
      ...prev,
      fields: [
        ...(prev.fields || []),
        { name: '', type: 'text', required: false },
      ],
    }));
  };

  const removeField = (index: number) => {
    setTemplate((prev) => ({
      ...prev,
      fields: prev.fields?.filter((_, i) => i !== index),
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">
          {isEditMode ? 'Edit Template' : 'New Template'}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            sx={{ mr: 2 }}
            onClick={() => navigate('/templates')}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={loading}
          >
            Save Template
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Template Name"
                    value={template.name}
                    onChange={(e) =>
                      setTemplate((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={template.description}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                    >
                      {file
                        ? `Selected: ${file.name}`
                        : isEditMode
                        ? 'Replace PDF Template'
                        : 'Upload PDF Template'}
                    </Button>
                  </label>
                </Grid>
              </Grid>
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
                <Typography variant="h6">Form Fields</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addField}
                  size="small"
                >
                  Add Field
                </Button>
              </Box>
              {template.fields?.map((field, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 2,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2">Field {index + 1}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => removeField(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Field Name"
                        value={field.name}
                        onChange={(e) =>
                          handleFieldChange(index, { name: e.target.value })
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Field Type</InputLabel>
                        <Select
                          value={field.type}
                          label="Field Type"
                          onChange={(e) =>
                            handleFieldChange(index, {
                              type: e.target.value as PDFField['type'],
                            })
                          }
                          required
                        >
                          {fieldTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Default Value"
                        value={field.defaultValue || ''}
                        onChange={(e) =>
                          handleFieldChange(index, {
                            defaultValue: e.target.value,
                          })
                        }
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
              {template.fields?.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  No fields added yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TemplateForm;
