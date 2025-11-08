import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import * as authValidation from './auth.validation';

const router = Router();

// Public routes
router.post('/register', validate(authValidation.registerSchema), authController.register);
router.post('/login', validate(authValidation.loginSchema), authController.login);
router.post('/refresh', validate(authValidation.refreshTokenSchema), authController.refreshToken);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);

export default router;

