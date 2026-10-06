import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  sleep,
} from '@/lib/rate-limiter';

// Límites de seguridad contra ataques de fuerza bruta:
// 5 intentos permitidos en ventana de 10 minutos. Bloqueo de 15 minutos al exceder.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const TIMING_PENALTY_MS = 800; // Penalización contra bots de alta velocidad

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();

    // 1. Superadmin authentication (Username + Password)
    if (body.username && body.password) {
      const limitKey = `auth:superadmin:${ip}:${body.username.trim().toLowerCase()}`;
      const status = checkRateLimit(limitKey, MAX_ATTEMPTS, WINDOW_MS);

      if (!status.allowed) {
        return NextResponse.json(
          {
            error: `Demasiados intentos fallidos. Acceso bloqueado por seguridad durante ${status.waitMinutes || 15} minutos.`,
          },
          { status: 429 }
        );
      }

      try {
        const user = await db.authenticateSuperadmin(body.username, body.password);
        // Login exitoso: limpiar intentos fallidos
        resetRateLimit(limitKey);

        const store = (await db.getStore(user.storeId)) || (await db.getStores())[0];
        return NextResponse.json({ user, store });
      } catch (authErr: any) {
        const fail = recordFailedAttempt(limitKey, MAX_ATTEMPTS, WINDOW_MS, LOCKOUT_MS);
        await sleep(TIMING_PENALTY_MS);

        if (fail.blocked) {
          return NextResponse.json(
            {
              error: `Demasiados intentos fallidos. Acceso bloqueado por seguridad durante ${fail.waitMinutes} minutos.`,
            },
            { status: 429 }
          );
        }

        return NextResponse.json(
          {
            error: `${authErr.message || 'Contraseña incorrecta'}. Te quedan ${fail.remainingAttempts} intento(s).`,
          },
          { status: 401 }
        );
      }
    }

    // 2. PIN-based authentication (Mostrador / Dueño)
    if (body.userId && body.pin) {
      const limitKey = `auth:pin:${ip}:${body.userId}`;
      const status = checkRateLimit(limitKey, MAX_ATTEMPTS, WINDOW_MS);

      if (!status.allowed) {
        return NextResponse.json(
          {
            error: `Demasiados intentos fallidos de PIN. Acceso bloqueado por seguridad durante ${status.waitMinutes || 15} minutos.`,
          },
          { status: 429 }
        );
      }

      try {
        const user = await db.authenticateUser(body.userId, body.pin);
        const store = (await db.getStore(user.storeId)) || (await db.getStores())[0];

        if (store && store.active === false && user.role !== 'superadmin') {
          return NextResponse.json(
            {
              error: 'Acceso suspendido: Esta sede comercial se encuentra inactiva. Comunícate con el administrador.',
            },
            { status: 403 }
          );
        }

        // Login exitoso: limpiar intentos fallidos
        resetRateLimit(limitKey);

        return NextResponse.json({ user, store });
      } catch (authErr: any) {
        const fail = recordFailedAttempt(limitKey, MAX_ATTEMPTS, WINDOW_MS, LOCKOUT_MS);
        await sleep(TIMING_PENALTY_MS);

        if (fail.blocked) {
          return NextResponse.json(
            {
              error: `Demasiados intentos fallidos de PIN. Acceso bloqueado por seguridad durante ${fail.waitMinutes} minutos.`,
            },
            { status: 429 }
          );
        }

        return NextResponse.json(
          {
            error: `PIN incorrecto. Te quedan ${fail.remainingAttempts} intento(s) antes del bloqueo.`,
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || undefined;
    const users = await db.getUsers(storeId);
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
