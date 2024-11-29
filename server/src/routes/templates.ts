import express from 'express';
import multer from 'multer';
import {
  uploadTemplate,
  getAllTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  fillTemplate,
} from '../controllers/templateController';
import { protect } from '../controllers/authController';
import { validateTemplate, validateTemplateUpdate } from '../middleware/validation';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Protect all routes
router.use(protect);

router
  .route('/')
  .get(getAllTemplates)
  .post(upload.single('pdf'), validateTemplate, uploadTemplate);

router
  .route('/:id')
  .get(getTemplate)
  .patch(validateTemplateUpdate, updateTemplate)
  .delete(deleteTemplate);

router.post('/:id/fill', fillTemplate);

export default router;
