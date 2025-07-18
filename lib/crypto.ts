import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
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
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv)
  cipher.setAAD(Buffer.from('api-key'))

  const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    encryptedData: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

/**
 * Decrypts an API key using AES-256-GCM
 */
export function decryptApiKey(encryptedData: string, iv: string, authTag: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(SECRET_KEY),
    Buffer.from(iv, 'hex')
  )
  decipher.setAAD(Buffer.from('api-key'))
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, 'hex')),
    decipher.final()
  ])

  return decrypted.toString('utf8')
}

/**
 * Simplified encryption for database storage
 * Combines encrypted data, IV, and auth tag into a single string
 */
export function encryptForStorage(apiKey: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv)

  const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  const combined = `${encrypted.toString('hex')}:${authTag.toString('hex')}`

  return {
    encrypted: combined,
    iv: iv.toString('hex')
  }
}

/**
 * Simplified decryption from database storage
 */
export function decryptFromStorage(encryptedCombined: string, iv: string): string {
  const [encryptedHex, authTagHex] = encryptedCombined.split(':')

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(SECRET_KEY),
    Buffer.from(iv, 'hex')
  )
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final()
  ])

  return decrypted.toString('utf8')
}

/**
 * Generate a secure random encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64').slice(0, 32)
}