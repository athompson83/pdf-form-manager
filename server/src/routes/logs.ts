import express from 'express';
import { getLogs, getLog } from '../controllers/logController';
import { protect, restrictTo } from '../controllers/authController';

const router = express.Router();

// Protect all routes and restrict to admin
router.use(protect);
router.use(restrictTo('admin'));

router.get('/', getLogs);
router.get('/:id', getLog);

export default router;
