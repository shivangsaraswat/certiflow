/**
 * Error Handler Middleware
 * Centralized error handling for the Express application
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/index.js';

export class AppError extends Error {
    public statusCode: number;
    public code: string;
    public details?: Record<string, string>;

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR',
        details?: Record<string, string>
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

export function errorHandler(
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error('Error:', err);

    if (err instanceof AppError) {
        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
            },
        };
        res.status(err.statusCode).json(response);
        return;
    }

    // Handle multer errors
    if (err.name === 'MulterError') {
        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'FILE_UPLOAD_ERROR',
                message: err.message,
            },
        };
        res.status(400).json(response);
        return;
    }

    // Default error response
    const response: ApiResponse<null> = {
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : err.message,
        },
    };
    res.status(500).json(response);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
    const response: ApiResponse<null> = {
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
    };
    res.status(404).json(response);
}
