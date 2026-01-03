
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/index.js';

export class AppError extends Error {
    statusCode: number;
    code: string;
    details?: Record<string, string>;

    constructor(statusCode: number, message: string, code: string = 'INTERNAL_ERROR', details?: Record<string, string>) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const error = new AppError(404, `Route ${req.originalUrl} not found`, 'NOT_FOUND');
    next(error);
};

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
    });

    if (err instanceof AppError) {
        const response: ApiResponse = {
            success: false,
            error: err.message, // Return just the message string as expected by ApiResponse
            // We could extend ApiResponse to include code/details if needed, but for now strict compliance
        };
        return res.status(err.statusCode).json(response);
    }

    // Handle Multer mismatch errors
    if ((err as any).code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            error: 'File is too large'
        });
    }

    // Default error
    return res.status(500).json({
        success: false,
        error: 'Internal Server Error'
    });
};
