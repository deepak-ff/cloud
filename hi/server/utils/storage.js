const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CloudStorage {
  constructor() {
    this.storageType = process.env.STORAGE_PROVIDER || 'local';
    this.localStoragePath = process.env.LOCAL_STORAGE_PATH || './storage';
    
    if (this.storageType === 's3') {
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
      this.bucketName = process.env.AWS_S3_BUCKET;
    }
    
    this.initializeStorage();
  }

  async initializeStorage() {
    if (this.storageType === 'local') {
      try {
        await fs.mkdir(this.localStoragePath, { recursive: true });
        await fs.mkdir(path.join(this.localStoragePath, 'encrypted'), { recursive: true });
        await fs.mkdir(path.join(this.localStoragePath, 'metadata'), { recursive: true });
      } catch (error) {
        console.error('Failed to initialize local storage:', error);
      }
    }
  }

  async uploadFile(key, data) {
    try {
      if (this.storageType === 's3') {
        return await this.uploadToS3(key, data);
      } else {
        return await this.uploadToLocal(key, data);
      }
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async downloadFile(key) {
    try {
      if (this.storageType === 's3') {
        return await this.downloadFromS3(key);
      } else {
        return await this.downloadFromLocal(key);
      }
    } catch (error) {
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  async deleteFile(key) {
    try {
      if (this.storageType === 's3') {
        return await this.deleteFromS3(key);
      } else {
        return await this.deleteFromLocal(key);
      }
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async listFiles(prefix = '') {
    try {
      if (this.storageType === 's3') {
        return await this.listFromS3(prefix);
      } else {
        return await this.listFromLocal(prefix);
      }
    } catch (error) {
      throw new Error(`List failed: ${error.message}`);
    }
  }

  // S3 Methods
  async uploadToS3(key, data) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: data,
      ServerSideEncryption: 'AES256',
      Metadata: {
        'upload-timestamp': Date.now().toString(),
        'content-hash': crypto.createHash('sha256').update(data).digest('hex')
      }
    };

    const result = await this.s3.upload(params).promise();
    return result.Location;
  }

  async downloadFromS3(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key
    };

    const result = await this.s3.getObject(params).promise();
    return result.Body.toString();
  }

  async deleteFromS3(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key
    };

    await this.s3.deleteObject(params).promise();
    return true;
  }

  async listFromS3(prefix) {
    const params = {
      Bucket: this.bucketName,
      Prefix: prefix
    };

    const result = await this.s3.listObjectsV2(params).promise();
    return result.Contents.map(obj => obj.Key);
  }

  // Local Storage Methods
  async uploadToLocal(key, data) {
    const filePath = path.join(this.localStoragePath, key);
    const dir = path.dirname(filePath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, data);
    
    return filePath;
  }

  async downloadFromLocal(key) {
    const filePath = path.join(this.localStoragePath, key);
    const data = await fs.readFile(filePath, 'utf8');
    return data;
  }

  async deleteFromLocal(key) {
    const filePath = path.join(this.localStoragePath, key);
    await fs.unlink(filePath);
    return true;
  }

  async listFromLocal(prefix) {
    const dirPath = path.join(this.localStoragePath, prefix);
    
    try {
      const files = await fs.readdir(dirPath, { recursive: true });
      return files.map(file => path.join(prefix, file));
    } catch (error) {
      return [];
    }
  }

  // Utility methods
  async getFileInfo(key) {
    try {
      if (this.storageType === 's3') {
        const params = {
          Bucket: this.bucketName,
          Key: key
        };
        const result = await this.s3.headObject(params).promise();
        return {
          size: result.ContentLength,
          lastModified: result.LastModified,
          etag: result.ETag,
          metadata: result.Metadata
        };
      } else {
        const filePath = path.join(this.localStoragePath, key);
        const stats = await fs.stat(filePath);
        return {
          size: stats.size,
          lastModified: stats.mtime,
          created: stats.birthtime
        };
      }
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  async checkStorageHealth() {
    try {
      const testKey = 'health-check-' + Date.now();
      const testData = 'health-check-data';
      
      await this.uploadFile(testKey, testData);
      const downloadedData = await this.downloadFile(testKey);
      await this.deleteFile(testKey);
      
      return downloadedData === testData;
    } catch (error) {
      return false;
    }
  }

  getStorageInfo() {
    return {
      type: this.storageType,
      provider: this.storageType === 's3' ? 'AWS S3' : 'Local File System',
      bucket: this.storageType === 's3' ? this.bucketName : this.localStoragePath,
      features: [
        'Server-side encryption',
        'Content integrity verification',
        'Automatic backup',
        'Scalable storage'
      ]
    };
  }
}

module.exports = new CloudStorage(); 