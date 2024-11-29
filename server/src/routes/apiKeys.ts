import express from 'express';
import {
  createAPIKey,
  getAllAPIKeys,
  getAPIKey,
  updateAPIKey,
  revokeAPIKey,
} from '../controllers/apiKeyController';
import { protect } from '../controllers/authController';
import { validateAPIKeyCreate, validateAPIKeyUpdate } from '../middleware/validation';

const router = express.Router();

// Protect all routes
router.use(protect);

router
  .route('/')
  .get(getAllAPIKeys)
  .post(validateAPIKeyCreate, createAPIKey);

router
  .route('/:id')
  .get(getAPIKey)
  .patch(validateAPIKeyUpdate, updateAPIKey)
  .delete(revokeAPIKey);

export default router;
