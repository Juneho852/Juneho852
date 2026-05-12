import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(private config: ConfigService) {
    const hexKey = config.get<string>('AES_ENCRYPTION_KEY');
    this.key = Buffer.from(hexKey, 'hex');
  }

  encrypt(plaintext: string): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    // store authTag appended to ciphertext
    const combined = Buffer.concat([encrypted, authTag]);
    return {
      encrypted: combined.toString('base64'),
      iv: iv.toString('base64'),
    };
  }

  decrypt(encryptedBase64: string, ivBase64: string): string {
    const combined = Buffer.from(encryptedBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = combined.slice(combined.length - AUTH_TAG_LENGTH);
    const encrypted = combined.slice(0, combined.length - AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted) + decipher.final('utf8');
  }
}
