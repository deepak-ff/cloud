const crypto = require('crypto');
const { promisify } = require('util');

class AdvancedEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.saltLength = 32; // 256 bits
    this.tagLength = 16; // 128 bits
    this.iterations = 100000; // PBKDF2 iterations
  }

  /**
   * Generate a cryptographically secure random salt
   */
  generateSalt() {
    return crypto.randomBytes(this.saltLength);
  }

  /**
   * Generate a cryptographically secure random IV
   */
  generateIV() {
    return crypto.randomBytes(this.ivLength);
  }

  /**
   * Derive encryption key using PBKDF2
   */
  async deriveKey(password, salt) {
    const pbkdf2 = promisify(crypto.pbkdf2);
    return await pbkdf2(password, salt, this.iterations, this.keyLength, 'sha512');
  }

  /**
   * Encrypt data with AES-256-GCM
   */
  async encrypt(data, password) {
    try {
      const salt = this.generateSalt();
      const iv = this.generateIV();
      const key = await this.deriveKey(password, salt);
      
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from('CloudEncryptionApp', 'utf8'));
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Create metadata for decryption
      const metadata = {
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: this.algorithm,
        iterations: this.iterations,
        version: '1.0.0'
      };

      return {
        encrypted,
        metadata,
        integrity: this.generateIntegrityHash(encrypted, metadata)
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data with AES-256-GCM
   */
  async decrypt(encryptedData, metadata, password) {
    try {
      const salt = Buffer.from(metadata.salt, 'hex');
      const iv = Buffer.from(metadata.iv, 'hex');
      const tag = Buffer.from(metadata.tag, 'hex');
      const key = await this.deriveKey(password, salt);
      
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAuthTag(tag);
      decipher.setAAD(Buffer.from('CloudEncryptionApp', 'utf8'));
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt file buffer
   */
  async encryptFile(fileBuffer, password) {
    const data = fileBuffer.toString('base64');
    return await this.encrypt(data, password);
  }

  /**
   * Decrypt file buffer
   */
  async decryptFile(encryptedData, metadata, password) {
    const decrypted = await this.decrypt(encryptedData, metadata, password);
    return Buffer.from(decrypted, 'base64');
  }

  /**
   * Generate integrity hash for verification
   */
  generateIntegrityHash(encryptedData, metadata) {
    const dataToHash = encryptedData + JSON.stringify(metadata);
    return crypto.createHash('sha512').update(dataToHash).digest('hex');
  }

  /**
   * Verify file integrity
   */
  verifyIntegrity(encryptedData, metadata, expectedHash) {
    const calculatedHash = this.generateIntegrityHash(encryptedData, metadata);
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  }

  /**
   * Generate secure random password
   */
  generateSecurePassword(length = 32) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(crypto.randomInt(charset.length));
    }
    return password;
  }

  /**
   * Create file encryption wrapper with additional security
   */
  async createSecureFileWrapper(fileBuffer, password, filename) {
    const timestamp = Date.now();
    const fileId = crypto.randomUUID();
    
    // Encrypt the file
    const encryptionResult = await this.encryptFile(fileBuffer, password);
    
    // Create secure wrapper
    const wrapper = {
      id: fileId,
      filename: filename,
      originalSize: fileBuffer.length,
      encryptedSize: encryptionResult.encrypted.length,
      timestamp: timestamp,
      metadata: encryptionResult.metadata,
      integrity: encryptionResult.integrity,
      version: '1.0.0'
    };

    return {
      wrapper,
      encryptedData: encryptionResult.encrypted
    };
  }
}

module.exports = new AdvancedEncryption(); 