import express from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { logError } from '../middleware/logger';

const router = express.Router();

// Validate field mappings
router.post(
  '/validate',
  authenticate,
  [
    body('pdfFields').isArray().withMessage('PDF fields are required'),
    body('bubbleFields').isArray().withMessage('Bubble fields are required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { pdfFields, bubbleFields } = req.body;
      const validationResults = [];

      // Validate field presence
      for (const pdfField of pdfFields) {
        const bubbleField = bubbleFields.find(
          (bf: any) =>
            bf.name === pdfField.name || bf.metadata?.pdfFieldId === pdfField._id
        );

        if (!bubbleField) {
          validationResults.push({
            severity: 'error',
            field: pdfField,
            message: 'No matching Bubble field found',
            type: 'missing_field',
            suggestions: findSimilarFields(pdfField, bubbleFields),
          });
          continue;
        }

        // Validate field types
        const typeValidation = validateFieldTypes(pdfField, bubbleField);
        if (typeValidation) {
          validationResults.push(typeValidation);
        }

        // Validate field constraints
        const constraintValidation = validateFieldConstraints(
          pdfField,
          bubbleField
        );
        if (constraintValidation) {
          validationResults.push(constraintValidation);
        }
      }

      // Check for unused Bubble fields
      for (const bubbleField of bubbleFields) {
        const pdfField = pdfFields.find(
          (pf: any) =>
            pf.name === bubbleField.name ||
            bubbleField.metadata?.pdfFieldId === pf._id
        );

        if (!pdfField) {
          validationResults.push({
            severity: 'warning',
            field: bubbleField,
            message: 'Unused Bubble field',
            type: 'unused_field',
            suggestions: findSimilarFields(bubbleField, pdfFields),
          });
        }
      }

      res.json({
        success: true,
        data: {
          validationResults,
        },
      });
    } catch (error) {
      logError(error as Error, req, res, req.user);
      res.status(500).json({
        success: false,
        message: 'Validation failed',
      });
    }
  }
);

// Get auto-fix suggestions
router.post(
  '/auto-fix',
  authenticate,
  [
    body('pdfFields').isArray().withMessage('PDF fields are required'),
    body('bubbleFields').isArray().withMessage('Bubble fields are required'),
    body('validationResults')
      .isArray()
      .withMessage('Validation results are required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { pdfFields, bubbleFields, validationResults } = req.body;
      const fixes = [];

      for (const result of validationResults) {
        switch (result.type) {
          case 'missing_field':
            fixes.push(generateMissingFieldFix(result, bubbleFields));
            break;
          case 'type_mismatch':
            fixes.push(generateTypeMismatchFix(result));
            break;
          case 'constraint_mismatch':
            fixes.push(generateConstraintMismatchFix(result));
            break;
          case 'validation_mismatch':
            fixes.push(generateValidationMismatchFix(result));
            break;
          case 'options_mismatch':
            fixes.push(generateOptionsMismatchFix(result));
            break;
        }
      }

      res.json({
        success: true,
        data: {
          fixes,
        },
      });
    } catch (error) {
      logError(error as Error, req, res, req.user);
      res.status(500).json({
        success: false,
        message: 'Failed to generate auto-fix suggestions',
      });
    }
  }
);

// Apply auto-fixes
router.post(
  '/apply-fixes',
  authenticate,
  [body('fixes').isArray().withMessage('Fixes are required')],
  validateRequest,
  async (req, res) => {
    try {
      const { fixes } = req.body;
      const results = [];

      for (const fix of fixes) {
        const result = await applyFix(fix);
        results.push(result);
      }

      res.json({
        success: true,
        data: {
          results,
        },
      });
    } catch (error) {
      logError(error as Error, req, res, req.user);
      res.status(500).json({
        success: false,
        message: 'Failed to apply fixes',
      });
    }
  }
);

