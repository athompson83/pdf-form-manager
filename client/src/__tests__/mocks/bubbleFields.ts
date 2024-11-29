export const mockBubbleFields = [
  {
    name: 'first_name',
    type: 'text',
    required: true,
    validation: {
      pattern: '[A-Za-z]+',
      message: 'Letters only',
    },
  },
  {
    name: 'user_age',
    type: 'number',
    required: false,
    validation: {
      min: 0,
      max: 120,
      message: 'Invalid age',
    },
  },
  {
    name: 'gender_selection',
    type: 'option',
    required: true,
    options: ['Male', 'Female', 'Other', 'Prefer not to say'],
  },
  {
    name: 'student_status',
    type: 'boolean',
    required: false,
  },
  {
    name: 'date_of_birth',
    type: 'date',
    required: true,
  },
];
