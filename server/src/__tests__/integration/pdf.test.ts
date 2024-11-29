import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../app';
import { User } from '../../models/User';
import { Template } from '../../models/Template';
import path from 'path';
import fs from 'fs';

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

describe('PDF Routes', () => {
  describe('POST /api/pdf/detect-fields', () => {
    it('should detect fields from uploaded PDF', async () => {
      const pdfPath = path.join(__dirname, '../fixtures/test-form.pdf');
      
      const response = await request(app)
        .post('/api/pdf/detect-fields')
        .set('Authorization', `Bearer ${token}`)
        .attach('pdf', pdfPath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fields).toBeDefined();
      expect(Array.isArray(response.body.data.fields)).toBe(true);
    });

    it('should return 400 if no PDF is uploaded', async () => {
      const response = await request(app)
        .post('/api/pdf/detect-fields')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle invalid PDF files', async () => {
      const invalidPath = path.join(__dirname, '../fixtures/invalid.pdf');
      
      const response = await request(app)
        .post('/api/pdf/detect-fields')
        .set('Authorization', `Bearer ${token}`)
        .attach('pdf', invalidPath);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/pdf/fields', () => {
    beforeEach(async () => {
      await Template.create({
        userId: (await User.findOne({ email: 'test@example.com' }))!._id,
        name: 'Test Template',
        active: true,
        fields: [
          {
            name: 'field1',
            type: 'text',
            required: true,
          },
          {
            name: 'field2',
            type: 'number',
            required: false,
          },
        ],
      });
    });

    it('should return fields from active template', async () => {
      const response = await request(app)
        .get('/api/pdf/fields')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fields).toHaveLength(2);
    });

    it('should return 404 if no active template exists', async () => {
      await Template.deleteMany({});

      const response = await request(app)
        .get('/api/pdf/fields')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/pdf/fields', () => {
    beforeEach(async () => {
      await Template.create({
        userId: (await User.findOne({ email: 'test@example.com' }))!._id,
        name: 'Test Template',
        active: true,
        fields: [],
      });
    });

    it('should create a new field', async () => {
      const field = {
        name: 'newField',
        type: 'text',
        required: true,
      };

      const response = await request(app)
        .post('/api/pdf/fields')
        .set('Authorization', `Bearer ${token}`)
        .send(field);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.field.name).toBe('newField');
    });

    it('should validate field data', async () => {
      const field = {
        name: 'newField',
        type: 'invalid',
        required: true,
      };

      const response = await request(app)
        .post('/api/pdf/fields')
        .set('Authorization', `Bearer ${token}`)
        .send(field);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/pdf/fields/:id', () => {
    let fieldId: string;

    beforeEach(async () => {
      const template = await Template.create({
        userId: (await User.findOne({ email: 'test@example.com' }))!._id,
        name: 'Test Template',
        active: true,
        fields: [
          {
            name: 'field1',
            type: 'text',
            required: true,
          },
        ],
      });

      fieldId = template.fields[0]._id.toString();
    });

    it('should update an existing field', async () => {
      const update = {
        name: 'updatedField',
        required: false,
      };

      const response = await request(app)
        .put(`/api/pdf/fields/${fieldId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(update);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.field.name).toBe('updatedField');
      expect(response.body.data.field.required).toBe(false);
    });

    it('should return 404 for non-existent field', async () => {
      const response = await request(app)
        .put('/api/pdf/fields/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'updated' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/pdf/fields/:id', () => {
    let fieldId: string;

    beforeEach(async () => {
      const template = await Template.create({
        userId: (await User.findOne({ email: 'test@example.com' }))!._id,
        name: 'Test Template',
        active: true,
        fields: [
          {
            name: 'field1',
            type: 'text',
            required: true,
          },
        ],
      });

      fieldId = template.fields[0]._id.toString();
    });

    it('should delete an existing field', async () => {
      const response = await request(app)
        .delete(`/api/pdf/fields/${fieldId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const template = await Template.findOne({ active: true });
      expect(template!.fields).toHaveLength(0);
    });

    it('should return 404 for non-existent field', async () => {
      const response = await request(app)
        .delete('/api/pdf/fields/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/pdf/fill', () => {
    beforeEach(async () => {
      await Template.create({
        userId: (await User.findOne({ email: 'test@example.com' }))!._id,
        name: 'Test Template',
        active: true,
        filePath: path.join(__dirname, '../fixtures/test-form.pdf'),
        fields: [
          {
            name: 'field1',
            type: 'text',
            required: true,
          },
          {
            name: 'field2',
            type: 'number',
            required: false,
          },
        ],
      });
    });

    it('should fill PDF with provided values', async () => {
      const values = {
        field1: 'Test Value',
        field2: 42,
      };

      const response = await request(app)
        .post('/api/pdf/fill')
        .set('Authorization', `Bearer ${token}`)
        .send({ values });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.filePath).toBeDefined();
      expect(fs.existsSync(response.body.data.filePath)).toBe(true);
    });

    it('should validate required fields', async () => {
      const values = {
        field2: 42,
      };

      const response = await request(app)
        .post('/api/pdf/fill')
        .set('Authorization', `Bearer ${token}`)
        .send({ values });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate field types', async () => {
      const values = {
        field1: 'Test Value',
        field2: 'not a number',
      };

      const response = await request(app)
        .post('/api/pdf/fill')
        .set('Authorization', `Bearer ${token}`)
        .send({ values });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
