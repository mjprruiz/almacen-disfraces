import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const stores = db.getStores();
    return NextResponse.json({ stores });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userRole, name, phone, address, currency } = body;

    // Solo el superadmin puede crear sedes
    if (userRole !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo el Superadministrador puede registrar nuevas sedes.' },
        { status: 403 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la sede es obligatorio.' },
        { status: 400 }
      );
    }

    const newStore = db.createStore({
      name: name.trim(),
      phone: phone?.trim(),
      address: address?.trim(),
      currency: currency || '$',
    });

    return NextResponse.json({ store: newStore }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userRole, storeId, updates } = body;

    if (userRole !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo el Superadministrador puede editar sedes.' },
        { status: 403 }
      );
    }

    if (!storeId || !updates) {
      return NextResponse.json(
        { error: 'ID de sede y datos a actualizar requeridos.' },
        { status: 400 }
      );
    }

    const updatedStore = db.updateStore(storeId, updates);
    return NextResponse.json({ store: updatedStore });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
