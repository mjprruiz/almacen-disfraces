import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Superadmin authentication (Username + Password)
    if (body.username && body.password) {
      try {
        const user = db.authenticateSuperadmin(body.username, body.password);
        const store = db.getStore(user.storeId) || db.getStores()[0];
        return NextResponse.json({ user, store });
      } catch (authErr: any) {
        return NextResponse.json({ error: authErr.message }, { status: 401 });
      }
    }

    // 2. PIN-based authentication (Mostrador / Dueño)
    if (body.userId && body.pin) {
      try {
        const user = db.authenticateUser(body.userId, body.pin);
        const store = db.getStore(user.storeId) || db.getStores()[0];
        return NextResponse.json({ user, store });
      } catch (authErr: any) {
        return NextResponse.json({ error: authErr.message }, { status: 401 });
      }
    }

    // 3. Fallback username authentication
    if (body.username) {
      const user = db.getUserByUsername(body.username);
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }
      const store = db.getStore(user.storeId) || db.getStores()[0];
      return NextResponse.json({ user, store });
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
    const users = db.getUsers(storeId);
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
