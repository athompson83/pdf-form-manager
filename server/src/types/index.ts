import { Request } from 'express';
import { Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  permissions: string[];
  lastLogin: Date | null;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ITemplate extends Document {
  name: string;
  description: string;
  filePath: string;
  fields: {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
  }[];
  status: 'active' | 'archived';
  createdBy: string;
  usageCount: number;
}

export interface IAPIKey extends Document {
  name: string;
  key: string;
  permissions: string[];
  status: 'active' | 'revoked';
  lastUsed: Date | null;
  createdBy: string;
}

export interface ILog extends Document {
  action: string;
  status: 'success' | 'error' | 'warning';
  userId: string;
  details: {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    error?: string;
    requestBody?: any;
    responseBody?: any;
  };
}

export interface AuthRequest extends Request {
  user?: IUser;
  apiKey?: IAPIKey;
}

export interface PDFField {
  name: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'radio';
  required: boolean;
  defaultValue?: string;
}

export interface TemplateFormData {
  [key: string]: string | number | boolean;
}

export type Permission =
  | 'templates:read'
  | 'templates:write'
  | 'forms:fill'
  | 'webhooks:manage'
  | 'users:manage'
  | 'logs:view';

export interface APIResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
