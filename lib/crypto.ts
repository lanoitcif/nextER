import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SECRET_KEY = process.env.USER_API_KEY_ENCRYPTION_SECRET!

if (!SECRET_KEY || SECRET_KEY.length !== 32) {
  throw new Error('USER_API_KEY_ENCRYPTION_SECRET must be exactly 32 characters')
}

export interface EncryptedData {
  encryptedData: string
  iv: string
  authTag: string
}

/**
 * Encrypts an API key using AES-256-GCM
 */
export function encryptApiKey(apiKey: string): EncryptedData {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv)
  cipher.setAAD(Buffer.from('api-key'))
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

/**
 * Decrypts an API key using AES-256-GCM
 */
export function decryptApiKey(encryptedData: string, iv: string, authTag: string): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), Buffer.from(iv, 'hex'))
  decipher.setAAD(Buffer.from('api-key'))
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Simplified encryption for database storage
 * Combines encrypted data, IV, and auth tag into a single string
 */
export function encryptForStorage(apiKey: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv)
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  const combined = encrypted + ':' + authTag.toString('hex')
  
  return {
    encrypted: combined,
    iv: iv.toString('hex')
  }
}

/**
 * Simplified decryption from database storage
 */
export function decryptFromStorage(encryptedCombined: string, iv: string): string {
  const [encrypted, authTag] = encryptedCombined.split(':')

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Generate a secure random encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64').slice(0, 32)
}