export const mockValidationResults = [
  {
    severity: 'error',
    field: {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    message: 'No matching Bubble field found',
    type: 'missing_field',
    suggestions: [
      'Map to first_name (90% match)',
    ],
  },
  {
    severity: 'warning',
    field: {
      name: 'age',
      type: 'number',
      required: false,
    },
    message: 'Field validation rules differ',
    type: 'validation_mismatch',
    suggestions: [
      'Update validation rules to match',
    ],
  },
  {
    severity: 'error',
    field: {
      name: 'gender',
      type: 'select',
      required: true,
    },
    message: 'Incompatible field types: select ↔ text',
    type: 'type_mismatch',
    suggestions: [
      'Convert to option type',
      'Change Bubble field type',
    ],
  },
  {
    severity: 'warning',
    field: {
      name: 'isStudent',
      type: 'checkbox',
      required: false,
    },
    message: 'Field name mismatch',
    type: 'name_mismatch',
    suggestions: [
      'Rename to student_status',
    ],
  },
];
