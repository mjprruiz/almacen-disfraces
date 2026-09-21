import fs from 'fs';
import path from 'path';
import {
  Store,
  User,
  UserRole,
  Product,
  Client,
  Rental,
  RentalItem,
  RentalStatus,
  GuaranteeType,
  CashMovement,
  DashboardMetrics,
} from './types';

interface DatabaseSchema {
  stores: Store[];
  users: User[];
  products: Product[];
  clients: Client[];
  rentals: Rental[];
  cashMovements: CashMovement[];
}

const DB_FILE = path.join(process.cwd(), 'data', 'database.json');

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const initialSeedData: DatabaseSchema = {
  stores: [
    {
      id: 'store_principal',
      name: 'Sede Principal',
      slug: 'principal',
      phone: '',
      address: '',
      currency: '$',
      createdAt: '2026-09-20T00:00:00Z',
    },
  ],
  users: [
    {
      id: 'user_superadmin',
      storeId: 'store_principal',
      name: 'Super Administrador',
      username: 'superadmin',
      role: 'superadmin',
      password: 'admin123',
      pin: '0000',
      active: true,
      createdAt: '2026-09-20T00:00:00Z',
    },
  ],
  products: [],
  clients: [],
  rentals: [],
  cashMovements: [],
};

function readDb(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(initialSeedData, null, 2), 'utf-8');
    return initialSeedData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading database file:', error);
    return initialSeedData;
  }
}

