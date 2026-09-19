/**
 * upload.js — Multer middleware and Cloudinary stream helper
 */

const multer = require('multer');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const { sendError } = require('../utils/response');

// 10MB limit
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Use memory storage since we need to stream the buffer to Cloudinary (v2)
// and forward it to the AI service.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Only accept PDF and DOCX for resumes
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and DOC/DOCX are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

/**
 * Middleware to handle single resume upload and catch multer errors.
 */
const uploadResumeMiddleware = (req, res, next) => {
  const uploader = upload.single('resume');

  uploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'File too large. Maximum size is 10MB.', 400);
      }
      return sendError(res, `Upload error: ${err.message}`, 400);
    } else if (err) {
      return sendError(res, err.message, 400);
    }

    if (!req.file) {
      return sendError(res, 'No resume file provided.', 400);
    }

    if (!isCloudinaryConfigured()) {
      return sendError(res, 'Cloudinary is not configured. Uploads are disabled.', 503);
    }

    next();
  });
};

/**
 * Uploads a buffer to Cloudinary via stream.
 * @param {Buffer} buffer - The file buffer
 * @param {string} originalName - Original filename
 * @returns {Promise<string>} - The secure URL of the uploaded file
 */
const uploadToCloudinary = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'skillsphere/resumes',
        resource_type: 'raw', // Use raw for documents (PDF, DOCX)
        public_id: `resume_${Date.now()}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

module.exports = {
  uploadResumeMiddleware,
  uploadToCloudinary
};
