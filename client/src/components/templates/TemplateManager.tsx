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
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileCopy as FileCopyIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface Template {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  fields: PDFField[];
  status: 'active' | 'archived';
}

interface PDFField {
  name: string;
  type: string;
  required: boolean;
}

const TemplateManager: React.FC = () => {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
  }, [token]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/templates', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError('Failed to load templates');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('name', newTemplate.name);
    formData.append('description', newTemplate.description);

    try {
      const response = await fetch('http://localhost:3001/api/templates', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload template');

      await fetchTemplates();
      setIsDialogOpen(false);
      setNewTemplate({ name: '', description: '' });
      setFile(null);
    } catch (err) {
      setError('Failed to upload template');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/templates/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete template');

      await fetchTemplates();
    } catch (err) {
      setError('Failed to delete template');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            Template Manager
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsDialogOpen(true)}
          >
            Upload New Template
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Fields</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={template.status}
                      color={template.status === 'active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(template.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{template.fields.length} fields</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => {
                        setSelectedTemplate(template);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(template.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Upload Dialog */}
        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
          <DialogTitle>Upload New Template</DialogTitle>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Template Name"
              value={newTemplate.name}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, name: e.target.value })
              }
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newTemplate.description}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, description: e.target.value })
              }
            />
            <input
              accept="application/pdf"
              style={{ display: 'none' }}
              id="pdf-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="pdf-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                sx={{ mt: 2 }}
              >
                Select PDF Template
              </Button>
            </label>
            {file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected file: {file.name}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              Upload
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog
          open={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Template Preview</DialogTitle>
          <DialogContent>
            {selectedTemplate && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedTemplate.name}
                </Typography>
                <Typography variant="body2" paragraph>
                  {selectedTemplate.description}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  Form Fields:
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Field Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Required</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTemplate.fields.map((field) => (
                        <TableRow key={field.name}>
                          <TableCell>{field.name}</TableCell>
                          <TableCell>{field.type}</TableCell>
                          <TableCell>
                            {field.required ? 'Yes' : 'No'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsPreviewOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default TemplateManager;
