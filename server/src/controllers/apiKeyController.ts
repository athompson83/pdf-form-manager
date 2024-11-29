import { Request, Response, NextFunction } from 'express';
import { APIKey } from '../models/APIKey';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const createAPIKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, permissions } = req.body;

    const apiKey = await APIKey.create({
      name,
      permissions,
      createdBy: req.user._id,
    });

    logger.info(`API key created: ${name}`);

    res.status(201).json({
      status: 'success',
      data: {
        apiKey,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAPIKeys = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKeys = await APIKey.find({
      ...(req.user.role !== 'admin' && { createdBy: req.user._id }),
    });

    res.status(200).json({
      status: 'success',
      data: {
        apiKeys,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAPIKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = await APIKey.findById(req.params.id);
    if (!apiKey) {
      throw new AppError('API key not found', 404);
    }

    // Check if user has access to this API key
    if (req.user.role !== 'admin' && apiKey.createdBy.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to access this API key', 403);
    }

    res.status(200).json({
      status: 'success',
      data: {
        apiKey,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAPIKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, permissions, status } = req.body;
    const apiKey = await APIKey.findById(req.params.id);

    if (!apiKey) {
      throw new AppError('API key not found', 404);
    }

    // Check if user has access to update this API key
    if (req.user.role !== 'admin' && apiKey.createdBy.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update this API key', 403);
    }

    // Update fields
    if (name) apiKey.name = name;
    if (permissions) apiKey.permissions = permissions;
    if (status) apiKey.status = status;

    await apiKey.save();

    logger.info(`API key updated: ${apiKey.name}`);

    res.status(200).json({
      status: 'success',
      data: {
        apiKey,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const revokeAPIKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = await APIKey.findById(req.params.id);

    if (!apiKey) {
      throw new AppError('API key not found', 404);
    }

    // Check if user has access to revoke this API key
    if (req.user.role !== 'admin' && apiKey.createdBy.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to revoke this API key', 403);
    }

    apiKey.status = 'revoked';
    await apiKey.save();

    logger.info(`API key revoked: ${apiKey.name}`);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const validateAPIKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      throw new AppError('API key not provided', 401);
    }

    const key = authHeader.split(' ')[1];
    const apiKey = await APIKey.findOne({ key, status: 'active' });

    if (!apiKey) {
      throw new AppError('Invalid or revoked API key', 401);
    }

    // Update last used timestamp
    apiKey.lastUsed = new Date();
    await apiKey.save();

    // Add API key to request for further use
    req.apiKey = apiKey;
    next();
  } catch (error) {
    next(error);
  }
};
