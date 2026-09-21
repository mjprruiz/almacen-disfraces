export type UserRole = 'superadmin' | 'dueno' | 'empleado';

export interface Store {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  currency: string;
  createdAt: string;
}

export interface User {
  id: string;
  storeId: string;
  name: string;
  username: string;
  role: UserRole;
  pin?: string;
  password?: string;
  active?: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  code: string;
  name: string;
  category: string;
  gender: 'Hombre' | 'Mujer' | 'Unisex' | 'Niño' | 'Niña';
  size: string;
  purchaseCost: number;     // Cuánto costó adquirir el disfraz (Inversión)
  rentalPrice: number;      // Precio de alquiler
  salePrice: number;        // Precio de venta
  stockTotal: number;       // Stock total adquirido
  rentedCount: number;      // Cuántos están alquilados en este momento
  soldCount: number;        // Cuántos se han vendido
  availableStock: number;   // stockTotal - rentedCount - soldCount
  isInitialInventory?: boolean; // Si es stock antiguo preexistente (no genera egreso de caja)
  notes?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  dni: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export type RentalStatus = 'activo' | 'devuelto' | 'demorado';

export interface RentalItem {
  productId: string;
  productName: string;
  productCode: string;
  productSize: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
  returnedQuantity?: number;
}

export type GuaranteeType = 'efectivo' | 'documento' | 'efectivo_y_documento' | 'ninguna';

export interface Rental {
  id: string;
  storeId: string;
  ticketCode: string;
  productId: string;
  productName: string;
  productCode: string;
  productSize: string;
  items?: RentalItem[];      // Desglose de prendas para alquileres grupales / colegios
  totalQuantity?: number;    // Cantidad total de prendas (ej. 31 trajes)
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientDni: string;
  userId: string;
  userName: string;
  rentalDate: string;        // YYYY-MM-DD
  dueDate: string;           // YYYY-MM-DD (fecha límite devolución)
  returnDate?: string;       // YYYY-MM-DD (fecha real)
  subtotal?: number;         // Subtotal sin descuento
  discount?: number;         // Descuento aplicado al alquiler
  rentalPrice: number;       // Cobro final por alquiler (subtotal - discount)
  guaranteeAmount: number;   // Depósito / Garantía cobrada
  guaranteeType: GuaranteeType;
  status: RentalStatus;
  penaltyAmount?: number;    // Penalidad por mora
  notes?: string;
  createdAt: string;
}

export interface CashMovement {
  id: string;
  storeId: string;
  userId: string;
  userName: string;
  type: 'ingreso_alquiler' | 'ingreso_venta' | 'egreso_compra' | 'egreso_gasto';
  amount: number;
  description: string;
  referenceId?: string;     // ID de alquiler o producto
  date: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalInventoryCost: number;   // Total invertido en compras de disfraces
  totalRentalRevenue: number;   // Total generado en alquileres
  totalSalesRevenue: number;    // Total generado en ventas
  totalRevenue: number;         // Ventas + Alquileres
  totalExpenses: number;        // Egresos reales de caja (compras nuevas + gastos)
  estimatedNetProfit: number;   // Ingresos - Egresos reales (Flujo neto de caja)
  activeRentalsCount: number;   // Disfraces en la calle
  overdueRentalsCount: number;  // Disfraces con retraso
  dueTodayRentalsCount: number; // Disfraces que vencen hoy
  heldGuarantees: number;       // Dinero de clientes retenido en garantía
  totalAvailableStock: number;  // Disfraces listos para alquilar
  totalCatalogCount: number;    // Cantidad de modelos registrados
}
