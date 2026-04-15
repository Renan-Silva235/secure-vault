/* eslint-disable @typescript-eslint/no-explicit-any */
// Simple AES-GCM encryption using Web Crypto API

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await (crypto.subtle.importKey as any)(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return (crypto.subtle.deriveKey as any)(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(data: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  const encrypted: ArrayBuffer = await (crypto.subtle.encrypt as any)(
    { name: 'AES-GCM', iv }, key, enc.encode(data)
  );
  const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(encrypted).length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encoded: string, password: string): Promise<string> {
  const raw = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  const salt = raw.slice(0, 16);
  const iv = raw.slice(16, 28);
  const encrypted = raw.slice(28);
  const key = await deriveKey(password, salt);
  const decrypted: ArrayBuffer = await (crypto.subtle.decrypt as any)(
    { name: 'AES-GCM', iv }, key, encrypted
  );
  return new TextDecoder().decode(decrypted);
}

export function generatePassword(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  const arr = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(arr, b => chars[b % chars.length]).join('');
}

export function validateMasterPassword(pw: string): string[] {
  const errors: string[] = [];
  if (pw.length < 8) errors.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(pw)) errors.push('Uma letra maiúscula');
  if (!/[0-9]/.test(pw)) errors.push('Um número');
  if (!/[!@#$%&*]/.test(pw)) errors.push('Um símbolo (!@#$%&*)');
  return errors;
}
