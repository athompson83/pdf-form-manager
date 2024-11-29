import express from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { BubbleConfig } from '../models/BubbleConfig';
import { FieldMapping } from '../models/FieldMapping';
import { Template } from '../models/Template';
import { logError } from '../middleware/logger';
import axios from 'axios';

const router = express.Router();

// Get Bubble configuration
router.get('/config', authenticate, async (req, res) => {
  try {
    const config = await BubbleConfig.findOne({ userId: req.user._id });
    res.json({ success: true, data: { config } });
  } catch (error) {
    logError(error as Error, req, res, req.user);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Bubble configuration',
    });
  }
});

// Save Bubble configuration
router.post(
  '/config',
  authenticate,
  [
    body('apiKey').notEmpty().withMessage('API key is required'),
    body('appName').notEmpty().withMessage('App name is required'),
    body('environment')
      .isIn(['development', 'staging', 'production'])
      .withMessage('Invalid environment'),
    body('endpoint').notEmpty().isURL().withMessage('Valid endpoint is required'),
    body('webhookUrl')
      .optional()
      .isURL()
      .withMessage('Valid webhook URL is required'),
    body('enableSync').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const config = await BubbleConfig.findOneAndUpdate(
        { userId: req.user._id },
        { ...req.body, userId: req.user._id },
        { upsert: true, new: true }
      );
      res.json({ success: true, data: { config } });
    } catch (error) {
      logError(error as Error, req, res, req.user);
      res.status(500).json({
        success: false,
        message: 'Failed to save configuration',
      });
    }
  }
);

// Test Bubble connection
router.post('/test', authenticate, async (req, res) => {
  try {
    const config = await BubbleConfig.findOne({ userId: req.user._id });
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Bubble configuration not found',
      });
    }

    // Test API connection
    const response = await axios.get(
      `${config.endpoint}/api/1.1/obj/test_connection`,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      }
    );

    res.json({
      success: true,
      data: {
        success: true,
        message: 'Connection successful',
        details: response.data,
      },
    });
  } catch (error: any) {
    logError(error as Error, req, res, req.user);
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      data: {
        success: false,
        message: error.message,
        details: error.response?.data,
      },
    });
  }
});

// Get field mappings
router.get('/mappings', authenticate, async (req, res) => {
  try {
    const mappings = await FieldMapping.find({ userId: req.user._id });
    res.json({ success: true, data: { mappings } });
  } catch (error) {
    logError(error as Error, req, res, req.user);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mappings',
    });
  }
});

// Create field mapping
router.post(
  '/mappings',
  authenticate,
  [
    body('pdfFieldId').notEmpty().withMessage('PDF field ID is required'),
    body('bubbleFieldId').notEmpty().withMessage('Bubble field ID is required'),
    body('transformationType')
      .isIn(['direct', 'format', 'custom'])
      .withMessage('Invalid transformation type'),
    body('transformationRule').optional(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const mapping = await FieldMapping.create({
        ...req.body,
        userId: req.user._id,
      });
      res.status(201).json({ success: true, data: { mapping } });
    } catch (error) {
      logError(error as Error, req, res, req.user);
      res.status(500).json({
        success: false,
        message: 'Failed to create mapping',
      });
    }
  }
);

// Update field mapping
router.put(
  '/mappings/:id',
  authenticate,
  [
    param('id').notEmpty().withMessage('Mapping ID is required'),
    body('pdfFieldId').optional(),
    body('bubbleFieldId').optional(),
    body('transformationType')
      .optional()
      .isIn(['direct', 'format', 'custom']),
    body('transformationRule').optional(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const mapping = await FieldMapping.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        req.body,
        { new: true }
      );

      if (!mapping) {
        return res.status(404).json({
          success: false,
          message: 'Mapping not found',
        });
      }

      res.json({ success: true, data: { mapping } });
    } catch (error) {
      logError(error as Error, req, res, req.user);
      res.status(500).json({
        success: false,
        message: 'Failed to update mapping',
      });
    }
  }
);

// Delete field mapping
router.delete('/mappings/:id', authenticate, async (req, res) => {
  try {
    const mapping = await FieldMapping.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Mapping not found',
      });
    }

    res.json({ success: true, data: { mapping } });
  } catch (error) {
    logError(error as Error, req, res, req.user);
    res.status(500).json({
      success: false,
      message: 'Failed to delete mapping',
    });
  }
});

// Sync fields with Bubble
router.post('/sync', authenticate, async (req, res) => {
  try {
    const config = await BubbleConfig.findOne({ userId: req.user._id });
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Bubble configuration not found',
      });
    }

    if (!config.enableSync) {
      return res.status(400).json({
        success: false,
        message: 'Field synchronization is disabled',
      });
    }

    // Get all templates
    const templates = await Template.find({ userId: req.user._id });
    const fields = templates.reduce((acc: any[], template) => {
      return [...acc, ...template.fields];
    }, []);

    // Sync fields with Bubble
    const response = await axios.post(
      `${config.endpoint}/api/1.1/obj/pdf_fields/sync`,
      {
        fields: fields.map((field) => ({
          name: field.name,
          type: field.type,
          required: field.required,
          metadata: field.metadata,
        })),
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      }
    );

    res.json({
      success: true,
      data: {
        message: 'Fields synchronized successfully',
        details: response.data,
      },
    });
  } catch (error: any) {
    logError(error as Error, req, res, req.user);
    res.status(500).json({
      success: false,
      message: 'Failed to synchronize fields',
      details: error.response?.data,
    });
  }
});

// Get Bubble fields
router.get('/fields', authenticate, async (req, res) => {
  try {
    const config = await BubbleConfig.findOne({ userId: req.user._id });
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Bubble configuration not found',
      });
    }

    const response = await axios.get(
      `${config.endpoint}/api/1.1/obj/pdf_fields`,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      }
    );

    res.json({
      success: true,
      data: {
        fields: response.data.response.results,
      },
    });
  } catch (error) {
    logError(error as Error, req, res, req.user);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Bubble fields',
    });
  }
});

export default router;
