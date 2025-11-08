import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

/**
 * Validate request body/query/params using Zod schema
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and get the transformed values
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Update req.body, req.query, and req.params with transformed values
      if (result.body) {
        req.body = result.body;
      }
      if (result.query) {
        req.query = result.query;
      }
      if (result.params) {
        req.params = result.params;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        sendError(res, `Validation failed: ${errors[0].message}`, 400);
        return;
      }
      sendError(res, 'Validation error', 400);
    }
  };
};

