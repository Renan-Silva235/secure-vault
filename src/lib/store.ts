import { encrypt, decrypt } from './crypto';

export interface ServiceEntry {
  id: string;
  name: string;
  username: string;
  password: string;
  icon: string;
  createdAt: number;
}

const VAULT_KEY = 'vault_data';
const AUTH_KEY = 'vault_auth';

// Store a hash of master password for verification
export async function setupMaster(email: string, password: string): Promise<void> {
  const authData = JSON.stringify({ email });
  const encrypted = await encrypt(authData, password);
  localStorage.setItem(AUTH_KEY, encrypted);
  // Initialize empty vault
  const vaultData = await encrypt(JSON.stringify([]), password);
  localStorage.setItem(VAULT_KEY, vaultData);
}

export async function verifyMaster(password: string): Promise<{ valid: boolean; email?: string }> {
  const authData = localStorage.getItem(AUTH_KEY);
  if (!authData) return { valid: false };
  try {
    const decrypted = await decrypt(authData, password);
    const { email } = JSON.parse(decrypted);
    return { valid: true, email };
  } catch {
    return { valid: false };
  }
}

export function hasMaster(): boolean {
  return !!localStorage.getItem(AUTH_KEY);
}

export async function getServices(password: string): Promise<ServiceEntry[]> {
  const data = localStorage.getItem(VAULT_KEY);
  if (!data) return [];
  try {
    const decrypted = await decrypt(data, password);
    return JSON.parse(decrypted);
  } catch {
    return [];
  }
}

export async function saveServices(services: ServiceEntry[], password: string): Promise<void> {
  const encrypted = await encrypt(JSON.stringify(services), password);
  localStorage.setItem(VAULT_KEY, encrypted);
}

// Brute force protection
const ATTEMPTS_KEY = 'vault_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60000; // 1 minute

interface AttemptsData {
  count: number;
  lockedUntil: number | null;
}

export function getAttempts(): AttemptsData {
  const raw = localStorage.getItem(ATTEMPTS_KEY);
  if (!raw) return { count: 0, lockedUntil: null };
  return JSON.parse(raw);
}

export function recordFailedAttempt(): { locked: boolean; remainingAttempts: number; lockoutSeconds: number } {
  const data = getAttempts();
  data.count += 1;
  if (data.count >= MAX_ATTEMPTS) {
    data.lockedUntil = Date.now() + LOCKOUT_MS;
    data.count = 0;
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(data));
    return { locked: true, remainingAttempts: 0, lockoutSeconds: Math.ceil(LOCKOUT_MS / 1000) };
  }
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(data));
  return { locked: false, remainingAttempts: MAX_ATTEMPTS - data.count, lockoutSeconds: 0 };
}

export function isLockedOut(): { locked: boolean; secondsRemaining: number } {
  const data = getAttempts();
  if (data.lockedUntil && Date.now() < data.lockedUntil) {
    return { locked: true, secondsRemaining: Math.ceil((data.lockedUntil - Date.now()) / 1000) };
  }
  if (data.lockedUntil) {
    // Lockout expired, clear
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify({ count: 0, lockedUntil: null }));
  }
  return { locked: false, secondsRemaining: 0 };
}

export function clearAttempts(): void {
  localStorage.removeItem(ATTEMPTS_KEY);
}
