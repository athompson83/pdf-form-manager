import express from 'express';
import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updateCurrentUser,
} from '../controllers/userController';
import { protect, restrictTo } from '../controllers/authController';
import { validateUserUpdate } from '../middleware/validation';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Current user routes
router.patch('/me', validateUserUpdate, updateCurrentUser);

// Admin only routes
router.use(restrictTo('admin'));

router
  .route('/')
  .get(getAllUsers);

router
  .route('/:id')
  .get(getUser)
  .patch(validateUserUpdate, updateUser)
  .delete(deleteUser);

export default router;
