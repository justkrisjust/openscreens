/**
 * WebCrypto Security Module
 * 
 * Implements client-side AES-GCM (256-bit) encryption with PBKDF2 key derivation.
 * - PBKDF2 iterations: 100,000 rounds with SHA-256
 * - Cryptographically secure random 16-byte salt and 12-byte IV per encryption
 * - Zero external dependencies (uses native window.crypto.subtle)
 * - Keys never transmitted or logged
 */

export interface EncryptedPayload {
  cipherText: string; // Base64
  iv: string;         // Base64
  salt: string;       // Base64
  version: number;
}

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH_BITS = 256;

// Convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives an AES-GCM CryptoKey from a user passphrase and salt using PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string (e.g. API key) with the user passphrase
 */
export async function encryptData(plainText: string, passphrase: string): Promise<EncryptedPayload> {
  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('A non-empty passphrase is required for encryption.');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const enc = new TextEncoder();
  const encodedData = enc.encode(plainText);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource
    },
    key,
    encodedData
  );

  return {
    cipherText: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    version: 1
  };
}

/**
 * Decrypts an encrypted payload using the user passphrase
 */
export async function decryptData(payload: EncryptedPayload, passphrase: string): Promise<string> {
  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('Passphrase is required to unlock keys.');
  }

  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const cipherBytes = base64ToBuffer(payload.cipherText);

  const key = await deriveKey(passphrase, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource
      },
      key,
      cipherBytes as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    throw new Error('Invalid passphrase or corrupted data. Decryption failed.');
  }
}
