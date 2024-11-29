export const mockPDFFields = [
  {
    _id: '1',
    name: 'firstName',
    type: 'text',
    required: true,
    validation: {
      pattern: '^[A-Za-z]+$',
      message: 'Only letters allowed',
    },
  },
  {
    _id: '2',
    name: 'age',
    type: 'number',
    required: false,
    validation: {
      min: 0,
      max: 120,
      message: 'Age must be between 0 and 120',
    },
  },
  {
    _id: '3',
    name: 'gender',
    type: 'select',
    required: true,
    options: ['Male', 'Female', 'Other', 'Prefer not to say'],
  },
  {
    _id: '4',
    name: 'isStudent',
    type: 'checkbox',
    required: false,
  },
  {
    _id: '5',
    name: 'birthDate',
    type: 'date',
    required: true,
    validation: {
      min: '1900-01-01',
      message: 'Date must be after 1900-01-01',
    },
  },
];
