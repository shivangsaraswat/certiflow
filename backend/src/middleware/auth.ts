
import { Request, Response, NextFunction } from 'express';

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
            };
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
        // For now, we might allow public access to some routes, or fail?
        // User logic: "When other user... login... they have own profile"
        // So all protected routes MUST have userId.
        // However, for development, if frontend fails to send it, we might want to know.
        // I'll log a warning but not block IF it's a public route, but generally block.
        // Actually, simple strict check is better for security.
        // But let's check if there are public backend routes. Health check?
        if (req.path === '/api/health') return next();
    }

    if (userId) {
        req.user = { id: userId };
    }

    next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
        res.status(401).json({ message: 'Unauthorized: Missing User Context' });
        return;
    }
    next();
};
