/* eslint-disable @typescript-eslint/no-explicit-any */
// Encryption using TweetNaCl (works in HTTP context, no Web Crypto API needed)
import nacl from 'tweetnacl';

// Derive key from password using simple KDF
function deriveKeyFromPassword(password: string, salt: Uint8Array): Uint8Array {
  const enc = new TextEncoder();
  const paddedKey = new Uint8Array(32);
  const passwordBytes = enc.encode(password);
  
  // Simple KDF: hash password + salt
  let combined = new Uint8Array(passwordBytes.length + salt.length);
  combined.set(passwordBytes);
  combined.set(salt, passwordBytes.length);
  
  for (let i = 0; i < 32; i++) {
    paddedKey[i] = combined[i % combined.length] ^ (i + salt[i % salt.length]);
  }
  
  return paddedKey;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export async function encrypt(data: string, password: string): Promise<string> {
  try {
    console.log("Iniciando criptografia com TweetNaCl...");
    
    const salt = nacl.randomBytes(16);
    const nonce = nacl.randomBytes(24);
    
    console.log("Derivando chave...");
    const key = deriveKeyFromPassword(password, salt);
    
    console.log("Criptografando dados...");
    const dataBytes = new TextEncoder().encode(data);
    const encrypted = nacl.secretbox(dataBytes, nonce, key);
    
    if (!encrypted) {
      throw new Error("Falha na criptografia");
    }
    
    const combined = new Uint8Array(salt.length + nonce.length + encrypted.length);
    combined.set(salt, 0);
    combined.set(nonce, salt.length);
    combined.set(encrypted, salt.length + nonce.length);
    
    const result = bytesToHex(combined);
    console.log("Criptografia concluída");
    return result;
  } catch (error) {
    console.error("Erro em encrypt:", error);
    throw error;
  }
}

export async function decrypt(encoded: string, password: string): Promise<string> {
  try {
    console.log("Iniciando descriptografia com TweetNaCl...");
    
    const combined = hexToBytes(encoded);
    const salt = combined.slice(0, 16);
    const nonce = combined.slice(16, 40);
    const encrypted = combined.slice(40);
    
    console.log("Derivando chave...");
    const key = deriveKeyFromPassword(password, salt);
    
    console.log("Descriptografando dados...");
    const decrypted = nacl.secretbox.open(encrypted, nonce, key);
    
    if (!decrypted) {
      throw new Error("Falha na descriptografia - senha ou dados inválidos");
    }
    
    const result = new TextDecoder().decode(decrypted);
    console.log("Descriptografia concluída");
    return result;
  } catch (error) {
    console.error("Erro em decrypt:", error);
    throw error;
  }
}

export function generatePassword(length = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  const randomBytes = nacl.randomBytes(length);
  return Array.from(randomBytes, b => chars[b % chars.length]).join("");
}

export function validateMasterPassword(pw: string): string[] {
  const errors: string[] = [];
  if (pw.length < 8) errors.push("Mínimo 8 caracteres");
  if (!/[A-Z]/.test(pw)) errors.push("Uma letra maiúscula");
  if (!/[0-9]/.test(pw)) errors.push("Um número");
  if (!/[!@#$%&*]/.test(pw)) errors.push("Um símbolo (!@#$%&*)");
  return errors;
}
