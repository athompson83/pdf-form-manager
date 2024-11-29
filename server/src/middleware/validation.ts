import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AppError } from './errorHandler';

const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    throw new AppError(errorMessages.join('. '), 400);
  }
  next();
};

export const validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter'),
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Invalid role'),
  handleValidationErrors,
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Please provide a password'),
  handleValidationErrors,
];

export const validateUserUpdate = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Invalid role'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  body('currentPassword')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Current password must be at least 8 characters long'),
  body('newPassword')
    .optional()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('New password must contain at least one number')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter'),
  handleValidationErrors,
];

export const validateTemplate = [
  body('name')
    .notEmpty()
    .withMessage('Template name is required')
    .isLength({ max: 100 })
    .withMessage('Template name cannot exceed 100 characters'),
  body('description')
    .notEmpty()
    .withMessage('Template description is required')
    .isLength({ max: 500 })
    .withMessage('Template description cannot exceed 500 characters'),
  handleValidationErrors,
];

export const validateTemplateUpdate = [
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Template name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Template description cannot exceed 500 characters'),
  body('fields')
    .optional()
    .isArray()
    .withMessage('Fields must be an array'),
  body('fields.*.name')
    .optional()
    .notEmpty()
    .withMessage('Field name is required'),
  body('fields.*.type')
    .optional()
    .isIn(['text', 'number', 'date', 'checkbox', 'radio'])
    .withMessage('Invalid field type'),
  body('status')
    .optional()
    .isIn(['active', 'archived'])
    .withMessage('Invalid status'),
  handleValidationErrors,
];

export const validateAPIKeyCreate = [
  body('name')
    .notEmpty()
    .withMessage('API key name is required')
    .isLength({ max: 100 })
    .withMessage('API key name cannot exceed 100 characters'),
  body('permissions')
    .isArray()
    .withMessage('Permissions must be an array')
    .custom((value) => {
      const validPermissions = [
        'templates:read',
        'templates:write',
        'forms:fill',
        'webhooks:manage',
      ];
      return value.every((permission: string) =>
        validPermissions.includes(permission)
      );
    })
    .withMessage('Invalid permissions'),
  handleValidationErrors,
];

export const validateAPIKeyUpdate = [
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('API key name cannot exceed 100 characters'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array')
    .custom((value) => {
      const validPermissions = [
        'templates:read',
        'templates:write',
        'forms:fill',
        'webhooks:manage',
      ];
      return value.every((permission: string) =>
        validPermissions.includes(permission)
      );
    })
    .withMessage('Invalid permissions'),
  body('status')
    .optional()
    .isIn(['active', 'revoked'])
    .withMessage('Invalid status'),
  handleValidationErrors,
];
