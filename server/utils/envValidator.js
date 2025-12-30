import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function validateEnvironment() {
  const errors = [];
  const warnings = [];

  // Check JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  const secretFile = join(__dirname, '..', 'data', '.jwt_secret');
  
  if (!jwtSecret && !existsSync(secretFile)) {
    warnings.push('JWT_SECRET not set in environment. A random secret will be generated.');
  } else if (jwtSecret) {
    if (jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }
    if (jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {
      errors.push('JWT_SECRET is using default value. Change it immediately!');
    }
  }

  // Check NODE_ENV
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    warnings.push(`NODE_ENV is set to '${nodeEnv}'. Expected: development, production, or test`);
  }

  // Production-specific checks
  if (nodeEnv === 'production') {
    if (!jwtSecret) {
      errors.push('JWT_SECRET must be explicitly set in production environment');
    }

    // Check for insecure configurations
    if (process.env.ENABLE_RATE_LIMITING === 'false') {
      errors.push('Rate limiting should NOT be disabled in production');
    }

    // Warn about debug settings
    if (process.env.DEBUG === 'true') {
      warnings.push('DEBUG mode is enabled in production. Consider disabling it.');
    }
  }

  // Check PORT
  const port = process.env.PORT;
  if (port && (isNaN(port) || parseInt(port) < 1 || parseInt(port) > 65535)) {
    errors.push('PORT must be a valid number between 1 and 65535');
  }

  // Check file upload limits
  const maxFileSize = process.env.MAX_FILE_SIZE;
  if (maxFileSize && isNaN(maxFileSize)) {
    errors.push('MAX_FILE_SIZE must be a number (bytes)');
  }

  return { errors, warnings, isValid: errors.length === 0 };
}

export function printValidationResults() {
  const { errors, warnings, isValid } = validateEnvironment();

  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  if (!isValid) {
    console.error('\n❌ Environment Validation Failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('\nPlease fix these issues before starting the server.\n');
    process.exit(1);
  }

  if (warnings.length === 0 && isValid) {
    console.log('✅ Environment validation passed');
  }
}

export function getSecureConfig() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001'),
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV !== 'production',
    rateLimiting: {
      enabled: process.env.ENABLE_RATE_LIMITING !== 'false',
      auth: parseInt(process.env.AUTH_RATE_LIMIT || '5'),
      register: parseInt(process.env.REGISTER_RATE_LIMIT || '3'),
      api: parseInt(process.env.API_RATE_LIMIT || '100'),
      upload: parseInt(process.env.UPLOAD_RATE_LIMIT || '20')
    },
    security: {
      csrfProtection: process.env.ENABLE_CSRF_PROTECTION !== 'false',
      sessionSecret: process.env.SESSION_SECRET
    },
    upload: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10737418240'), // 10GB default
      uploadDir: process.env.UPLOAD_DIR || './uploads'
    }
  };
}
