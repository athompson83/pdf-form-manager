export interface User {
  _id: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  permissions: string[];
  lastLogin: string | null;
}

export interface Template {
  _id: string;
  name: string;
  description: string;
  fields: PDFField[];
  status: 'active' | 'archived';
  createdBy: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PDFField {
  name: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'radio';
  required: boolean;
  defaultValue?: string;
}

export interface APIKey {
  _id: string;
  name: string;
  key: string;
  permissions: Permission[];
  status: 'active' | 'revoked';
  lastUsed: string | null;
  createdBy: string;
  createdAt: string;
}

export interface Log {
  _id: string;
  action: string;
  status: 'success' | 'error' | 'warning';
  userId: string | User;
  details: {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    error?: string;
    requestBody?: any;
    responseBody?: any;
  };
  createdAt: string;
}

export type Permission =
  | 'templates:read'
  | 'templates:write'
  | 'forms:fill'
  | 'webhooks:manage'
  | 'users:manage'
  | 'logs:view';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface TemplateFormData {
  [key: string]: string | number | boolean;
}

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

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
