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

    const rentals = db.getRentals(storeId);
    return NextResponse.json({ rentals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      storeId,
      productId,
      clientId,
      userId,
      userName,
      dueDate,
      rentalPrice,
      subtotal,
      discount,
      guaranteeAmount,
      guaranteeType,
      notes,
      items,
      totalQuantity,
    } = body;

    const hasItems = items && Array.isArray(items) && items.length > 0;
    if (!storeId || (!productId && !hasItems) || !clientId || !dueDate) {
      return NextResponse.json({ error: 'Faltan datos obligatorios para registrar el alquiler' }, { status: 400 });
    }

    // Validar acceso a la sede
    const auth = validateStoreAccess({ storeId, userId });
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const result = db.createRental(storeId, {
      productId,
      clientId,
      userId: auth.user!.id,
      userName: userName || auth.user!.name,
      dueDate,
      rentalPrice: rentalPrice !== undefined ? Number(rentalPrice) : undefined,
      subtotal: subtotal !== undefined ? Number(subtotal) : undefined,
      discount: discount !== undefined ? Number(discount) : undefined,
      guaranteeAmount: Number(guaranteeAmount) || 0,
      guaranteeType: guaranteeType || 'efectivo',
      notes: notes || '',
      items: hasItems ? items : undefined,
      totalQuantity: totalQuantity ? Number(totalQuantity) : undefined,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ rental: result.rental }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { storeId, rentalId, userId, userName, penaltyAmount, returnNotes } = body;

    if (!storeId || !rentalId) {
      return NextResponse.json({ error: 'storeId y rentalId requeridos' }, { status: 400 });
    }

    // Validar acceso a la sede
    const auth = validateStoreAccess({ storeId, userId });
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const result = db.returnRental(storeId, {
      rentalId,
      userId: auth.user!.id,
      userName: userName || auth.user!.name,
      penaltyAmount: Number(penaltyAmount) || 0,
      returnNotes: returnNotes || '',
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ rental: result.rental });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
