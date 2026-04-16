import { encrypt, decrypt } from "./crypto";
import { getDatabase, getValue, removeValue, setValue } from "./sqlite";

export interface ServiceEntry {
  id: string;
  name: string;
  username: string;
  password: string;
  icon: string;
  createdAt: number;
}

const VAULT_KEY = "vault_data";
const AUTH_KEY = "vault_auth";

// Store a hash of master password for verification
export async function setupMaster(
  email: string,
  password: string,
): Promise<void> {
  try {
    console.log("setupMaster iniciado...");
    const authData = JSON.stringify({ email });
    console.log("Criptografando dados de auth...");
    const encrypted = await encrypt(authData, password);
    console.log("Salvando auth...");
    await setValue(AUTH_KEY, encrypted);
    console.log("Inicializando vault vazio...");
    // Initialize empty vault
    const vaultData = await encrypt(JSON.stringify([]), password);
    console.log("Salvando vault...");
    await setValue(VAULT_KEY, vaultData);
    console.log("setupMaster concluído com sucesso");
  } catch (error) {
    console.error("Erro em setupMaster:", error);
    throw error;
  }
}

export async function verifyMaster(
  password: string,
): Promise<{ valid: boolean; email?: string }> {
  const authData = await getValue(AUTH_KEY);
  if (!authData) return { valid: false };
  try {
    const decrypted = await decrypt(authData, password);
    const { email } = JSON.parse(decrypted);
    return { valid: true, email };
  } catch {
    return { valid: false };
  }
}

export async function hasMaster(): Promise<boolean> {
  await getDatabase();
  const value = await getValue(AUTH_KEY);
  return !!value;
}

export async function getServices(password: string): Promise<ServiceEntry[]> {
  const data = await getValue(VAULT_KEY);
  if (!data) return [];
  try {
    const decrypted = await decrypt(data, password);
    return JSON.parse(decrypted);
  } catch {
    return [];
  }
}

export async function saveServices(
  services: ServiceEntry[],
  password: string,
): Promise<void> {
  const encrypted = await encrypt(JSON.stringify(services), password);
  await setValue(VAULT_KEY, encrypted);
}

// Brute force protection
const ATTEMPTS_KEY = "vault_attempts";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60000; // 1 minute

interface AttemptsData {
  count: number;
  lockedUntil: number | null;
}

function parseAttempts(raw: string | null): AttemptsData {
  if (!raw) return { count: 0, lockedUntil: null };
  try {
    return JSON.parse(raw) as AttemptsData;
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

export async function getAttempts(): Promise<AttemptsData> {
  const raw = await getValue(ATTEMPTS_KEY);
  return parseAttempts(raw);
}

export async function recordFailedAttempt(): Promise<{
  locked: boolean;
  remainingAttempts: number;
  lockoutSeconds: number;
}> {
  const data = await getAttempts();
  data.count += 1;
  if (data.count >= MAX_ATTEMPTS) {
    data.lockedUntil = Date.now() + LOCKOUT_MS;
    data.count = 0;
    await setValue(ATTEMPTS_KEY, JSON.stringify(data));
    return {
      locked: true,
      remainingAttempts: 0,
      lockoutSeconds: Math.ceil(LOCKOUT_MS / 1000),
    };
  }
  await setValue(ATTEMPTS_KEY, JSON.stringify(data));
  return {
    locked: false,
    remainingAttempts: MAX_ATTEMPTS - data.count,
    lockoutSeconds: 0,
  };
}

export async function isLockedOut(): Promise<{
  locked: boolean;
  secondsRemaining: number;
}> {
  const data = await getAttempts();
  if (data.lockedUntil && Date.now() < data.lockedUntil) {
    return {
      locked: true,
      secondsRemaining: Math.ceil((data.lockedUntil - Date.now()) / 1000),
    };
  }
  if (data.lockedUntil) {
    // Lockout expired, clear
    await setValue(
      ATTEMPTS_KEY,
      JSON.stringify({ count: 0, lockedUntil: null }),
    );
  }
  return { locked: false, secondsRemaining: 0 };
}

export async function clearAttempts(): Promise<void> {
  await removeValue(ATTEMPTS_KEY);
}
