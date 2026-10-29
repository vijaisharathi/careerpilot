import multer from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/appError';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions = ['.pdf', '.docx'];
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/octet-stream', // Some browsers send octet-stream for docx/pdf
  ];

  const ext = '.' + (file.originalname.split('.').pop()?.toLowerCase() ?? '');

  if (!allowedExtensions.includes(ext)) {
    return cb(
      new AppError(
        'Invalid file type. Only PDF (.pdf) and Word documents (.docx) are supported.',
        400
      )
    );
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new AppError(
        'Invalid MIME type. Only PDF and Word documents (.docx) are supported.',
        400
      )
    );
  }

  cb(null, true);
};

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