// Helper functions
const validateFieldTypes = (pdfField: any, bubbleField: any) => {
  const pdfType = pdfField.type.toLowerCase();
  const bubbleType = bubbleField.type.toLowerCase();

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

const validateFieldConstraints = (pdfField: any, bubbleField: any) => {
  if (pdfField.required && !bubbleField.required) {
    return {
      severity: 'warning',
      field: pdfField,
      message: 'Required in PDF but optional in Bubble',
      type: 'constraint_mismatch',
      suggestions: ['Make Bubble field required'],
    };
  }

  if (pdfField.validation && !bubbleField.validation) {
    return {
      severity: 'warning',
      field: pdfField,
      message: 'PDF validation rules not enforced in Bubble',
      type: 'validation_mismatch',
      suggestions: ['Add validation rules to Bubble field'],
    };
  }

  if (
    (pdfField.type === 'select' || pdfField.type === 'radio') &&
    bubbleField.type === 'option'
  ) {
    const pdfOptions = pdfField.options || [];
    const bubbleOptions = bubbleField.options || [];
    const missingOptions = pdfOptions.filter(
      (opt: string) => !bubbleOptions.includes(opt)
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

const findSimilarFields = (sourceField: any, targetFields: any[]) => {
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
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[shorter.length] = lastValue;
    }
  }

  return (longer.length - costs[shorter.length]) / parseFloat(longer.length);
};

const generateMissingFieldFix = (result: any, bubbleFields: any[]) => {
  const similarFields = findSimilarFields(result.field, bubbleFields);
  
  if (similarFields.length > 0) {
    return {
      type: 'map_to_existing',
      field: result.field,
      suggestion: similarFields[0],
      action: {
        type: 'update_mapping',
        data: {
          pdfFieldId: result.field._id,
          bubbleFieldName: similarFields[0].split(' ')[2], // Extract field name from suggestion
        },
      },
    };
  }

  return {
    type: 'create_field',
    field: result.field,
    suggestion: `Create new Bubble field '${result.field.name}'`,
    action: {
      type: 'create_bubble_field',
      data: {
        name: result.field.name,
        type: result.field.type,
        required: result.field.required,
        validation: result.field.validation,
        options: result.field.options,
      },
    },
  };
};

const generateTypeMismatchFix = (result: any) => {
  return {
    type: 'type_conversion',
    field: result.field,
    suggestion: `Convert field type to match Bubble requirements`,
    action: {
      type: 'update_field_type',
      data: {
        fieldId: result.field._id,
        newType: getCompatibleType(result.field.type),
      },
    },
  };
};

const generateConstraintMismatchFix = (result: any) => {
  return {
    type: 'update_constraints',
    field: result.field,
    suggestion: `Update field constraints to match PDF requirements`,
    action: {
      type: 'update_field_constraints',
      data: {
        fieldId: result.field._id,
        required: result.field.required,
      },
    },
  };
};

const generateValidationMismatchFix = (result: any) => {
  return {
    type: 'add_validation',
    field: result.field,
    suggestion: `Add validation rules to match PDF requirements`,
    action: {
      type: 'update_field_validation',
      data: {
        fieldId: result.field._id,
        validation: result.field.validation,
      },
    },
  };
};

const generateOptionsMismatchFix = (result: any) => {
  return {
    type: 'update_options',
    field: result.field,
    suggestion: `Update field options to match PDF requirements`,
    action: {
      type: 'update_field_options',
      data: {
        fieldId: result.field._id,
        options: result.field.options,
      },
    },
  };
};

const getCompatibleType = (pdfType: string): string => {
  const typeMapping: { [key: string]: string } = {
    text: 'text',
    number: 'number',
    date: 'date',
    checkbox: 'boolean',
    radio: 'option',
    select: 'option',
  };

  return typeMapping[pdfType.toLowerCase()] || 'text';
};

const applyFix = async (fix: any) => {
  try {
    switch (fix.action.type) {
      case 'update_mapping':
        return await updateFieldMapping(fix.action.data);
      case 'create_bubble_field':
        return await createBubbleField(fix.action.data);
      case 'update_field_type':
        return await updateFieldType(fix.action.data);
      case 'update_field_constraints':
        return await updateFieldConstraints(fix.action.data);
      case 'update_field_validation':
        return await updateFieldValidation(fix.action.data);
      case 'update_field_options':
        return await updateFieldOptions(fix.action.data);
      default:
        throw new Error(`Unknown fix action type: ${fix.action.type}`);
    }
  } catch (error) {
    console.error('Failed to apply fix:', error);
    throw error;
  }
};

// Fix application functions
const updateFieldMapping = async (data: any) => {
  // Implementation
  return { success: true, message: 'Field mapping updated' };
};

const createBubbleField = async (data: any) => {
  // Implementation
  return { success: true, message: 'Bubble field created' };
};

const updateFieldType = async (data: any) => {
  // Implementation
  return { success: true, message: 'Field type updated' };
};

const updateFieldConstraints = async (data: any) => {
  // Implementation
  return { success: true, message: 'Field constraints updated' };
};

const updateFieldValidation = async (data: any) => {
  // Implementation
  return { success: true, message: 'Field validation updated' };
};

const updateFieldOptions = async (data: any) => {
  // Implementation
  return { success: true, message: 'Field options updated' };
};

export default router;
