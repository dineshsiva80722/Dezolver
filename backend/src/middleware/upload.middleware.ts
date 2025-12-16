import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Storage configuration for certificate template assets
const templateStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'templates');
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter for template assets (images only)
const templateFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allow image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for certificate templates'));
  }
};

// Upload middleware for certificate templates
export const uploadTemplateAssets = multer({
  storage: templateStorage,
  fileFilter: templateFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).fields([
  { name: 'background', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'watermark', maxCount: 1 }
]);

// Single file upload for general purposes
export const uploadSingle = multer({
  storage: multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads', 'general');
      cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      cb(null, fileName);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('file');

// Helper function to get file URL
export const getFileUrl = (filename: string, folder: string = 'general'): string => {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

// Create upload directories if they don't exist
import fs from 'fs';

const uploadDirs = [
  'uploads',
  'uploads/templates',
  'uploads/certificates',
  'uploads/qr-codes',
  'uploads/salary-slips',
  'uploads/general'
];

uploadDirs.forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});
