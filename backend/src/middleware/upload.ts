
import multer from 'multer';

// Configure storage for processed files
// We use memory storage to avoid local filesystem dependency.
const storage = multer.memoryStorage();

// File filter (PDF and CSV/Excel)
export const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check file type
    if (file.mimetype === 'application/pdf' ||
        file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/json') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: PDF, CSV, Excel, JSON.'));
    }
};

export const uploadConfig = {
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
};

export const upload = multer(uploadConfig);
