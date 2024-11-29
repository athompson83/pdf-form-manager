import { Request, Response, NextFunction } from 'express';
import { Log, LogDocument } from '../models/Log';
import { User } from '../models/User';

interface LogDetails {
  method: string;
  path: string;
  duration: number;
  requestBody: any;
  responseBody: any;
  error?: string;
}

interface ResponseWithBody extends Response {
  locals: {
    responseBody?: any;
  };
}

export const loggerMiddleware = () => {
  return async (req: Request, res: ResponseWithBody, next: NextFunction) => {
    const startTime = Date.now();
    const originalJson = res.json;
    let responseBody: any;

    // Override res.json to capture response body
    res.json = function (body: any) {
      responseBody = body;
      res.locals.responseBody = body;
      return originalJson.call(this, body);
    };

    // Continue with request
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const user = req.user as User;

        // Determine action based on request path and method
        const action = determineAction(req.path, req.method);

        // Create log entry
        const logDetails: LogDetails = {
          method: req.method,
          path: req.path,
          duration,
          requestBody: sanitizeBody(req.body),
          responseBody: sanitizeBody(responseBody),
        };

        if (res.statusCode >= 400) {
          logDetails.error = responseBody?.message || 'Unknown error';
        }

        const log: Partial<LogDocument> = {
          userId: user?._id || 'anonymous',
          action,
          status: determineStatus(res.statusCode),
          details: logDetails,
        };

        await Log.create(log);
      } catch (error) {
        console.error('Error creating log entry:', error);
      }
    });

    next();
  };
};

const determineAction = (path: string, method: string): string => {
  const pathSegments = path.split('/').filter(Boolean);
  const resource = pathSegments[0];
  const action = pathSegments[1];

  switch (resource) {
    case 'templates':
      switch (method) {
        case 'POST':
          return 'template:create';
        case 'PUT':
        case 'PATCH':
          return 'template:update';
        case 'DELETE':
          return 'template:delete';
        default:
          return action === 'fill' ? 'template:fill' : 'template:read';
      }
    case 'users':
      switch (method) {
        case 'POST':
          return 'user:create';
        case 'PUT':
        case 'PATCH':
          return 'user:update';
        case 'DELETE':
          return 'user:delete';
        default:
          return 'user:read';
      }
    case 'api-keys':
      switch (method) {
        case 'POST':
          return 'apiKey:create';
        case 'DELETE':
          return 'apiKey:revoke';
        default:
          return 'apiKey:read';
      }
    case 'auth':
      return action === 'login' ? 'auth:login' : 'auth:logout';
    default:
      return `${resource}:${method.toLowerCase()}`;
  }
};

const determineStatus = (statusCode: number): string => {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warning';
  return 'success';
};

const sanitizeBody = (body: any): any => {
  if (!body) return body;

  const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

export const logError = async (
  error: Error,
  req: Request,
  res: Response,
  user?: User
) => {
  try {
    const logDetails: LogDetails = {
      method: req.method,
      path: req.path,
      duration: 0,
      requestBody: sanitizeBody(req.body),
      responseBody: null,
      error: error.message,
    };

    const log: Partial<LogDocument> = {
      userId: user?._id || 'anonymous',
      action: determineAction(req.path, req.method),
      status: 'error',
      details: logDetails,
    };

    await Log.create(log);
  } catch (err) {
    console.error('Error creating error log entry:', err);
  }
};
