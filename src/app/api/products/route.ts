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

    const products = db.getProducts(storeId);
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, product, userId } = body;

    if (!storeId || !product) {
      return NextResponse.json({ error: 'storeId y datos del producto requeridos' }, { status: 400 });
    }

    // Role check: Only 'dueno' of this store can add products
    const auth = validateStoreAccess({ storeId, userId, requiredRole: 'dueno' });
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const created = db.addProduct(storeId, {
      code: product.code.trim().toUpperCase(),
      name: product.name.trim(),
      category: product.category || 'General',
      gender: product.gender || 'Unisex',
      size: product.size.trim().toUpperCase(),
      purchaseCost: Number(product.purchaseCost) || 0,
      rentalPrice: Number(product.rentalPrice) || 0,
      salePrice: Number(product.salePrice) || 0,
      stockTotal: Number(product.stockTotal) || 1,
      isInitialInventory: Boolean(product.isInitialInventory),
      notes: product.notes || '',
    });

    return NextResponse.json({ product: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { storeId, productId, updates, userId } = body;

    if (!storeId || !productId) {
      return NextResponse.json({ error: 'storeId y productId requeridos' }, { status: 400 });
    }

    // Only 'dueno' of this store can modify products
    const auth = validateStoreAccess({ storeId, userId, requiredRole: 'dueno' });
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const updated = db.updateProduct(storeId, productId, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ product: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');

    if (!storeId || !productId) {
      return NextResponse.json({ error: 'Parámetros incompletos' }, { status: 400 });
    }

    const auth = validateStoreAccess({ storeId, userId, requiredRole: 'dueno' });
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const success = db.deleteProduct(storeId, productId);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
