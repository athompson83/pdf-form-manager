import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { PDFField, BubbleField, ValidationResult } from '../../types';

interface FieldMappingValidatorProps {
  pdfFields: PDFField[];
  bubbleFields: BubbleField[];
  onValidationComplete: (results: ValidationResult[]) => void;
}

const FieldMappingValidator: React.FC<FieldMappingValidatorProps> = ({
  pdfFields,
  bubbleFields,
  onValidationComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>(
    []
  );
  const [selectedResult, setSelectedResult] = useState<ValidationResult | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [autoFixDialogOpen, setAutoFixDialogOpen] = useState(false);

  useEffect(() => {
    validateFieldMappings();
  }, [pdfFields, bubbleFields]);

  const validateFieldMappings = async () => {
    try {
      setLoading(true);
      setError(null);

      const results: ValidationResult[] = [];

      // Validate field presence
      pdfFields.forEach((pdfField) => {
        const bubbleField = bubbleFields.find(
          (bf) => bf.name === pdfField.name || bf.metadata?.pdfFieldId === pdfField._id
        );

        if (!bubbleField) {
          results.push({
            severity: 'error',
            field: pdfField,
            message: 'No matching Bubble field found',
            type: 'missing_field',
            suggestions: findSimilarFields(pdfField, bubbleFields),
          });
        } else {
          // Validate field type compatibility
          const typeValidation = validateFieldTypes(pdfField, bubbleField);
          if (typeValidation) {
            results.push(typeValidation);
          }

          // Validate field constraints
          const constraintValidation = validateFieldConstraints(
            pdfField,
            bubbleField
          );
          if (constraintValidation) {
            results.push(constraintValidation);
          }
        }
      });

      // Check for unused Bubble fields
      bubbleFields.forEach((bubbleField) => {
        const pdfField = pdfFields.find(
          (pf) => pf.name === bubbleField.name || bubbleField.metadata?.pdfFieldId === pf._id
        );

        if (!pdfField) {
          results.push({
            severity: 'warning',
            field: bubbleField,
            message: 'Unused Bubble field',
            type: 'unused_field',
            suggestions: findSimilarFields(bubbleField, pdfFields),
          });
        }
      });

      setValidationResults(results);
      onValidationComplete(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateFieldTypes = (
    pdfField: PDFField,
    bubbleField: BubbleField
  ): ValidationResult | null => {
    const pdfType = pdfField.type.toLowerCase();
    const bubbleType = bubbleField.type.toLowerCase();

    // Define type compatibility matrix
    const typeCompatibility: { [key: string]: string[] } = {
      text: ['text', 'string', 'email', 'phone'],
      number: ['number', 'integer', 'float'],
      date: ['date', 'datetime'],
      checkbox: ['boolean', 'checkbox'],
      radio: ['option', 'select', 'enum'],
      select: ['option', 'select', 'enum'],
    };

    if (!typeCompatibility[pdfType]?.includes(bubbleType)) {
      return {
        severity: 'error',
        field: pdfField,
        message: `Incompatible field types: PDF (${pdfType}) ↔ Bubble (${bubbleType})`,
        type: 'type_mismatch',
        suggestions: [
          `Convert ${pdfField.name} to ${bubbleType}`,
          `Change Bubble field type to ${pdfType}`,
        ],
      };
    }

    return null;
  };

  const validateFieldConstraints = (
    pdfField: PDFField,
    bubbleField: BubbleField
  ): ValidationResult | null => {
    // Check required constraints
    if (pdfField.required && !bubbleField.required) {
      return {
        severity: 'warning',
        field: pdfField,
        message: 'Required in PDF but optional in Bubble',
        type: 'constraint_mismatch',
        suggestions: ['Make Bubble field required'],
      };
    }

    // Check field validation rules
    if (pdfField.validation && !bubbleField.validation) {
      return {
        severity: 'warning',
        field: pdfField,
        message: 'PDF validation rules not enforced in Bubble',
        type: 'validation_mismatch',
        suggestions: ['Add validation rules to Bubble field'],
      };
    }

    // Check select/radio options
    if (
      (pdfField.type === 'select' || pdfField.type === 'radio') &&
      bubbleField.type === 'option'
    ) {
      const pdfOptions = pdfField.options || [];
      const bubbleOptions = bubbleField.options || [];

      const missingOptions = pdfOptions.filter(
        (opt) => !bubbleOptions.includes(opt)
      );

      if (missingOptions.length > 0) {
        return {
          severity: 'warning',
          field: pdfField,
          message: 'Missing options in Bubble field',
          type: 'options_mismatch',
          suggestions: [
            `Add missing options to Bubble field: ${missingOptions.join(', ')}`,
          ],
        };
      }
    }

    return null;
  };

  const findSimilarFields = (
    sourceField: PDFField | BubbleField,
    targetFields: (PDFField | BubbleField)[]
  ): string[] => {
    const suggestions: string[] = [];
    const sourceName = sourceField.name.toLowerCase();

    targetFields.forEach((field) => {
      const targetName = field.name.toLowerCase();
      const similarity = calculateStringSimilarity(sourceName, targetName);

      if (similarity > 0.7) {
        suggestions.push(
          `Map to ${field.name} (${Math.round(similarity * 100)}% match)`
        );
      }
    });

    return suggestions;
  };

  const calculateStringSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const costs: number[] = [];
    for (let i = 0; i <= longer.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= shorter.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (longer[i - 1] !== shorter[j - 1]) {
            newValue = Math.min(
              Math.min(newValue, lastValue),
              costs[j]
            ) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) {
        costs[shorter.length] = lastValue;
      }
    }

    return (
      (longer.length - costs[shorter.length]) / parseFloat(longer.length)
    );
  };

  const handleAutoFix = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get auto-fix suggestions from the server
      const response = await fetch('/api/field-mapping/auto-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfFields,
          bubbleFields,
          validationResults,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get auto-fix suggestions');
      }

      // Apply fixes
      setAutoFixDialogOpen(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <SuccessIcon color="success" />;
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
        <Typography variant="h4">Field Mapping Validation</Typography>
        <Button
          variant="contained"
          onClick={handleAutoFix}
          disabled={loading || validationResults.length === 0}
        >
          Auto-Fix Issues
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <List>
                {validationResults.map((result, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      bgcolor: 'background.paper',
                      mb: 1,
                      borderRadius: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getSeverityIcon(result.severity)}
                          <Typography
                            variant="subtitle1"
                            sx={{ ml: 1 }}
                          >
                            {result.field.name}
                          </Typography>
                          <Chip
                            label={result.type}
                            size="small"
                            sx={{ ml: 1 }}
                            color={
                              result.severity === 'error'
                                ? 'error'
                                : result.severity === 'warning'
                                ? 'warning'
                                : 'default'
                            }
                          />
                        </Box>
                      }
                      secondary={result.message}
                    />
                    <Tooltip title="View Details">
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setSelectedResult(result);
                          setDialogOpen(true);
                        }}
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                ))}
              </List>

              {validationResults.length === 0 && !loading && (
                <Typography
                  color="success.main"
                  sx={{ textAlign: 'center', mt: 2 }}
                >
                  All field mappings are valid
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

      {/* Validation Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Validation Details</DialogTitle>
        <DialogContent>
          {selectedResult && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Field Information</Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography>
                    <strong>Name:</strong> {selectedResult.field.name}
                  </Typography>
                  <Typography>
                    <strong>Type:</strong> {selectedResult.field.type}
                  </Typography>
                  <Typography>
                    <strong>Required:</strong>{' '}
                    {selectedResult.field.required ? 'Yes' : 'No'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Issue</Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography>
                    <strong>Type:</strong> {selectedResult.type}
                  </Typography>
                  <Typography>
                    <strong>Severity:</strong> {selectedResult.severity}
                  </Typography>
                  <Typography>
                    <strong>Message:</strong> {selectedResult.message}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Suggestions</Typography>
                <List>
                  {selectedResult.suggestions.map((suggestion, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={suggestion} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Auto-Fix Dialog */}
      <Dialog
        open={autoFixDialogOpen}
        onClose={() => setAutoFixDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Auto-Fix Suggestions</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            The following fixes are recommended:
          </Typography>
          {/* Add auto-fix suggestions here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAutoFixDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setAutoFixDialogOpen(false)}>
            Apply Fixes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FieldMappingValidator;
