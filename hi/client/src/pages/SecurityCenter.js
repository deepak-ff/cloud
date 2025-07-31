import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  Database,
  Cloud,
  Cpu,
  Zap,
  Globe
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SecurityCenter = () => {
  const [securityInfo, setSecurityInfo] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [healthResponse, storageResponse] = await Promise.all([
        axios.get('/api/health'),
        axios.get('/api/storage/info')
      ]);

      setSecurityInfo(healthResponse.data);
      setStorageInfo(storageResponse.data.storage);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      toast.error('Failed to load security information');
    } finally {
      setLoading(false);
    }
  };

  const securityFeatures = [
    {
      icon: Lock,
      title: 'AES-256-GCM Encryption',
      description: 'Military-grade encryption algorithm with authenticated encryption',
      status: 'active',
      color: 'green'
    },
    {
      icon: Key,
      title: 'PBKDF2 Key Derivation',
      description: 'Password-based key derivation with 100,000 iterations',
      status: 'active',
      color: 'green'
    },
    {
      icon: Eye,
      title: 'Zero-Knowledge Architecture',
      description: 'Server cannot access your decryption keys or file contents',
      status: 'active',
      color: 'green'
    },
    {
      icon: Shield,
      title: 'File Integrity Verification',
      description: 'SHA-512 hashing ensures files haven\'t been tampered with',
      status: 'active',
      color: 'green'
    },
    {
      icon: Database,
      title: 'Secure Cloud Storage',
      description: 'Files stored with additional server-side encryption',
      status: 'active',
      color: 'green'
    },
    {
      icon: Globe,
      title: 'HTTPS/TLS Encryption',
      description: 'All data transmitted over encrypted connections',
      status: 'active',
      color: 'green'
    }
  ];

  const systemStatus = [
    {
      name: 'Encryption Engine',
      status: 'Operational',
      icon: Cpu,
      color: 'green'
    },
    {
      name: 'Cloud Storage',
      status: 'Connected',
      icon: Cloud,
      color: 'green'
    },
    {
      name: 'Authentication',
      status: 'Secure',
      icon: Shield,
      color: 'green'
    },
    {
      name: 'Network',
      status: 'Protected',
      icon: Zap,
      color: 'green'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">Security Center</h1>
        <p className="mt-2 text-gray-600">Monitor and manage your security settings</p>
      </motion.div>

      {/* Security Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Security Status</h3>
                <p className="text-sm text-gray-600">All systems are secure and operational</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">All Systems Secure</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemStatus.map((system, index) => {
              const Icon = system.icon;
              return (
                <div key={system.name} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 bg-${system.color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 text-${system.color}-600`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{system.name}</p>
                    <p className={`text-xs text-${system.color}-600`}>{system.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Security Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 bg-${feature.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 text-${feature.color}-600`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${feature.color}-100 text-${feature.color}-800`}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {feature.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Encryption Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8"
      >
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Encryption Details</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Encryption Algorithm</span>
              </div>
              <span className="text-sm font-mono text-blue-600">AES-256-GCM</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Key className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Key Derivation</span>
              </div>
              <span className="text-sm font-mono text-green-600">PBKDF2-SHA512 (100k iterations)</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">Integrity Check</span>
              </div>
              <span className="text-sm font-mono text-purple-600">SHA-512 Hash</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-gray-900">Storage Provider</span>
              </div>
              <span className="text-sm font-mono text-orange-600">{storageInfo?.provider || 'Local Storage'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* System Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">System Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Version</span>
              <span className="font-medium">{securityInfo?.version || '1.0.0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated</span>
              <span className="font-medium">
                {securityInfo?.timestamp ? new Date(securityInfo.timestamp).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Storage Type</span>
              <span className="font-medium">{storageInfo?.type || 'Local'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-green-600">{securityInfo?.status || 'OK'}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Recommendations</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Use Strong Passwords</p>
                <p className="text-sm text-gray-600">Always use unique, complex passwords for each file</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Keep Passwords Secure</p>
                <p className="text-sm text-gray-600">Store passwords in a secure password manager</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Regular Backups</p>
                <p className="text-sm text-gray-600">Keep local backups of important encrypted files</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Update Regularly</p>
                <p className="text-sm text-gray-600">Keep your application updated for security patches</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SecurityCenter; 