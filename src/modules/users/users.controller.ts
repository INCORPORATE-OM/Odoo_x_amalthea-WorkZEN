import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { sendSuccess, sendError } from '../../utils/response';
import * as usersService from './users.service';

/**
 * Get all users
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await usersService.getAllUsers(page, limit);
    return sendSuccess(res, 'Users retrieved successfully', result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get users';
    return sendError(res, message, 500);
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    const user = await usersService.getUserById(userId);
    return sendSuccess(res, 'User retrieved successfully', user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'User not found';
    return sendError(res, message, 404);
  }
};

/**
 * Create a new user
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const user = await usersService.createUser(req.body);
    return sendSuccess(res, 'User created successfully', user, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
    return sendError(res, message, 400);
  }
};

/**
 * Update user
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    const user = await usersService.updateUser(userId, req.body);
    return sendSuccess(res, 'User updated successfully', user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user';
    return sendError(res, message, 400);
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    const result = await usersService.deleteUser(userId);
    return sendSuccess(res, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user';
    return sendError(res, message, 400);
  }
};

