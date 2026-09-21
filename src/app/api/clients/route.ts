import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateStoreAccess } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const userId = searchParams.get('userId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    if (userId) {
      const auth = validateStoreAccess({ storeId, userId });
      if (!auth.allowed) {
        return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
      }
    }

    const clients = db.getClients(storeId);
    return NextResponse.json({ clients });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, client, userId } = body;

    if (!storeId || !client || !client.name || !client.phone) {
      return NextResponse.json({ error: 'Nombre y teléfono son obligatorios' }, { status: 400 });
    }

    // Validar acceso a la sede
    const auth = validateStoreAccess({ storeId, userId });
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const created = db.addClient(storeId, {
      name: client.name.trim(),
      phone: client.phone.trim(),
      dni: (client.dni || '').trim(),
      email: (client.email || '').trim(),
      address: (client.address || '').trim(),
      notes: (client.notes || '').trim(),
    });

    return NextResponse.json({ client: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
