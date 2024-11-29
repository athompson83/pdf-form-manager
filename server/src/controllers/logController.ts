import { Request, Response, NextFunction } from 'express';
import { Log } from '../models/Log';
import { AppError } from '../middleware/errorHandler';

export const createLog = async (
  action: string,
  status: 'success' | 'error' | 'warning',
  userId: string,
  details: {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    error?: string;
    requestBody?: any;
    responseBody?: any;
  }
) => {
  try {
    await Log.create({
      action,
      status,
      userId,
      details,
    });
  } catch (error) {
    console.error('Error creating log:', error);
  }
};

export const getLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      action,
      status,
      startDate,
      endDate,
      userId,
    } = req.query;

    const query: any = {};

    if (action) query.action = action;
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const logs = await Log.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'email');

    res.status(200).json({
      status: 'success',
      data: {
        logs,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const log = await Log.findById(req.params.id).populate('userId', 'email');
    
    if (!log) {
      throw new AppError('Log not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        log,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  const originalJson = res.json;

  // Override res.json to capture response body
  res.json = function (body) {
    res.locals.responseBody = body;
    return originalJson.call(this, body);
  };

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode >= 400 ? 'error' : 'success';

    // Create log entry
    createLog(
      req.path.split('/')[2] || 'unknown', // Extract main action from path
      status as 'success' | 'error',
      req.user?._id,
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        requestBody: req.body,
        responseBody: res.locals.responseBody,
        error: res.locals.error,
      }
    );
  });

  next();
};
