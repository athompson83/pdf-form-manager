import { Request, Response, NextFunction } from 'express';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { Template } from '../models/Template';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const UPLOAD_DIR = path.join(__dirname, '../../uploads/templates');

// Ensure upload directory exists
(async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
})();

export const uploadTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const { name, description } = req.body;
    const file = req.file;

    // Read PDF and analyze form fields
    const pdfBytes = await fs.readFile(file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields().map(field => ({
      name: field.getName(),
      type: field.constructor.name.replace('PDFField', '').toLowerCase(),
      required: false, // Default value, can be updated later
    }));

    // Move file to permanent location
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    await fs.rename(file.path, filePath);

    // Create template record
    const template = await Template.create({
      name,
      description,
      filePath: fileName,
      fields,
      createdBy: req.user._id,
    });

    logger.info(`Template uploaded: ${name}`);

    res.status(201).json({
      status: 'success',
      data: {
        template,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const templates = await Template.find({
      status: 'active',
      ...(req.user.role !== 'admin' && { createdBy: req.user._id }),
    });

    res.status(200).json({
      status: 'success',
      data: {
        templates,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Check if user has access to this template
    if (req.user.role !== 'admin' && template.createdBy.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to access this template', 403);
    }

    res.status(200).json({
      status: 'success',
      data: {
        template,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, fields, status } = req.body;
    const template = await Template.findById(req.params.id);

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Check if user has access to update this template
    if (req.user.role !== 'admin' && template.createdBy.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update this template', 403);
    }

    // Update fields
    if (name) template.name = name;
    if (description) template.description = description;
    if (fields) template.fields = fields;
    if (status) template.status = status;

    await template.save();

    logger.info(`Template updated: ${template.name}`);

    res.status(200).json({
      status: 'success',
      data: {
        template,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Check if user has access to delete this template
    if (req.user.role !== 'admin' && template.createdBy.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to delete this template', 403);
    }

    // Soft delete by updating status
    template.status = 'archived';
    await template.save();

    logger.info(`Template archived: ${template.name}`);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const fillTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      throw new AppError('Template not found', 404);
    }

    const { formData } = req.body;

    // Read the PDF template
    const pdfBytes = await fs.readFile(path.join(UPLOAD_DIR, template.filePath));
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Fill form fields
    Object.entries(formData).forEach(([fieldName, value]) => {
      const field = form.getField(fieldName);
      if (field) {
        switch (field.constructor.name) {
          case 'PDFTextField':
            field.setText(value as string);
            break;
          case 'PDFCheckBox':
            field.check();
            break;
          // Add other field types as needed
        }
      }
    });

    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    const fileName = `filled-${Date.now()}-${path.basename(template.filePath)}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    await fs.writeFile(filePath, filledPdfBytes);

    // Increment usage count
    template.usageCount += 1;
    await template.save();

    logger.info(`Template filled: ${template.name}`);

    res.status(200).json({
      status: 'success',
      data: {
        filePath: fileName,
      },
    });
  } catch (error) {
    next(error);
  }
};
