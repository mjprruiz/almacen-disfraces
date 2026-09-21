import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateStoreAccess } from '@/lib/auth-guard';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, productId, clientId, userId, userName, quantity, salePrice, discount, notes } = body;

    if (!storeId || !productId) {
      return NextResponse.json({ error: 'storeId y productId son obligatorios' }, { status: 400 });
    }

    // Validar acceso a la sede
    const auth = validateStoreAccess({ storeId, userId });
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const qty = Number(quantity) || 1;
    if (qty < 1) {
      return NextResponse.json({ error: 'La cantidad vendida debe ser al menos 1' }, { status: 400 });
    }

    const price = Number(salePrice);
    if (price < 0) {
      return NextResponse.json({ error: 'El precio de venta no puede ser negativo' }, { status: 400 });
    }

    const result = db.recordSale(storeId, {
      productId,
      clientId,
      userId: auth.user!.id,
      userName: userName || auth.user!.name,
      quantity: qty,
      salePrice: price,
      discount: discount !== undefined ? Number(discount) : 0,
      notes,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, product: result.product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
