import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/appError';

export interface RequestValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export type ValidationTarget = RequestValidationSchema | AnyZodObject;

export const validateRequest = (schema: ValidationTarget) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if ('shape' in schema && typeof (schema as AnyZodObject).shape === 'object') {
        const shape = (schema as AnyZodObject).shape as Record<string, AnyZodObject>;
        if (shape.body) {
          req.body = await shape.body.parseAsync(req.body);
        }
        if (shape.query) {
          req.query = await shape.query.parseAsync(req.query);
        }
        if (shape.params) {
          req.params = await shape.params.parseAsync(req.params);
        }
      } else {
        const subSchema = schema as RequestValidationSchema;
        if (subSchema.body) {
          req.body = await subSchema.body.parseAsync(req.body);
        }
        if (subSchema.query) {
          req.query = await subSchema.query.parseAsync(req.query);
        }
        if (subSchema.params) {
          req.params = await subSchema.params.parseAsync(req.params);
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new AppError('Validation failed', 400, formattedErrors));
      } else {
        next(error);
      }
    }
  };
};
