import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { sendSuccess, sendError } from '../../utils/response';
import * as authService from './auth.service';

/**
 * Register a new user
 */
export const register = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, 'User registered successfully', result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return sendError(res, message, 400);
  }
};

/**
 * Login user
 */
export const login = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, 'Login successful', result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return sendError(res, message, 401);
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendError(res, 'Refresh token is required', 400);
    }

    const result = await authService.refreshToken(refreshToken);
    return sendSuccess(res, 'Token refreshed successfully', result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    return sendError(res, message, 401);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    const prisma = (await import('../../config/database')).default;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        designation: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, 'Profile retrieved successfully', user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get profile';
    return sendError(res, message, 500);
  }
};

