import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../app';
import { User } from '../../models/User';
import { Template } from '../../models/Template';
import { BubbleConfig } from '../../models/BubbleConfig';

let mongoServer: MongoMemoryServer;
let token: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create test user and get JWT token
  const user = await User.create({
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  });

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'test@example.com', password: 'password123' });

  token = response.body.data.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Field Mapping Routes', () => {
  describe('POST /api/field-mapping/validate', () => {
    it('should validate field mappings', async () => {
      const pdfFields = [
        {
          name: 'firstName',
          type: 'text',
          required: true,
        },
        {
          name: 'age',
          type: 'number',
          required: false,
        },
      ];

      const bubbleFields = [
        {
          name: 'firstName',
          type: 'text',
          required: true,
        },
        {
          name: 'age',
          type: 'number',
          required: false,
        },
      ];

      const response = await request(app)
        .post('/api/field-mapping/validate')
        .set('Authorization', `Bearer ${token}`)
        .send({ pdfFields, bubbleFields });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.validationResults).toHaveLength(0);
    });

    it('should detect type mismatches', async () => {
      const pdfFields = [
        {
          name: 'age',
          type: 'text',
          required: true,
        },
      ];

      const bubbleFields = [
        {
          name: 'age',
          type: 'number',
          required: true,
        },
      ];

      const response = await request(app)
        .post('/api/field-mapping/validate')
        .set('Authorization', `Bearer ${token}`)
        .send({ pdfFields, bubbleFields });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.validationResults).toHaveLength(1);
      expect(response.body.data.validationResults[0].type).toBe('type_mismatch');
    });

    it('should detect missing fields', async () => {
      const pdfFields = [
        {
          name: 'firstName',
          type: 'text',
          required: true,
        },
      ];

      const bubbleFields = [];

      const response = await request(app)
        .post('/api/field-mapping/validate')
        .set('Authorization', `Bearer ${token}`)
        .send({ pdfFields, bubbleFields });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.validationResults).toHaveLength(1);
      expect(response.body.data.validationResults[0].type).toBe('missing_field');
    });

    it('should detect constraint mismatches', async () => {
      const pdfFields = [
        {
          name: 'firstName',
          type: 'text',
          required: true,
        },
      ];

      const bubbleFields = [
        {
          name: 'firstName',
          type: 'text',
          required: false,
        },
      ];

      const response = await request(app)
        .post('/api/field-mapping/validate')
        .set('Authorization', `Bearer ${token}`)
        .send({ pdfFields, bubbleFields });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.validationResults).toHaveLength(1);
      expect(response.body.data.validationResults[0].type).toBe('constraint_mismatch');
    });
  });

  describe('POST /api/field-mapping/auto-fix', () => {
    it('should generate auto-fix suggestions', async () => {
      const pdfFields = [
        {
          name: 'firstName',
          type: 'text',
          required: true,
        },
      ];

      const bubbleFields = [
        {
          name: 'first_name',
          type: 'text',
          required: false,
        },
      ];

      const validationResults = [
        {
          type: 'missing_field',
          field: pdfFields[0],
          message: 'No matching Bubble field found',
        },
      ];

      const response = await request(app)
        .post('/api/field-mapping/auto-fix')
        .set('Authorization', `Bearer ${token}`)
        .send({ pdfFields, bubbleFields, validationResults });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fixes).toBeDefined();
      expect(Array.isArray(response.body.data.fixes)).toBe(true);
      expect(response.body.data.fixes.length).toBeGreaterThan(0);
    });

    it('should handle empty validation results', async () => {
      const response = await request(app)
        .post('/api/field-mapping/auto-fix')
        .set('Authorization', `Bearer ${token}`)
        .send({ pdfFields: [], bubbleFields: [], validationResults: [] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fixes).toHaveLength(0);
    });
  });

  describe('POST /api/field-mapping/apply-fixes', () => {
    beforeEach(async () => {
      await BubbleConfig.create({
        userId: (await User.findOne({ email: 'test@example.com' }))!._id,
        apiKey: 'test-key',
        appName: 'test-app',
        environment: 'development',
      });
    });

    it('should apply field mapping fixes', async () => {
      const fixes = [
        {
          type: 'map_to_existing',
          field: {
            name: 'firstName',
            type: 'text',
            required: true,
          },
          action: {
            type: 'update_mapping',
            data: {
              pdfFieldId: 'test-id',
              bubbleFieldName: 'first_name',
            },
          },
        },
      ];

      const response = await request(app)
        .post('/api/field-mapping/apply-fixes')
        .set('Authorization', `Bearer ${token}`)
        .send({ fixes });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(1);
      expect(response.body.data.results[0].success).toBe(true);
    });

    it('should handle invalid fix actions', async () => {
      const fixes = [
        {
          type: 'invalid_type',
          field: {
            name: 'firstName',
            type: 'text',
            required: true,
          },
          action: {
            type: 'invalid_action',
            data: {},
          },
        },
      ];

      const response = await request(app)
        .post('/api/field-mapping/apply-fixes')
        .set('Authorization', `Bearer ${token}`)
        .send({ fixes });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should validate fix data', async () => {
      const fixes = [
        {
          type: 'map_to_existing',
          field: {
            name: 'firstName',
            type: 'text',
            required: true,
          },
          action: {
            type: 'update_mapping',
            data: {}, // Missing required data
          },
        },
      ];

      const response = await request(app)
        .post('/api/field-mapping/apply-fixes')
        .set('Authorization', `Bearer ${token}`)
        .send({ fixes });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
