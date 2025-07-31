const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const encryption = require('../utils/encryption');
const storage = require('../utils/storage');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for encryption
    cb(null, true);
  }
});

// Upload encrypted file
router.post('/upload', 
  upload.single('file'),
  [
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('filename').optional().isString().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { password } = req.body;
      const filename = req.body.filename || req.file.originalname;

      // Create secure file wrapper
      const { wrapper, encryptedData } = await encryption.createSecureFileWrapper(
        req.file.buffer,
        password,
        filename
      );

      // Store encrypted file in cloud storage
      const storageKey = `encrypted/${wrapper.id}`;
      await storage.uploadFile(storageKey, encryptedData);

      // Store metadata separately
      const metadataKey = `metadata/${wrapper.id}.json`;
      await storage.uploadFile(metadataKey, JSON.stringify(wrapper));

      res.json({
        success: true,
        fileId: wrapper.id,
        filename: wrapper.filename,
        originalSize: wrapper.originalSize,
        encryptedSize: wrapper.encryptedSize,
        timestamp: wrapper.timestamp,
        message: 'File encrypted and uploaded successfully'
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
);

// Download and decrypt file
router.post('/download',
  [
    body('fileId').isUUID().withMessage('Invalid file ID'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { fileId, password } = req.body;

      // Retrieve metadata
      const metadataKey = `metadata/${fileId}.json`;
      const metadataContent = await storage.downloadFile(metadataKey);
      const wrapper = JSON.parse(metadataContent);

      // Retrieve encrypted file
      const storageKey = `encrypted/${fileId}`;
      const encryptedData = await storage.downloadFile(storageKey);

      // Verify integrity
      if (!encryption.verifyIntegrity(encryptedData, wrapper.metadata, wrapper.integrity)) {
        return res.status(400).json({ error: 'File integrity check failed' });
      }

      // Decrypt file
      const decryptedBuffer = await encryption.decryptFile(
        encryptedData,
        wrapper.metadata,
        password
      );

      // Set response headers
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${wrapper.filename}"`);
      res.setHeader('Content-Length', decryptedBuffer.length);

      res.send(decryptedBuffer);

    } catch (error) {
      console.error('Download error:', error);
      if (error.message.includes('Decryption failed')) {
        res.status(400).json({ error: 'Invalid password or corrupted file' });
      } else {
        res.status(500).json({ error: 'Failed to download file' });
      }
    }
  }
);

// List user's encrypted files
router.get('/list', async (req, res) => {
  try {
    const files = await storage.listFiles('metadata/');
    
    const fileList = files.map(file => {
      const fileId = file.replace('metadata/', '').replace('.json', '');
      return { fileId };
    });

    res.json({
      success: true,
      files: fileList,
      count: fileList.length
    });

  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Get file metadata
router.get('/metadata/:fileId',
  [
    body('fileId').isUUID().withMessage('Invalid file ID')
  ],
  async (req, res) => {
    try {
      const { fileId } = req.params;
      
      const metadataKey = `metadata/${fileId}.json`;
      const metadataContent = await storage.downloadFile(metadataKey);
      const wrapper = JSON.parse(metadataContent);

      // Return safe metadata (no sensitive information)
      res.json({
        success: true,
        fileId: wrapper.id,
        filename: wrapper.filename,
        originalSize: wrapper.originalSize,
        encryptedSize: wrapper.encryptedSize,
        timestamp: wrapper.timestamp,
        version: wrapper.version
      });

    } catch (error) {
      console.error('Get metadata error:', error);
      res.status(404).json({ error: 'File not found' });
    }
  }
);

// Delete encrypted file
router.delete('/delete/:fileId',
  [
    body('fileId').isUUID().withMessage('Invalid file ID')
  ],
  async (req, res) => {
    try {
      const { fileId } = req.params;

      // Delete encrypted file
      const storageKey = `encrypted/${fileId}`;
      await storage.deleteFile(storageKey);

      // Delete metadata
      const metadataKey = `metadata/${fileId}.json`;
      await storage.deleteFile(metadataKey);

      res.json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }
);

// Generate secure password
router.get('/generate-password', (req, res) => {
  const password = encryption.generateSecurePassword(32);
  res.json({
    success: true,
    password: password
  });
});

module.exports = router; 