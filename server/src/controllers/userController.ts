import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      status: 'success',
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, role, status, permissions } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update fields
    if (email) user.email = email;
    if (role) user.role = role;
    if (status) user.status = status;
    if (permissions) user.permissions = permissions;

    await user.save();

    logger.info(`User updated: ${user.email}`);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Instead of deleting, set status to inactive
    user.status = 'inactive';
    await user.save();

    logger.info(`User deactivated: ${user.email}`);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError('Email already in use', 400);
      }
      user.email = email;
    }

    // Update password
    if (currentPassword && newPassword) {
      if (!(await user.comparePassword(currentPassword))) {
        throw new AppError('Current password is incorrect', 401);
      }
      user.password = newPassword;
    }

    await user.save();

    logger.info(`User profile updated: ${user.email}`);

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
