import express from 'express';
import { body, param } from 'express-validator';
import multer from 'multer';
import { validateRequest } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { PDFDocument } from 'pdf-lib';
import { Template } from '../models/Template';
import { logError } from '../middleware/logger';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Detect fields in PDF
router.post(
  '/detect-fields',
  authenticate,
  upload.single('pdf'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded',
      });
    }

    try {
      const pdfBytes = fs.readFileSync(req.file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      const detectedFields = fields.map((field) => ({
        name: field.getName(),
        type: field.constructor.name.replace('PDFField', '').toLowerCase(),
        required: false, // Default value, can be updated later
        page: field.acroField.P().toString(),
        rect: field.acroField.Rect().toString(),
      }));

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        data: {
          fields: detectedFields,
        },
      });
    } catch (error) {
      // Clean up uploaded file in case of error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      logError(error as Error, req, res, req.user);
      res.status(500).json({
        success: false,
        message: 'Failed to detect fields in PDF',
      });
    }
  }
);

// Get PDF fields
router.get('/fields', authenticate, async (req, res) => {
  try {
    const template = await Template.findOne({
      userId: req.user._id,
      active: true,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'No active template found',
      });
    }

    res.json({
      success: true,
      data: {
        fields: template.fields,
      },
    });
  } catch (error) {
    logError(error as Error, req, res, req.user);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fields',
    });
  }
});

// Create PDF field
router.post(
  '/fields',
  authenticate,
  [
    body('name').notEmpty().withMessage('Field name is required'),
    body('type')
      .isIn(['text', 'number', 'date', 'checkbox', 'radio', 'select'])
      .withMessage('Invalid field type'),
    body('required').optional().isBoolean(),
    body('validation').optional(),
    body('defaultValue').optional(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const template = await Template.findOne({
        userId: req.user._id,
        active: true,
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'No active template found',
        });
      }

      template.fields.push(req.body);
      await template.save();

      res.status(201).json({
        success: true,
        data: {
          field: template.fields[template.fields.length - 1],
        },
      });
    } catch (error) {
      logError(error as Error, req, res, req.user);
      res.status(500).json({
        success: false,
        message: 'Failed to create field',
      });
    }
  }
);

// Update PDF field
router.put(
  '/fields/:id',
  authenticate,
  [
    param('id').notEmpty().withMessage('Field ID is required'),
    body('name').optional(),
    body('type')
      .optional()
      .isIn(['text', 'number', 'date', 'checkbox', 'radio', 'select']),
    body('required').optional().isBoolean(),
    body('validation').optional(),
    body('defaultValue').optional(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const template = await Template.findOne({
        userId: req.user._id,
        active: true,
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'No active template found',
        });
      }

      const fieldIndex = template.fields.findIndex(
        (field) => field._id.toString() === req.params.id
      );

      if (fieldIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Field not found',
        });
      }

      template.fields[fieldIndex] = {
        ...template.fields[fieldIndex],
        ...req.body,
      };

      await template.save();

      res.json({
        success: true,
        data: {
          field: template.fields[fieldIndex],
        },
      });
    } catch (error) {
      logError(error as Error, req, res, req.user);
      res.status(500).json({
        success: false,
        message: 'Failed to update field',
      });
    }
  }
);

// Delete PDF field
router.delete('/fields/:id', authenticate, async (req, res) => {
  try {
    const template = await Template.findOne({
      userId: req.user._id,
      active: true,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'No active template found',
      });
    }

    const fieldIndex = template.fields.findIndex(
      (field) => field._id.toString() === req.params.id
    );

    if (fieldIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Field not found',
      });
    }

    template.fields.splice(fieldIndex, 1);
    await template.save();

    res.json({
      success: true,
      data: {
        message: 'Field deleted successfully',
      },
    });
  } catch (error) {
    logError(error as Error, req, res, req.user);
    res.status(500).json({
      success: false,
      message: 'Failed to delete field',
    });
  }
});

// Fill PDF template
router.post(
  '/fill',
  authenticate,
  [body('values').isObject().withMessage('Field values are required')],
  validateRequest,
  async (req, res) => {
    try {
      const template = await Template.findOne({
        userId: req.user._id,
        active: true,
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'No active template found',
        });
      }

      const pdfBytes = fs.readFileSync(template.filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Fill form fields
      Object.entries(req.body.values).forEach(([fieldName, value]) => {
        const field = form.getField(fieldName);
        if (field) {
          switch (field.constructor.name) {
            case 'PDFTextField':
              field.setText(value as string);
              break;
            case 'PDFCheckBox':
              if (value) {
                field.check();
              } else {
                field.uncheck();
              }
              break;
            case 'PDFRadioGroup':
              field.select(value as string);
              break;
            // Add more field types as needed
          }
        }
      });

      // Save filled PDF
      const filledPdfBytes = await pdfDoc.save();
      const outputPath = path.join(
        'filled',
        `${Date.now()}-${template.name}.pdf`
      );
      fs.writeFileSync(outputPath, filledPdfBytes);

      res.json({
        success: true,
        data: {
          filePath: outputPath,
        },
      });
    } catch (error) {
      logError(error as Error, req, res, req.user);
      res.status(500).json({
        success: false,
        message: 'Failed to fill PDF template',
      });
    }
  }
);

export default router;
