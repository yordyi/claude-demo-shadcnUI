import multer from 'multer'
import path from 'path'
import crypto from 'crypto'

// File upload limits
export const UPLOAD_LIMITS = {
  fileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
  ],
}

// Generate unique filename
const generateFilename = (originalName: string): string => {
  const ext = path.extname(originalName)
  const name = crypto.randomBytes(16).toString('hex')
  const timestamp = Date.now()
  return `${timestamp}-${name}${ext}`
}

// Local storage configuration (for development)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file.originalname))
  },
})

// Memory storage configuration (for production with S3)
const memoryStorage = multer.memoryStorage()

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (UPLOAD_LIMITS.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Allowed types: images, PDFs, documents, spreadsheets, text files, and zip archives.'))
  }
}

// Create multer instance
export const upload = multer({
  storage: process.env.NODE_ENV === 'production' ? memoryStorage : localStorage,
  limits: {
    fileSize: UPLOAD_LIMITS.fileSize,
  },
  fileFilter,
})

// Helper to get file URL
export const getFileUrl = (filename: string): string => {
  if (process.env.NODE_ENV === 'production' && process.env.AWS_S3_BUCKET) {
    // Return S3 URL in production
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`
  } else {
    // Return local URL in development
    return `/uploads/${filename}`
  }
}