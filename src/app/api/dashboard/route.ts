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

    // Seguridad: Validar que el usuario pertenezca a esta sede
    if (userId) {
      const auth = validateStoreAccess({ storeId, userId });
      if (!auth.allowed) {
        return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
      }

      const metrics = db.getDashboardMetrics(storeId);
      const cashMovements = db.getCashMovements(storeId);

      // Si el rol es empleado en la base de datos, enmascarar datos financieros
      if (auth.user?.role === 'empleado') {
        return NextResponse.json({
          metrics: {
            activeRentalsCount: metrics.activeRentalsCount,
            overdueRentalsCount: metrics.overdueRentalsCount,
            dueTodayRentalsCount: metrics.dueTodayRentalsCount,
            totalAvailableStock: metrics.totalAvailableStock,
            totalCatalogCount: metrics.totalCatalogCount,
            heldGuarantees: metrics.heldGuarantees,
            totalInventoryCost: 0,
            totalRentalRevenue: 0,
            totalSalesRevenue: 0,
            totalRevenue: 0,
            totalExpenses: 0,
            estimatedNetProfit: 0,
          },
          cashMovements: [],
          restricted: true,
        });
      }

      return NextResponse.json({
        metrics,
        cashMovements,
        restricted: false,
      });
    }

    // Si no se proporcionó userId, devolver métricas básicas no sensibles o error
    return NextResponse.json(
      { error: 'Identificación de usuario requerida para acceder al dashboard.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
