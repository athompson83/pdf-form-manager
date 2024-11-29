import express from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { Webhook } from '../models/Webhook';
import { logError } from '../middleware/logger';
import axios from 'axios';
import { BubbleConfig } from '../models/BubbleConfig';

const router = express.Router();

// Get webhooks
router.get('/', authenticate, async (req, res) => {
  try {
    const webhooks = await Webhook.find({ userId: req.user._id });
    res.json({ success: true, data: { webhooks } });
  } catch (error) {
    logError(error as Error, req, res, req.user);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch webhooks',
    });
  }
});

// Create webhook
router.post(
  '/',
  authenticate,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('url').notEmpty().isURL().withMessage('Valid URL is required'),
    body('method')
      .isIn(['GET', 'POST', 'PUT', 'PATCH'])
      .withMessage('Invalid method'),
    body('headers').optional().isObject(),
    body('enabled').optional().isBoolean(),
    body('description').optional(),
    body('fieldMapping').optional().isObject(),
    body('retryCount').optional().isInt({ min: 0 }),
    body('timeout').optional().isInt({ min: 1000 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const webhook = await Webhook.create({
        ...req.body,
        userId: req.user._id,
      });
      res.status(201).json({ success: true, data: { webhook } });
    } catch (error) {
      logError(error as Error, req, res, req.user);
      res.status(500).json({
        success: false,
        message: 'Failed to create webhook',
      });
    }
  }
);

// Update webhook
router.put(
  '/:id',
  authenticate,
  [
    param('id').notEmpty().withMessage('Webhook ID is required'),
    body('name').optional(),
    body('url').optional().isURL(),
    body('method').optional().isIn(['GET', 'POST', 'PUT', 'PATCH']),
    body('headers').optional().isObject(),
    body('enabled').optional().isBoolean(),
    body('description').optional(),
    body('fieldMapping').optional().isObject(),
    body('retryCount').optional().isInt({ min: 0 }),
    body('timeout').optional().isInt({ min: 1000 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const webhook = await Webhook.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        req.body,
        { new: true }
      );

      if (!webhook) {
        return res.status(404).json({
          success: false,
          message: 'Webhook not found',
        });
      }

      res.json({ success: true, data: { webhook } });
    } catch (error) {
      logError(error as Error, req, res, req.user);
      res.status(500).json({
        success: false,
        message: 'Failed to update webhook',
      });
    }
  }
);

// Delete webhook
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const webhook = await Webhook.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found',
      });
    }

    res.json({ success: true, data: { webhook } });
  } catch (error) {
    logError(error as Error, req, res, req.user);
    res.status(500).json({
      success: false,
      message: 'Failed to delete webhook',
    });
  }
});

// Test webhook
router.post(
  '/:id/test',
  authenticate,
  [
    param('id').notEmpty().withMessage('Webhook ID is required'),
    body('pdfFields').isArray().withMessage('PDF fields are required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const webhook = await Webhook.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!webhook) {
        return res.status(404).json({
          success: false,
          message: 'Webhook not found',
        });
      }

      if (!webhook.enabled) {
        return res.status(400).json({
          success: false,
          message: 'Webhook is disabled',
        });
      }

      // Get Bubble configuration for field detection
      const bubbleConfig = await BubbleConfig.findOne({ userId: req.user._id });
      if (!bubbleConfig) {
        return res.status(404).json({
          success: false,
          message: 'Bubble configuration not found',
        });
      }

      // Transform PDF fields according to mapping
      const transformedData = transformFields(
        req.body.pdfFields,
        webhook.fieldMapping
      );

      // Make webhook request
      const response = await axios({
        method: webhook.method,
        url: webhook.url,
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers,
        },
        data: transformedData,
        timeout: webhook.timeout,
      });

      // Detect Bubble fields
      const bubbleFields = await detectBubbleFields(
        bubbleConfig,
        req.body.pdfFields
      );

      res.json({
        success: true,
        data: {
          webhookResponse: response.data,
          bubbleFields,
        },
      });
    } catch (error: any) {
      logError(error as Error, req, res, req.user);
      res.status(500).json({
        success: false,
        message: 'Webhook test failed',
        details: error.response?.data || error.message,
      });
    }
  }
);

// Helper function to transform fields based on mapping
const transformFields = (fields: any[], mapping: any) => {
  if (!mapping || Object.keys(mapping).length === 0) {
    return fields;
  }

  return fields.map((field) => {
    const mappedField = mapping[field.name];
    if (mappedField) {
      return {
        ...field,
        name: mappedField.name || field.name,
        type: mappedField.type || field.type,
        value: transformValue(field.value, mappedField.transformation),
      };
    }
    return field;
  });
};

// Helper function to transform field values
const transformValue = (value: any, transformation: string | null) => {
  if (!transformation) return value;

  try {
    // Add custom transformations here
    switch (transformation) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value).toISOString();
      default:
        return value;
    }
  } catch (error) {
    console.error('Value transformation failed:', error);
    return value;
  }
};

// Helper function to detect Bubble fields
const detectBubbleFields = async (
  bubbleConfig: any,
  pdfFields: any[]
): Promise<any[]> => {
  try {
    // Call Bubble API to get field definitions
    const response = await axios.get(
      `${bubbleConfig.endpoint}/api/1.1/obj/field_definitions`,
      {
        headers: {
          Authorization: `Bearer ${bubbleConfig.apiKey}`,
        },
      }
    );

    // Map PDF fields to Bubble fields
    const bubbleFields = response.data.response.results.map((field: any) => ({
      _id: field._id,
      name: field.name,
      type: mapToBubbleType(field.type),
      required: field.required || false,
      options: field.options || [],
      metadata: {
        bubbleId: field._id,
        bubbleType: field.type,
      },
    }));

    return bubbleFields;
  } catch (error) {
    console.error('Failed to detect Bubble fields:', error);
    return [];
  }
};

// Helper function to map PDF field types to Bubble types
const mapToBubbleType = (pdfType: string): string => {
  switch (pdfType.toLowerCase()) {
    case 'text':
      return 'text';
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    case 'checkbox':
      return 'boolean';
    case 'radio':
    case 'select':
      return 'option';
    default:
      return 'text';
  }
};

export default router;