function writeDb(data: DatabaseSchema): void {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const db = {
  // STORES
  getStores(): Store[] {
    return readDb().stores;
  },

  getStore(storeId: string): Store | undefined {
    return readDb().stores.find((s) => s.id === storeId);
  },

  createStore(params: {
    name: string;
    phone?: string;
    address?: string;
    currency?: string;
  }): Store {
    const data = readDb();
    const slug = params.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = data.stores.find((s) => s.slug === slug);
    if (existing) {
      throw new Error(`Ya existe una sede con el identificador "${slug}".`);
    }

    const newStore: Store = {
      id: 'store_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      name: params.name.trim(),
      slug,
      phone: params.phone || '',
      address: params.address || '',
      currency: params.currency || '$',
      createdAt: new Date().toISOString(),
    };

    data.stores.push(newStore);
    writeDb(data);
    return newStore;
  },

  updateStore(storeId: string, updates: Partial<Store>): Store {
    const data = readDb();
    const index = data.stores.findIndex((s) => s.id === storeId);
    if (index === -1) {
      throw new Error('Sede no encontrada.');
    }
    const current = data.stores[index];
    const updated: Store = {
      ...current,
      ...updates,
      id: current.id,
    };
    data.stores[index] = updated;
    writeDb(data);
    return updated;
  },

  // USERS
  getUsers(storeId?: string): User[] {
    const users = readDb().users;
    if (storeId) {
      return users.filter((u) => u.storeId === storeId);
    }
    return users;
  },

  getUserById(id: string): User | undefined {
    return readDb().users.find((u) => u.id === id);
  },

  getUserByUsername(username: string): User | undefined {
    return readDb().users.find((u) => u.username === username);
  },

  authenticateUser(userId: string, pin: string): User {
    const user = readDb().users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }
    if (user.active === false) {
      throw new Error('Este usuario se encuentra inactivo. Contacta al administrador.');
    }
    if (user.pin !== pin) {
      throw new Error('PIN incorrecto. Verifica los 4 dígitos ingresados.');
    }
    return user;
  },

  authenticateSuperadmin(username: string, password: string): User {
    const cleanUsername = username.trim().toLowerCase();
    const user = readDb().users.find(
      (u) => u.role === 'superadmin' && u.username.toLowerCase() === cleanUsername
    );
    if (!user) {
      throw new Error('Usuario superadministrador no encontrado.');
    }
    if (user.active === false) {
      throw new Error('Esta cuenta de superadministrador está desactivada.');
    }
    if (!user.password || user.password !== password) {
      throw new Error('Contraseña de superadministrador incorrecta.');
    }
    return user;
  },

  changeUserPin(userId: string, currentPin: string, newPin: string): User {
    const data = readDb();
    const index = data.users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error('Usuario no encontrado.');
    }
    const user = data.users[index];
    if (user.pin && user.pin !== currentPin) {
      throw new Error('El PIN actual ingresado no es correcto.');
    }
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      throw new Error('El nuevo PIN debe ser exactamente de 4 dígitos numéricos.');
    }

    user.pin = newPin;
    data.users[index] = user;
    writeDb(data);
    return user;
  },

  createUser(params: {
    storeId: string;
    name: string;
    username: string;
    role: UserRole;
    pin?: string;
    password?: string;
    creatorRole?: UserRole;
  }): User {
    const data = readDb();
    const cleanUsername = params.username.trim().toLowerCase();
    const existing = data.users.find((u) => u.username.toLowerCase() === cleanUsername);
    if (existing) {
      throw new Error(`El nombre de usuario "${cleanUsername}" ya existe. Elige otro.`);
    }

    // Role permissions
    if (params.role === 'dueno' && params.creatorRole !== 'superadmin') {
      throw new Error('Solo el Superadministrador puede registrar Dueños de sede.');
    }
    if (params.role === 'superadmin' && params.creatorRole !== 'superadmin') {
      throw new Error('No se pueden registrar cuentas de superadministrador adicionales.');
    }

    if (params.role !== 'superadmin') {
      if (!params.pin || params.pin.length !== 4 || !/^\d{4}$/.test(params.pin)) {
        throw new Error('El PIN debe ser exactamente de 4 dígitos numéricos.');
      }
    }

    const newUser: User = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      storeId: params.storeId,
      name: params.name.trim(),
      username: cleanUsername,
      role: params.role,
      pin: params.pin || '1234',
      password: params.password,
      active: true,
      createdAt: new Date().toISOString(),
    };

    data.users.push(newUser);
    writeDb(data);
    return newUser;
  },

  updateUser(userId: string, updates: {
    name?: string;
    role?: UserRole;
    storeId?: string;
    active?: boolean;
    pin?: string;
    password?: string;
  }): User {
    const data = readDb();
    const index = data.users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error('Usuario no encontrado.');
    }

    if (updates.pin) {
      if (updates.pin.length !== 4 || !/^\d{4}$/.test(updates.pin)) {
        throw new Error('El PIN debe ser exactamente de 4 dígitos numéricos.');
      }
    }

    const current = data.users[index];
    const updated: User = {
      ...current,
      name: updates.name ? updates.name.trim() : current.name,
      role: updates.role || current.role,
      storeId: updates.storeId || current.storeId,
      active: updates.active !== undefined ? updates.active : (current.active ?? true),
      pin: updates.pin || current.pin,
      password: updates.password || current.password,
    };

    data.users[index] = updated;
    writeDb(data);
    return updated;
  },

  resetUserPin(userId: string, newPin: string): User {
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      throw new Error('El nuevo PIN debe ser exactamente de 4 dígitos numéricos.');
    }
    return this.updateUser(userId, { pin: newPin });
  },

  deleteUser(userId: string): boolean {
    const data = readDb();
    const index = data.users.findIndex((u) => u.id === userId);
    if (index === -1) return false;
    data.users[index].active = false;
    writeDb(data);
    return true;
  },

  // PRODUCTS
  getProducts(storeId: string): Product[] {
    const all = readDb().products.filter((p) => p.storeId === storeId);
    // Recalculate availableStock dynamically
    return all.map((p) => ({
      ...p,
      availableStock: Math.max(0, p.stockTotal - p.rentedCount - p.soldCount),
    }));
  },

  getProduct(storeId: string, id: string): Product | undefined {
    const data = readDb();
    const p = data.products.find((prod) => prod.storeId === storeId && prod.id === id);
    if (!p) return undefined;
    return {
      ...p,
      availableStock: Math.max(0, p.stockTotal - p.rentedCount - p.soldCount),
    };
  },

  addProduct(storeId: string, item: Omit<Product, 'id' | 'storeId' | 'availableStock' | 'rentedCount' | 'soldCount' | 'createdAt'>): Product {
    const data = readDb();
    
    // 1. Validar unicidad de código por tienda
    const codeUpper = item.code.trim().toUpperCase();
    const existingCode = data.products.find(
      (p) => p.storeId === storeId && p.code.toUpperCase() === codeUpper
    );
    if (existingCode) {
      throw new Error(`El código "${codeUpper}" ya está asignado al disfraz "${existingCode.name}". Cada disfraz debe tener un código único.`);
    }

    // 2. Validaciones numéricas
    if (item.stockTotal < 1) {
      throw new Error('El stock total debe ser al menos 1 unidad.');
    }
    if (item.rentalPrice < 0 || item.purchaseCost < 0 || item.salePrice < 0) {
      throw new Error('Los precios y costos no pueden ser valores negativos.');
    }

    const newProduct: Product = {
      ...item,
      code: codeUpper,
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      storeId,
      rentedCount: 0,
      soldCount: 0,
      availableStock: item.stockTotal,
      createdAt: new Date().toISOString(),
    };

    data.products.push(newProduct);

    // Solo si NO es inventario inicial (es compra nueva realizada hoy), registrar egreso de caja
    if (!item.isInitialInventory && newProduct.purchaseCost > 0 && newProduct.stockTotal > 0) {
      data.cashMovements.push({
        id: 'mov_' + Date.now(),
        storeId,
        userId: 'sistema',
        userName: 'Compra de Nuevo Stock',
        type: 'egreso_compra',
        amount: newProduct.purchaseCost * newProduct.stockTotal,
        description: `Compra de stock nuevo: ${newProduct.name} (${newProduct.stockTotal} unid. x $${newProduct.purchaseCost})`,
        referenceId: newProduct.id,
        date: getTodayString(),
        createdAt: new Date().toISOString(),
      });
    }

    writeDb(data);
    return newProduct;
  },

  updateProduct(storeId: string, id: string, updates: Partial<Product>): Product | null {
    const data = readDb();
    const index = data.products.findIndex((p) => p.storeId === storeId && p.id === id);
    if (index === -1) return null;

    const current = data.products[index];

    // Validar unicidad si se actualiza el código
    if (updates.code) {
      const codeUpper = updates.code.trim().toUpperCase();
      const existingCode = data.products.find(
        (p) => p.storeId === storeId && p.id !== id && p.code.toUpperCase() === codeUpper
      );
      if (existingCode) {
        throw new Error(`El código "${codeUpper}" ya está asignado al disfraz "${existingCode.name}".`);
      }
      updates.code = codeUpper;
    }

    const updated: Product = {
      ...current,
      ...updates,
      availableStock: Math.max(
        0,
        (updates.stockTotal ?? current.stockTotal) -
          (updates.rentedCount ?? current.rentedCount) -
          (updates.soldCount ?? current.soldCount)
      ),
    };

    data.products[index] = updated;
    writeDb(data);
    return updated;
  },

  recordSale(
    storeId: string,
    params: {
      productId: string;
      clientId?: string;
      userId: string;
      userName: string;
      quantity: number;
      salePrice: number;
      discount?: number;
      notes?: string;
    }
  ): { success: boolean; product?: Product; error?: string } {
    const data = readDb();
    const product = data.products.find((p) => p.storeId === storeId && p.id === params.productId);
    if (!product) return { success: false, error: 'Disfraz no encontrado' };

    const available = product.stockTotal - product.rentedCount - product.soldCount;
    if (available < params.quantity) {
      return { success: false, error: `Stock insuficiente. Solo hay ${available} unidad(es) disponible(s) para venta.` };
    }

    const client = params.clientId ? data.clients.find((c) => c.storeId === storeId && c.id === params.clientId) : null;
    const clientLabel = client ? ` a ${client.name}` : ' (Venta directa mostrador)';

    product.soldCount += params.quantity;
    product.availableStock = Math.max(0, product.stockTotal - product.rentedCount - product.soldCount);

    const discount = Math.max(0, Number(params.discount) || 0);
    const grossAmount = params.salePrice * params.quantity;
    const totalAmount = Math.max(0, grossAmount - discount);
    const discountText = discount > 0 ? ` (Desc: -$${discount})` : '';

    data.cashMovements.push({
      id: 'mov_' + Date.now(),
      storeId,
      userId: params.userId,
      userName: params.userName,
      type: 'ingreso_venta',
      amount: totalAmount,
      description: `Venta: ${params.quantity}x ${product.name} [${product.size}]${clientLabel}${discountText}`,
      referenceId: product.id,
      date: getTodayString(),
      createdAt: new Date().toISOString(),
    });

    writeDb(data);
    return { success: true, product };
  },

  restockProduct(
    storeId: string,
    params: {
      productId: string;
      userId: string;
      userName: string;
      quantity: number;
      purchaseCost: number;
      notes?: string;
    }
  ): { success: boolean; product?: Product; error?: string } {
    const data = readDb();
    const product = data.products.find((p) => p.storeId === storeId && p.id === params.productId);
    if (!product) return { success: false, error: 'Disfraz no encontrado' };

    if (params.quantity < 1) {
      return { success: false, error: 'La cantidad a ingresar debe ser al menos 1 unidad' };
    }
    if (params.purchaseCost < 0) {
      return { success: false, error: 'El costo de compra no puede ser negativo' };
    }

    // Aumentar stock
    product.stockTotal += params.quantity;
    product.availableStock = Math.max(0, product.stockTotal - product.rentedCount - product.soldCount);
    // Actualizar al último precio de compra
    product.purchaseCost = params.purchaseCost;

    const totalCost = params.purchaseCost * params.quantity;
    const noteText = params.notes ? ` (${params.notes})` : '';

    // Registrar salida de dinero en caja
    data.cashMovements.push({
      id: 'mov_' + Date.now(),
      storeId,
      userId: params.userId,
      userName: params.userName,
      type: 'egreso_compra',
      amount: totalCost,
      description: `Reabastecimiento: +${params.quantity}x ${product.name} [${product.size}] a $${params.purchaseCost} c/u${noteText}`,
      referenceId: product.id,
      date: getTodayString(),
      createdAt: new Date().toISOString(),
    });

    writeDb(data);
    return { success: true, product };
  },

  deleteProduct(storeId: string, id: string): boolean {
    const data = readDb();
    const initialLen = data.products.length;
    data.products = data.products.filter((p) => !(p.storeId === storeId && p.id === id));
    if (data.products.length !== initialLen) {
      writeDb(data);
      return true;
    }
    return false;
  },

  // CLIENTS
  getClients(storeId: string): Client[] {
    return readDb().clients.filter((c) => c.storeId === storeId);
  },

  addClient(storeId: string, clientData: Omit<Client, 'id' | 'storeId' | 'createdAt'>): Client {
    const data = readDb();
    // Check if phone or dni already exists
    const existing = data.clients.find(
      (c) => c.storeId === storeId && (c.phone === clientData.phone || (clientData.dni && c.dni === clientData.dni))
    );
    if (existing) {
      return existing;
    }

    const newClient: Client = {
      ...clientData,
      id: 'cli_' + Date.now(),
      storeId,
      createdAt: new Date().toISOString(),
    };
    data.clients.push(newClient);
    writeDb(data);
    return newClient;
  },

  // RENTALS
  getRentals(storeId: string): Rental[] {
    const data = readDb();
    const today = getTodayString();

    return data.rentals
      .filter((r) => r.storeId === storeId)
      .map((r): Rental => {
        // Auto update status to demorado if past due date and still activo
        if (r.status === 'activo' && r.dueDate < today) {
          return { ...r, status: 'demorado' as RentalStatus };
        }
        return r;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createRental(
    storeId: string,
    params: {
      productId?: string;
      clientId: string;
      userId: string;
      userName: string;
      dueDate: string;
      rentalPrice?: number;
      subtotal?: number;
      discount?: number;
      guaranteeAmount: number;
      guaranteeType: GuaranteeType;
      notes?: string;
      items?: RentalItem[];
      totalQuantity?: number;
    }
  ): { rental: Rental; error?: string } {
    const data = readDb();
    const client = data.clients.find((c) => c.storeId === storeId && c.id === params.clientId);
    if (!client) {
      return { rental: null as any, error: 'Cliente no encontrado' };
    }

    const today = getTodayString();
    if (params.dueDate < today) {
      return { rental: null as any, error: 'La fecha pactada de devolución no puede ser anterior a la fecha actual.' };
    }

    const hasItems = params.items && params.items.length > 0;
    let itemsToProcess: RentalItem[] = [];
    let primaryProduct: Product | undefined;
    let totalQty = 1;

    if (hasItems) {
      itemsToProcess = params.items!;
      totalQty = itemsToProcess.reduce((sum, it) => sum + (it.quantity || 1), 0);

      // 1. Validar stock de cada item
      for (const it of itemsToProcess) {
        const prod = data.products.find((p) => p.storeId === storeId && p.id === it.productId);
        if (!prod) {
          return { rental: null as any, error: `Disfraz "${it.productName || it.productId}" no encontrado en el catálogo.` };
        }
        const available = prod.stockTotal - prod.rentedCount - prod.soldCount;
        if (available < it.quantity) {
          return {
            rental: null as any,
            error: `Stock insuficiente para "${prod.name}" [${prod.size}]. Solicitado: ${it.quantity}, disponible: ${available}`,
          };
        }
      }

      // 2. Descontar stock de cada item
      for (const it of itemsToProcess) {
        const prod = data.products.find((p) => p.storeId === storeId && p.id === it.productId)!;
        prod.rentedCount += it.quantity;
        prod.availableStock = Math.max(0, prod.stockTotal - prod.rentedCount - prod.soldCount);
      }

      const firstProd = data.products.find((p) => p.storeId === storeId && p.id === itemsToProcess[0].productId);
      primaryProduct = firstProd;
    } else {
      // Compatibilidad hacia atrás: alquiler de un solo producto
      if (!params.productId) {
        return { rental: null as any, error: 'Debes seleccionar al menos un disfraz para alquilar.' };
      }
      const product = data.products.find((p) => p.storeId === storeId && p.id === params.productId);
      if (!product) {
        return { rental: null as any, error: 'Disfraz no encontrado' };
      }

      const available = product.stockTotal - product.rentedCount - product.soldCount;
      if (available <= 0) {
        return { rental: null as any, error: 'No hay stock disponible para alquilar este disfraz' };
      }

      product.rentedCount += 1;
      product.availableStock = Math.max(0, product.stockTotal - product.rentedCount - product.soldCount);
      primaryProduct = product;

      const singlePrice = params.rentalPrice !== undefined && Number(params.rentalPrice) > 0
        ? Number(params.rentalPrice)
        : product.rentalPrice;

      itemsToProcess = [
        {
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          productSize: product.size,
          quantity: 1,
          unitPrice: singlePrice,
          subtotal: singlePrice,
        },
      ];
      totalQty = 1;
    }

    const discount = Math.max(0, Number(params.discount) || 0);
    let grossSubtotal = itemsToProcess.reduce((sum, it) => sum + (it.subtotal ?? (it.unitPrice * it.quantity)), 0);
    if (params.subtotal !== undefined && Number(params.subtotal) > 0) {
      grossSubtotal = Number(params.subtotal);
    }

    // Calcular precio final: si viene en 0 o no viene, calcular subtotal - descuento
    let finalRentalPrice = params.rentalPrice !== undefined && Number(params.rentalPrice) > 0
      ? Number(params.rentalPrice)
      : Math.max(0, grossSubtotal - discount);

    // Si aún da 0 pero hay subtotal y no se pidió un descuento explícito que cubra el 100%, usar el subtotal
    if (finalRentalPrice <= 0 && grossSubtotal > 0 && discount === 0) {
      finalRentalPrice = grossSubtotal;
    }

    const ticketSeq = data.rentals.filter((r) => r.storeId === storeId).length + 1001;
    const ticketCode = `ALQ-${ticketSeq}`;

    const displayName = itemsToProcess.length === 1
      ? itemsToProcess[0].productName
      : `${itemsToProcess[0].productName} (+${itemsToProcess.length - 1} trajes)`;

    const newRental: Rental = {
      id: 'rent_' + Date.now(),
      storeId,
      ticketCode,
      productId: primaryProduct?.id || itemsToProcess[0].productId,
      productName: displayName,
      productCode: primaryProduct?.code || itemsToProcess[0].productCode,
      productSize: primaryProduct?.size || itemsToProcess[0].productSize,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      clientDni: client.dni,
      userId: params.userId,
      userName: params.userName,
      rentalDate: today,
      dueDate: params.dueDate,
      subtotal: grossSubtotal,
      discount: discount,
      rentalPrice: finalRentalPrice,
      guaranteeAmount: Number(params.guaranteeAmount || 0),
      guaranteeType: params.guaranteeType,
      status: params.dueDate < today ? 'demorado' : 'activo',
      notes: params.notes || '',
      items: itemsToProcess,
      totalQuantity: totalQty,
      createdAt: new Date().toISOString(),
    };

    const discountText = discount > 0 ? ` (Desc: -$${discount})` : '';

    // Record cash income for the rental fee
    data.cashMovements.push({
      id: 'mov_' + Date.now(),
      storeId,
      userId: params.userId,
      userName: params.userName,
      type: 'ingreso_alquiler',
      amount: newRental.rentalPrice,
      description: `Alquiler ${ticketCode}: ${displayName} (${totalQty} prendas) a ${client.name}${discountText}`,
      referenceId: newRental.id,
      date: today,
      createdAt: new Date().toISOString(),
    });

    data.rentals.push(newRental);
    writeDb(data);

    return { rental: newRental };
  },

  returnRental(
    storeId: string,
    params: {
      rentalId: string;
      userId: string;
      userName: string;
      penaltyAmount?: number;
      returnNotes?: string;
    }
  ): { rental: Rental | null; error?: string } {
    const data = readDb();
    const rental = data.rentals.find((r) => r.storeId === storeId && r.id === params.rentalId);
    if (!rental) {
      return { rental: null, error: 'Alquiler no encontrado' };
    }

    if (rental.status === 'devuelto') {
      return { rental, error: 'Este alquiler ya fue devuelto con anterioridad' };
    }

    const today = getTodayString();
    rental.status = 'devuelto';
    rental.returnDate = today;
    rental.penaltyAmount = Number(params.penaltyAmount || 0);
    if (params.returnNotes) {
      rental.notes = (rental.notes ? rental.notes + ' | ' : '') + `Devolución: ${params.returnNotes}`;
    }

    // Restore product stock for all items
    if (rental.items && rental.items.length > 0) {
      for (const it of rental.items) {
        const product = data.products.find((p) => p.storeId === storeId && p.id === it.productId);
        if (product) {
          product.rentedCount = Math.max(0, product.rentedCount - (it.quantity || 1));
          product.availableStock = Math.max(0, product.stockTotal - product.rentedCount - product.soldCount);
        }
      }
    } else {
      const product = data.products.find((p) => p.storeId === storeId && p.id === rental.productId);
      if (product) {
        product.rentedCount = Math.max(0, product.rentedCount - 1);
        product.availableStock = Math.max(0, product.stockTotal - product.rentedCount - product.soldCount);
      }
    }

    // If penalty was charged, record cash movement
    if (rental.penaltyAmount > 0) {
      data.cashMovements.push({
        id: 'mov_' + Date.now(),
        storeId,
        userId: params.userId,
        userName: params.userName,
        type: 'ingreso_alquiler',
        amount: rental.penaltyAmount,
        description: `Penalidad por mora/daños en ${rental.ticketCode} (${rental.clientName})`,
        referenceId: rental.id,
        date: today,
        createdAt: new Date().toISOString(),
      });
    }

    writeDb(data);
    return { rental };
  },

  // CASH MOVEMENTS
  getCashMovements(storeId: string): CashMovement[] {
    return readDb()
      .cashMovements.filter((m) => m.storeId === storeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // DASHBOARD METRICS
  getDashboardMetrics(storeId: string): DashboardMetrics {
    const data = readDb();
    const today = getTodayString();

    const storeProducts = data.products.filter((p) => p.storeId === storeId);
    const storeRentals = data.rentals.filter((r) => r.storeId === storeId);
    const storeMovements = data.cashMovements.filter((m) => m.storeId === storeId);

    // Patrimonio en Disfraces: costo de compra * unidades actuales en propiedad (disponibles en tienda + alquiladas que van a regresar)
    // Las prendas vendidas se descuentan automáticamente del patrimonio al salir de forma permanente del inventario
    const totalInventoryCost = storeProducts.reduce((sum, p) => {
      const currentOwnedUnits = Math.max(0, p.stockTotal - p.soldCount);
      return sum + (p.purchaseCost * currentOwnedUnits);
    }, 0);

    // Ingresos por Alquiler
    const totalRentalRevenue = storeMovements
      .filter((m) => m.type === 'ingreso_alquiler')
      .reduce((sum, m) => sum + m.amount, 0);

    // Ingresos por Venta
    const totalSalesRevenue = storeMovements
      .filter((m) => m.type === 'ingreso_venta')
      .reduce((sum, m) => sum + m.amount, 0);

    const totalRevenue = totalRentalRevenue + totalSalesRevenue;

    // Egresos registrados en caja (solo compras de stock y gastos operativos de caja)
    const totalExpenses = storeMovements
      .filter((m) => m.type === 'egreso_compra' || m.type === 'egreso_gasto')
      .reduce((sum, m) => sum + m.amount, 0);

    // Flujo de Caja Real (Ganancia Neta): Ingresos - Egresos reales de caja
    const estimatedNetProfit = totalRevenue - totalExpenses;

    // Operational metrics
    const activeRentals = storeRentals.filter((r) => r.status !== 'devuelto');
    const overdueRentals = activeRentals.filter((r) => r.dueDate < today);
    const dueTodayRentals = activeRentals.filter((r) => r.dueDate === today);

    // Cash held in guarantees
    const heldGuarantees = activeRentals
      .filter((r) => r.guaranteeType === 'efectivo' || r.guaranteeType === 'efectivo_y_documento')
      .reduce((sum, r) => sum + (r.guaranteeAmount || 0), 0);

    const totalAvailableStock = storeProducts.reduce((sum, p) => sum + Math.max(0, p.stockTotal - p.rentedCount - p.soldCount), 0);

    return {
      totalInventoryCost,
      totalRentalRevenue,
      totalSalesRevenue,
      totalRevenue,
      totalExpenses,
      estimatedNetProfit,
      activeRentalsCount: activeRentals.length,
      overdueRentalsCount: overdueRentals.length,
      dueTodayRentalsCount: dueTodayRentals.length,
      heldGuarantees,
      totalAvailableStock,
      totalCatalogCount: storeProducts.length,
    };
  },
};
