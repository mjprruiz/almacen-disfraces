import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateStoreAccess } from '@/lib/auth-guard';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, productId, userId, userName, quantity, purchaseCost, notes } = body;

    if (!storeId || !productId) {
      return NextResponse.json({ error: 'storeId y productId son obligatorios' }, { status: 400 });
    }

    // Role check: Only 'dueno' of this store can restock
    const auth = validateStoreAccess({ storeId, userId, requiredRole: 'dueno' });
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const qty = Number(quantity);
    if (!qty || qty < 1) {
      return NextResponse.json({ error: 'La cantidad a ingresar debe ser al menos 1 unidad' }, { status: 400 });
    }

    const cost = Number(purchaseCost);
    if (cost < 0) {
      return NextResponse.json({ error: 'El costo de compra no puede ser negativo' }, { status: 400 });
    }

    const result = db.restockProduct(storeId, {
      productId,
      userId: auth.user!.id,
      userName: userName || auth.user!.name,
      quantity: qty,
      purchaseCost: cost,
      notes,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, product: result.product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
