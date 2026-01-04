import crypto from 'crypto';

// Use environment variable or generate a secure key
const ENCRYPTION_KEY = process.env.SMTP_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

// export function encrypt(text: string): string {
//     const iv = crypto.randomBytes(16);
//     const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
//     const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

//     let encrypted = cipher.update(text, 'utf8', 'hex');
//     encrypted += cipher.final('hex');

//     const authTag = cipher.getAuthTag();

//     // Return iv:authTag:encrypted
//     return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
// }
export function encrypt(text: string): string {
    console.warn('[SECURITY WARNING] Encryption DISABLED - Storing plain text');
    return text;
}

// export function decrypt(encryptedText: string): string {
//     try {
//         const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

//         const iv = Buffer.from(ivHex, 'hex');
//         const authTag = Buffer.from(authTagHex, 'hex');
//         const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');

//         const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
//         decipher.setAuthTag(authTag);

//         let decrypted = decipher.update(encrypted, 'hex', 'utf8');
//         decrypted += decipher.final('utf8');

//         return decrypted;
//     } catch (error) {
//         console.error('Decryption failed:', error);
//         throw new Error('Failed to decrypt data');
//     }
// }
export function decrypt(encryptedText: string): string {
    // If it looks like it's encrypted (has colons), try to return it as is or handle gracefully
    // But since we are switching to plain text, we just return the text.
    // If the DB has old encrypted data, this WILL fail validation downstream or show garbage, 
    // which is why the user MUST re-save.
    return encryptedText;
}
