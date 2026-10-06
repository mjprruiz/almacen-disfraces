/**
 * In-memory Rate Limiter & Brute-Force Protection
 * Protege contra ataques de fuerza bruta en el PIN de empleados y contraseña del superadmin.
 */

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  blockedUntil: number | null;
}

// Almacén en memoria por clave (IP + identificador)
const rateLimitMap = new Map<string, RateLimitRecord>();

// Limpieza periódica de registros vencidos cada 10 minutos
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  rateLimitMap.forEach((record, key) => {
    const isLockoutExpired = record.blockedUntil && record.blockedUntil <= now;
    const isWindowExpired = !record.blockedUntil && now - record.lastAttemptAt > windowMs;
    if (isLockoutExpired || isWindowExpired) {
      rateLimitMap.delete(key);
    }
  });
}

/**
 * Obtiene la IP real del cliente considerando proxies de Vercel/Cloudflare
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Agrega un retraso artificial (timing penalty) para mitigar scripts automatizados de alta velocidad
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remainingAttempts: number;
  waitMinutes?: number;
}

/**
 * Verifica si una clave (IP o usuario) tiene permitido realizar intentos
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 10 * 60 * 1000
): RateLimitCheckResult {
  cleanupStaleEntries(windowMs);
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record) {
    return { allowed: true, remainingAttempts: maxAttempts };
  }

  // Si está bloqueado
  if (record.blockedUntil) {
    if (now < record.blockedUntil) {
      const waitMinutes = Math.ceil((record.blockedUntil - now) / 60000);
      return {
        allowed: false,
        remainingAttempts: 0,
        waitMinutes,
      };
    } else {
      // El bloqueo expiró, reseteamos
      rateLimitMap.delete(key);
      return { allowed: true, remainingAttempts: maxAttempts };
    }
  }

  // Si la ventana de tiempo ya pasó, reiniciar
  if (now - record.firstAttemptAt > windowMs) {
    rateLimitMap.delete(key);
    return { allowed: true, remainingAttempts: maxAttempts };
  }

  const remaining = Math.max(0, maxAttempts - record.attempts);
  return {
    allowed: remaining > 0,
    remainingAttempts: remaining,
  };
}

/**
 * Registra un intento fallido y bloquea si supera el límite
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 10 * 60 * 1000,
  lockoutMs: number = 15 * 60 * 1000
): { blocked: boolean; remainingAttempts: number; waitMinutes?: number } {
  cleanupStaleEntries(windowMs);
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now - record.firstAttemptAt > windowMs) {
    rateLimitMap.set(key, {
      attempts: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      blockedUntil: null,
    });
    return { blocked: false, remainingAttempts: maxAttempts - 1 };
  }

  record.attempts += 1;
  record.lastAttemptAt = now;

  if (record.attempts >= maxAttempts) {
    record.blockedUntil = now + lockoutMs;
    const waitMinutes = Math.ceil(lockoutMs / 60000);
    return {
      blocked: true,
      remainingAttempts: 0,
      waitMinutes,
    };
  }

  const remaining = Math.max(0, maxAttempts - record.attempts);
  return {
    blocked: false,
    remainingAttempts: remaining,
  };
}

/**
 * Reinicia el contador de intentos tras un login exitoso
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
