import { describe, it, expect } from 'vitest';
import { encryptData, decryptData } from '../services/crypto';

describe('WebCrypto AES-GCM & PBKDF2 Security Service', () => {
  const sampleKey = 'sample-mock-payload-data-abc123456789';
  const passphrase = 'SuperSecretUserPassphrase!2026';

  it('encrypts and decrypts API key back to exact plaintext', async () => {
    const payload = await encryptData(sampleKey, passphrase);
    expect(payload.cipherText).toBeTruthy();
    expect(payload.iv).toBeTruthy();
    expect(payload.salt).toBeTruthy();
    expect(payload.cipherText).not.toBe(sampleKey);

    const decrypted = await decryptData(payload, passphrase);
    expect(decrypted).toBe(sampleKey);
  });

  it('fails decryption with an incorrect passphrase', async () => {
    const payload = await encryptData(sampleKey, passphrase);
    await expect(decryptData(payload, 'WrongPassphrase123')).rejects.toThrow(
      /Invalid passphrase/
    );
  });

  it('rejects empty passphrases', async () => {
    await expect(encryptData(sampleKey, '')).rejects.toThrow();
  });
});
