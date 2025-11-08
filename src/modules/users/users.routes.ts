import { Router } from 'express';
import * as usersController from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin, requireHR, requireOwnershipOrAdmin } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validation.middleware';
import * as usersValidation from './users.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users - Admin and HR can access
router.get('/', requireHR, usersController.getAllUsers);

// Get user by ID - Admin, HR, or self
router.get(
  '/:userId',
  validate(usersValidation.getUserByIdSchema),
  requireOwnershipOrAdmin,
  usersController.getUserById
);

// Create user - Admin and HR can create
router.post(
  '/',
  requireHR,
  validate(usersValidation.createUserSchema),
  usersController.createUser
);

// Update user - Admin only or self
router.put(
  '/:userId',
  validate(usersValidation.updateUserSchema),
  requireOwnershipOrAdmin,
  usersController.updateUser
);

// Delete user - Admin only
router.delete(
  '/:userId',
  requireAdmin,
  validate(usersValidation.deleteUserSchema),
  usersController.deleteUser
);

export default router;

