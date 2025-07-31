const express = require('express');
const storage = require('../utils/storage');
const router = express.Router();

// Get storage information
router.get('/info', async (req, res) => {
  try {
    const info = storage.getStorageInfo();
    res.json({
      success: true,
      storage: info
    });
  } catch (error) {
    console.error('Storage info error:', error);
    res.status(500).json({ error: 'Failed to get storage info' });
  }
});

// Check storage health
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await storage.checkStorageHealth();
    res.json({
      success: true,
      healthy: isHealthy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Storage health check error:', error);
    res.status(500).json({ 
      success: false,
      healthy: false,
      error: 'Storage health check failed'
    });
  }
});

// Get storage statistics
router.get('/stats', async (req, res) => {
  try {
    const files = await storage.listFiles();
    const encryptedFiles = files.filter(file => file.startsWith('encrypted/'));
    const metadataFiles = files.filter(file => file.startsWith('metadata/'));

    // Calculate total size (approximate)
    let totalSize = 0;
    for (const file of files) {
      try {
        const info = await storage.getFileInfo(file);
        totalSize += info.size || 0;
      } catch (error) {
        // Skip files that can't be accessed
      }
    }

    res.json({
      success: true,
      stats: {
        totalFiles: files.length,
        encryptedFiles: encryptedFiles.length,
        metadataFiles: metadataFiles.length,
        totalSize: totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
      }
    });
  } catch (error) {
    console.error('Storage stats error:', error);
    res.status(500).json({ error: 'Failed to get storage statistics' });
  }
});

// List all files (admin only)
router.get('/files', async (req, res) => {
  try {
    const files = await storage.listFiles();
    
    const fileList = await Promise.all(
      files.map(async (file) => {
        try {
          const info = await storage.getFileInfo(file);
          return {
            key: file,
            size: info.size,
            lastModified: info.lastModified,
            type: file.startsWith('encrypted/') ? 'encrypted' : 'metadata'
          };
        } catch (error) {
          return {
            key: file,
            error: 'Unable to get file info'
          };
        }
      })
    );

    res.json({
      success: true,
      files: fileList,
      count: fileList.length
    });
  } catch (error) {
    console.error('List all files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Clean up orphaned files
router.post('/cleanup', async (req, res) => {
  try {
    const files = await storage.listFiles();
    const encryptedFiles = files.filter(file => file.startsWith('encrypted/'));
    const metadataFiles = files.filter(file => file.startsWith('metadata/'));

    const orphanedFiles = [];
    const cleanedFiles = [];

    // Find orphaned encrypted files (no corresponding metadata)
    for (const encryptedFile of encryptedFiles) {
      const fileId = encryptedFile.replace('encrypted/', '');
      const metadataFile = `metadata/${fileId}.json`;
      
      if (!metadataFiles.includes(metadataFile)) {
        orphanedFiles.push(encryptedFile);
      }
    }

    // Find orphaned metadata files (no corresponding encrypted file)
    for (const metadataFile of metadataFiles) {
      const fileId = metadataFile.replace('metadata/', '').replace('.json', '');
      const encryptedFile = `encrypted/${fileId}`;
      
      if (!encryptedFiles.includes(encryptedFile)) {
        orphanedFiles.push(metadataFile);
      }
    }

    // Clean up orphaned files
    for (const orphanedFile of orphanedFiles) {
      try {
        await storage.deleteFile(orphanedFile);
        cleanedFiles.push(orphanedFile);
      } catch (error) {
        console.error(`Failed to delete orphaned file: ${orphanedFile}`, error);
      }
    }

    res.json({
      success: true,
      message: 'Cleanup completed',
      orphanedFilesFound: orphanedFiles.length,
      cleanedFiles: cleanedFiles.length,
      details: {
        orphanedFiles,
        cleanedFiles
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to perform cleanup' });
  }
});

// Test storage operations
router.post('/test', async (req, res) => {
  try {
    const testResults = {
      upload: false,
      download: false,
      delete: false,
      list: false
    };

    const testKey = 'test-' + Date.now();
    const testData = 'test-data-' + Date.now();

    // Test upload
    try {
      await storage.uploadFile(testKey, testData);
      testResults.upload = true;
    } catch (error) {
      console.error('Upload test failed:', error);
    }

    // Test download
    try {
      const downloadedData = await storage.downloadFile(testKey);
      testResults.download = downloadedData === testData;
    } catch (error) {
      console.error('Download test failed:', error);
    }

    // Test list
    try {
      const files = await storage.listFiles();
      testResults.list = Array.isArray(files);
    } catch (error) {
      console.error('List test failed:', error);
    }

    // Test delete
    try {
      await storage.deleteFile(testKey);
      testResults.delete = true;
    } catch (error) {
      console.error('Delete test failed:', error);
    }

    const allTestsPassed = Object.values(testResults).every(result => result === true);

    res.json({
      success: allTestsPassed,
      tests: testResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Storage test error:', error);
    res.status(500).json({ error: 'Storage test failed' });
  }
});

module.exports = router; 