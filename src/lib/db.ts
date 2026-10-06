import { supabase } from './supabase';
import { getPeruTodayString } from './dates';
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

function getTodayString(): string {
  return getPeruTodayString();
}


// Mappers from Supabase snake_case to TypeScript camelCase
function mapStore(row: any): Store {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    phone: row.phone || '',
    address: row.address || '',
    currency: row.currency || '$',
    active: row.active !== false,
    createdAt: row.created_at,
  };
}

function mapUser(row: any): User {
  return {
    id: row.id,
    storeId: row.store_id || '',
    name: row.name,
    username: row.username,
    role: row.role as UserRole,
    password: row.password || undefined,
    pin: row.pin || '1234',
    active: row.active !== false,
    createdAt: row.created_at,
  };
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    storeId: row.store_id,
    code: row.code,
    name: row.name,
    category: row.category,
    gender: row.gender,
    size: row.size,
    purchaseCost: Number(row.purchase_cost) || 0,
    rentalPrice: Number(row.rental_price) || 0,
    salePrice: Number(row.sale_price) || 0,
    stockTotal: Number(row.stock_total) || 0,
    rentedCount: Number(row.rented_count) || 0,
    soldCount: Number(row.sold_count) || 0,
    availableStock: Number(row.available_stock) || 0,
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function mapClient(row: any): Client {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    phone: row.phone,
    dni: row.dni || '',
    email: row.email || '',
    address: row.address || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function mapRental(row: any): Rental {
  return {
    id: row.id,
    storeId: row.store_id,
    ticketCode: row.ticket_code,
    productId: row.product_id || '',
    productName: row.product_name || '',
    productCode: row.product_code || '',
    productSize: row.product_size || '',
    clientId: row.client_id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    clientDni: row.client_dni || '',
    userId: row.user_id,
    userName: row.user_name,
    rentalDate: row.rental_date,
    dueDate: row.due_date,
    returnDate: row.return_date || undefined,
    rentalPrice: Number(row.rental_price) || 0,
    subtotal: row.subtotal !== null ? Number(row.subtotal) : undefined,
    discount: row.discount !== null ? Number(row.discount) : undefined,
    guaranteeAmount: Number(row.guarantee_amount) || 0,
    guaranteeType: row.guarantee_type as GuaranteeType,
    status: row.status as RentalStatus,
    penaltyAmount: row.penalty_amount !== null ? Number(row.penalty_amount) : undefined,
    notes: row.notes || '',
    items: Array.isArray(row.items) ? row.items : [],
    totalQuantity: Number(row.total_quantity) || 1,
    createdAt: row.created_at,
  };
}

function mapCashMovement(row: any): CashMovement {
  return {
    id: row.id,
    storeId: row.store_id,
    userId: row.user_id,
    userName: row.user_name,
    type: row.type,
    amount: Number(row.amount) || 0,
    description: row.description,
    referenceId: row.reference_id || undefined,
    date: row.date,
    createdAt: row.created_at,
  };
}

export const db = {
  // STORES
  async getStores(): Promise<Store[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapStore);
  },

  async getStore(storeId: string): Promise<Store | undefined> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapStore(data) : undefined;
  },

  async createStore(params: {
    name: string;
    phone?: string;
    address?: string;
    currency?: string;
  }): Promise<Store> {
    const slug = params.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { data: existing } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (existing) {
      throw new Error(`Ya existe una sede con el identificador "${slug}".`);
    }

    const newStore = {
      id: 'store_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      name: params.name.trim(),
      slug,
      phone: params.phone || '',
      address: params.address || '',
      currency: params.currency || '$',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('stores').insert(newStore).select().single();
    if (error) throw error;
    return mapStore(data);
  },

  async updateStore(storeId: string, updates: Partial<Store>): Promise<Store> {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.currency !== undefined) payload.currency = updates.currency;
    if (updates.active !== undefined) payload.active = Boolean(updates.active);

    const { data, error } = await supabase
      .from('stores')
      .update(payload)
      .eq('id', storeId)
      .select()
      .single();
    if (error) throw error;
    return mapStore(data);
  },

  // USERS
  async getUsers(storeId?: string): Promise<User[]> {
    let query = supabase.from('users').select('*').order('created_at', { ascending: true });
    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapUser);
  },

  async getUserById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapUser(data) : undefined;
  },

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username.trim())
      .maybeSingle();
    if (error) throw error;
    return data ? mapUser(data) : undefined;
  },

  async authenticateUser(userId: string, pin: string): Promise<User> {
    const user = await this.getUserById(userId);
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

  async authenticateSuperadmin(username: string, password: string): Promise<User> {
    const cleanUsername = username.trim().toLowerCase();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'superadmin')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Usuario superadministrador no encontrado.');
    }
    const user = mapUser(data);
    if (user.active === false) {
      throw new Error('Esta cuenta de superadministrador está desactivada.');
    }
    if (!user.password || user.password !== password) {
      throw new Error('Contraseña de superadministrador incorrecta.');
    }
    return user;
  },

  async changeUserPin(userId: string, currentPin: string, newPin: string): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }
    if (user.pin !== currentPin) {
      throw new Error('El PIN actual es incorrecto.');
    }
    if (!/^\d{4}$/.test(newPin)) {
      throw new Error('El nuevo PIN debe contener exactamente 4 dígitos numéricos.');
    }

    const { data, error } = await supabase
      .from('users')
      .update({ pin: newPin })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return mapUser(data);
  },

  async resetUserPin(userId: string, newPin: string): Promise<User> {
    if (!/^\d{4}$/.test(newPin)) {
      throw new Error('El nuevo PIN debe contener exactamente 4 dígitos numéricos.');
    }

    const { data, error } = await supabase
      .from('users')
      .update({ pin: newPin })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return mapUser(data);
  },

  async createUser(params: {
    creatorRole: UserRole;
    storeId?: string;
    name: string;
    username: string;
    role: UserRole;
    password?: string;
    pin?: string;
  }): Promise<User> {
    if (params.role === 'dueno' && params.creatorRole !== 'superadmin') {
      throw new Error('Solo el Superadministrador puede registrar Dueños de sede.');
    }
    if (params.role === 'superadmin' && params.creatorRole !== 'superadmin') {
      throw new Error('No se pueden registrar cuentas de superadministrador adicionales.');
    }
    if (params.role !== 'superadmin') {
      if (!params.storeId) {
        throw new Error('Debes asignar una sede al usuario.');
      }
    }

    const cleanUsername = params.username.trim().toLowerCase();
    const existing = await this.getUserByUsername(cleanUsername);
    if (existing) {
      throw new Error(`El nombre de usuario "${cleanUsername}" ya está en uso.`);
    }

    const pin = params.pin ? params.pin.trim() : '1234';
    if (!/^\d{4}$/.test(pin)) {
      throw new Error('El PIN debe tener exactamente 4 dígitos numéricos.');
    }

    const newUser = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      store_id: params.storeId || null,
      name: params.name.trim(),
      username: cleanUsername,
      role: params.role,
      password: params.password || null,
      pin,
      active: true,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('users').insert(newUser).select().single();
    if (error) throw error;
    return mapUser(data);
  },

  async updateUser(
    userId: string,
    updates: { name?: string; active?: boolean; storeId?: string }
  ): Promise<User> {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.active !== undefined) payload.active = updates.active;
    if (updates.storeId !== undefined) payload.store_id = updates.storeId;

    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return mapUser(data);
  },

  async deleteUser(userId: string): Promise<boolean> {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
    return true;
  },

  // PRODUCTS
  async getProducts(storeId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapProduct);
  },

  async getProduct(storeId: string, productId: string): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .eq('id', productId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapProduct(data) : undefined;
  },

  async addProduct(
    storeId: string,
    params: Omit<
      Product,
      'id' | 'storeId' | 'rentedCount' | 'soldCount' | 'availableStock' | 'createdAt'
    >
  ): Promise<Product> {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId)
      .eq('code', params.code.trim())
      .maybeSingle();

    if (existing) {
      throw new Error(`Ya existe un producto con el código "${params.code}".`);
    }

    const stockTotal = Number(params.stockTotal) || 0;
    const newProduct = {
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      store_id: storeId,
      code: params.code.trim(),
      name: params.name.trim(),
      category: params.category,
      gender: params.gender,
      size: params.size,
      purchase_cost: Number(params.purchaseCost) || 0,
      rental_price: Number(params.rentalPrice) || 0,
      sale_price: Number(params.salePrice) || 0,
      stock_total: stockTotal,
      rented_count: 0,
      sold_count: 0,
      available_stock: stockTotal,
      notes: params.notes || '',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('products').insert(newProduct).select().single();
    if (error) throw error;
    return mapProduct(data);
  },

  async updateProduct(
    storeId: string,
    productId: string,
    updates: Partial<Product>
  ): Promise<Product> {
    const current = await this.getProduct(storeId, productId);
    if (!current) {
      throw new Error('Producto no encontrado.');
    }

    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.gender !== undefined) payload.gender = updates.gender;
    if (updates.size !== undefined) payload.size = updates.size;
    if (updates.purchaseCost !== undefined) payload.purchase_cost = Number(updates.purchaseCost);
    if (updates.rentalPrice !== undefined) payload.rental_price = Number(updates.rentalPrice);
    if (updates.salePrice !== undefined) payload.sale_price = Number(updates.salePrice);
    if (updates.notes !== undefined) payload.notes = updates.notes;

    if (updates.stockTotal !== undefined) {
      const newTotal = Number(updates.stockTotal);
      payload.stock_total = newTotal;
      payload.available_stock = Math.max(0, newTotal - current.rentedCount - current.soldCount);
    }

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .eq('store_id', storeId)
      .select()
      .single();
    if (error) throw error;
    return mapProduct(data);
  },

  async deleteProduct(storeId: string, productId: string): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('store_id', storeId);
    if (error) throw error;
    return true;
  },

  async restockProduct(
    storeId: string,
    params: {
      productId: string;
      quantity: number;
      purchaseCost: number;
      userId?: string;
      userName?: string;
    }
  ): Promise<{ product: Product; movement: CashMovement }> {
    const prod = await this.getProduct(storeId, params.productId);
    if (!prod) {
      throw new Error('Producto no encontrado.');
    }

    const newTotal = prod.stockTotal + params.quantity;
    const newAvailable = Math.max(0, newTotal - prod.rentedCount - prod.soldCount);

    const { data: updatedProd, error: pErr } = await supabase
      .from('products')
      .update({
        stock_total: newTotal,
        available_stock: newAvailable,
        purchase_cost: params.purchaseCost,
      })
      .eq('id', params.productId)
      .eq('store_id', storeId)
      .select()
      .single();
    if (pErr) throw pErr;

    const totalCost = params.purchaseCost * params.quantity;
    const movement = {
      id: 'mov_' + Date.now(),
      store_id: storeId,
      user_id: params.userId || 'dueño',
      user_name: params.userName || 'Dueño de Tienda',
      type: 'egreso_compra',
      amount: totalCost,
      description: `Reabastecimiento: +${params.quantity}x ${prod.name} [${prod.size}] a $${params.purchaseCost} c/u`,
      reference_id: prod.id,
      date: getTodayString(),
      created_at: new Date().toISOString(),
    };

    const { data: newMov, error: mErr } = await supabase
      .from('cash_movements')
      .insert(movement)
      .select()
      .single();
    if (mErr) throw mErr;

    return { product: mapProduct(updatedProd), movement: mapCashMovement(newMov) };
  },

  // CLIENTS
  async getClients(storeId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('store_id', storeId)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapClient);
  },

  async getClient(storeId: string, clientId: string): Promise<Client | undefined> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('store_id', storeId)
      .eq('id', clientId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapClient(data) : undefined;
  },

  async addClient(
    storeId: string,
    params: Omit<Client, 'id' | 'storeId' | 'createdAt'>
  ): Promise<Client> {
    const newClient = {
      id: 'cli_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      store_id: storeId,
      name: params.name.trim(),
      phone: params.phone.trim(),
      dni: params.dni?.trim() || '',
      email: params.email?.trim() || '',
      address: params.address?.trim() || '',
      notes: params.notes || '',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('clients').insert(newClient).select().single();
    if (error) throw error;
    return mapClient(data);
  },

  // RENTALS
  async getRentals(storeId: string): Promise<Rental[]> {
    const { data, error } = await supabase
      .from('rentals')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRental);
  },

  async getRental(storeId: string, rentalId: string): Promise<Rental | undefined> {
    const { data, error } = await supabase
      .from('rentals')
      .select('*')
      .eq('store_id', storeId)
      .eq('id', rentalId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapRental(data) : undefined;
  },

  async createRental(
    storeId: string,
    params: {
      productId?: string;
      clientId: string;
      userId: string;
      userName: string;
      rentalDate?: string;
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
  ): Promise<{ rental: Rental; movement: CashMovement }> {
    const client = await this.getClient(storeId, params.clientId);
    if (!client) {
      throw new Error('Cliente no encontrado.');
    }

    let rentalItems: RentalItem[] =
      params.items && params.items.length > 0 ? [...params.items] : [];

    if (rentalItems.length === 0 && params.productId) {
      const prod = await this.getProduct(storeId, params.productId);
      if (prod) {
        rentalItems.push({
          productId: prod.id,
          productName: prod.name,
          productCode: prod.code,
          productSize: prod.size,
          quantity: 1,
          unitPrice: prod.rentalPrice,
          subtotal: prod.rentalPrice,
        });
      }
    }

    if (rentalItems.length === 0) {
      throw new Error('Debes seleccionar al menos un disfraz para registrar el alquiler.');
    }

    // Verify and decrement availableStock
    for (const item of rentalItems) {
      const prod = await this.getProduct(storeId, item.productId);
      if (!prod) {
        throw new Error(`Disfraz "${item.productName}" no encontrado.`);
      }
      if (prod.availableStock < item.quantity) {
        throw new Error(
          `Stock insuficiente para "${prod.name}". Disponibles: ${prod.availableStock}, solicitadas: ${item.quantity}.`
        );
      }
      await supabase
        .from('products')
        .update({
          rented_count: prod.rentedCount + item.quantity,
          available_stock: Math.max(0, prod.availableStock - item.quantity),
        })
        .eq('id', prod.id)
        .eq('store_id', storeId);
    }

    const grossSubtotal = rentalItems.reduce(
      (s, it) => s + (it.subtotal ?? it.unitPrice * it.quantity),
      0
    );
    const discount = Math.max(0, Number(params.discount) || 0);
    let finalRentalPrice =
      params.rentalPrice !== undefined ? Number(params.rentalPrice) : Math.max(0, grossSubtotal - discount);

    if (finalRentalPrice <= 0 && grossSubtotal > 0 && discount === 0) {
      finalRentalPrice = grossSubtotal;
    }

    const totalGarments = rentalItems.reduce((s, it) => s + it.quantity, 0);

    const { count } = await supabase
      .from('rentals')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);

    const ticketCode = `ALQ-${1001 + (count || 0)}`;

    const rentalRow = {
      id: 'rent_' + Date.now(),
      store_id: storeId,
      ticket_code: ticketCode,
      product_id: rentalItems[0].productId,
      product_name: rentalItems[0].productName,
      product_code: rentalItems[0].productCode,
      product_size: rentalItems[0].productSize,
      client_id: client.id,
      client_name: client.name,
      client_phone: client.phone,
      client_dni: client.dni || '',
      user_id: params.userId,
      user_name: params.userName,
      rental_date: params.rentalDate || getTodayString(),
      due_date: params.dueDate,
      rental_price: finalRentalPrice,
      subtotal: grossSubtotal,
      discount: discount,
      guarantee_amount: Number(params.guaranteeAmount) || 0,
      guarantee_type: params.guaranteeType,
      status: 'activo',
      notes: params.notes || '',
      items: rentalItems,
      total_quantity: totalGarments,
      created_at: new Date().toISOString(),
    };

    const { data: newRental, error: rErr } = await supabase
      .from('rentals')
      .insert(rentalRow)
      .select()
      .single();
    if (rErr) throw rErr;

    const movementRow = {
      id: 'mov_' + Date.now(),
      store_id: storeId,
      user_id: params.userId,
      user_name: params.userName,
      type: 'ingreso_alquiler',
      amount: finalRentalPrice,
      description: `Alquiler ${ticketCode}: ${rentalItems[0].productName}${
        rentalItems.length > 1 ? ` (+${rentalItems.length - 1} trajes)` : ''
      } (${totalGarments} prendas) a ${client.name}${
        discount > 0 ? ` (Descuento de $${discount.toFixed(2)} aplicado)` : ''
      }`,
      reference_id: newRental.id,
      date: getTodayString(),
      created_at: new Date().toISOString(),
    };

    const { data: newMov, error: mErr } = await supabase
      .from('cash_movements')
      .insert(movementRow)
      .select()
      .single();
    if (mErr) throw mErr;

    return { rental: mapRental(newRental), movement: mapCashMovement(newMov) };
  },

  async returnRental(
    storeId: string,
    params: {
      rentalId: string;
      penaltyAmount?: number;
      returnNotes?: string;
      userId: string;
      userName: string;
    }
  ): Promise<{ rental: Rental; movement?: CashMovement }> {
    const rental = await this.getRental(storeId, params.rentalId);
    if (!rental) {
      throw new Error('Alquiler no encontrado.');
    }
    if (rental.status === 'devuelto') {
      throw new Error('Este alquiler ya fue devuelto.');
    }

    const items =
      rental.items && rental.items.length > 0
        ? rental.items
        : [
            {
              productId: rental.productId,
              productName: rental.productName,
              productCode: rental.productCode,
              productSize: rental.productSize,
              quantity: 1,
              unitPrice: rental.rentalPrice,
            },
          ];

    for (const it of items) {
      const prod = await this.getProduct(storeId, it.productId);
      if (prod) {
        const newRented = Math.max(0, prod.rentedCount - it.quantity);
        const newAvailable = Math.max(0, prod.stockTotal - newRented - prod.soldCount);
        await supabase
          .from('products')
          .update({
            rented_count: newRented,
            available_stock: newAvailable,
          })
          .eq('id', prod.id)
          .eq('store_id', storeId);
      }
    }

    const today = getTodayString();
    const penaltyAmount = Number(params.penaltyAmount) || 0;
    const combinedNotes = params.returnNotes
      ? rental.notes
        ? `${rental.notes} | Dev.: ${params.returnNotes}`
        : params.returnNotes
      : rental.notes;

    const { data: updatedRental, error: rErr } = await supabase
      .from('rentals')
      .update({
        status: 'devuelto',
        return_date: today,
        penalty_amount: penaltyAmount,
        notes: combinedNotes,
      })
      .eq('id', params.rentalId)
      .eq('store_id', storeId)
      .select()
      .single();
    if (rErr) throw rErr;

    let movement: CashMovement | undefined = undefined;
    if (penaltyAmount > 0) {
      const movementRow = {
        id: 'mov_' + Date.now(),
        store_id: storeId,
        user_id: params.userId,
        user_name: params.userName,
        type: 'ingreso_alquiler',
        amount: penaltyAmount,
        description: `Penalidad por mora/daños en ${rental.ticketCode} (${rental.clientName})`,
        reference_id: rental.id,
        date: today,
        created_at: new Date().toISOString(),
      };
      const { data: newMov, error: mErr } = await supabase
        .from('cash_movements')
        .insert(movementRow)
        .select()
        .single();
      if (mErr) throw mErr;
      movement = mapCashMovement(newMov);
    }

    return { rental: mapRental(updatedRental), movement };
  },

  // SALES
  async recordSale(
    storeId: string,
    params: {
      productId: string;
      clientId?: string;
      quantity: number;
      salePrice: number;
      discount?: number;
      notes?: string;
      userId: string;
      userName: string;
    }
  ): Promise<{ product: Product; movement: CashMovement }> {
    const prod = await this.getProduct(storeId, params.productId);
    if (!prod) {
      throw new Error('Producto no encontrado.');
    }
    if (prod.availableStock < params.quantity) {
      throw new Error(
        `Stock insuficiente. Disponibles para venta: ${prod.availableStock}, solicitadas: ${params.quantity}.`
      );
    }

    const newSold = prod.soldCount + params.quantity;
    const newAvailable = Math.max(0, prod.availableStock - params.quantity);

    const { data: updatedProd, error: pErr } = await supabase
      .from('products')
      .update({
        sold_count: newSold,
        available_stock: newAvailable,
      })
      .eq('id', params.productId)
      .eq('store_id', storeId)
      .select()
      .single();
    if (pErr) throw pErr;

    let clientName = 'Mostrador (Cliente anónimo)';
    if (params.clientId) {
      const client = await this.getClient(storeId, params.clientId);
      if (client) clientName = client.name;
    }

    const grossSubtotal = params.salePrice * params.quantity;
    const discount = Math.max(0, Number(params.discount) || 0);
    const totalAmount = Math.max(0, grossSubtotal - discount);

    const movementRow = {
      id: 'mov_' + Date.now(),
      store_id: storeId,
      user_id: params.userId,
      user_name: params.userName,
      type: 'ingreso_venta',
      amount: totalAmount,
      description: `Venta directa de ${params.quantity}x ${prod.name} [${prod.size}] a ${clientName}${
        discount > 0 ? ` (Subtotal $${grossSubtotal.toFixed(2)} - Dto. $${discount.toFixed(2)})` : ''
      }`,
      reference_id: prod.id,
      date: getTodayString(),
      created_at: new Date().toISOString(),
    };

    const { data: newMov, error: mErr } = await supabase
      .from('cash_movements')
      .insert(movementRow)
      .select()
      .single();
    if (mErr) throw mErr;

    return { product: mapProduct(updatedProd), movement: mapCashMovement(newMov) };
  },

  // CASH MOVEMENTS
  async getCashMovements(storeId: string): Promise<CashMovement[]> {
    const { data, error } = await supabase
      .from('cash_movements')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapCashMovement);
  },

  // DASHBOARD METRICS
  async getDashboardMetrics(storeId: string): Promise<DashboardMetrics> {
    const today = getTodayString();
    const [products, rentals, movements] = await Promise.all([
      this.getProducts(storeId),
      this.getRentals(storeId),
      this.getCashMovements(storeId),
    ]);

    const totalInventoryCost = products.reduce((sum, p) => {
      const currentOwnedUnits = Math.max(0, p.stockTotal - p.soldCount);
      return sum + p.purchaseCost * currentOwnedUnits;
    }, 0);

    const totalRentalRevenue = movements
      .filter((m) => m.type === 'ingreso_alquiler')
      .reduce((sum, m) => sum + m.amount, 0);

    const totalSalesRevenue = movements
      .filter((m) => m.type === 'ingreso_venta')
      .reduce((sum, m) => sum + m.amount, 0);

    const totalRevenue = totalRentalRevenue + totalSalesRevenue;

    const totalExpenses = movements
      .filter((m) => m.type === 'egreso_compra' || m.type === 'egreso_gasto')
      .reduce((sum, m) => sum + m.amount, 0);

    const estimatedNetProfit = totalRevenue - totalExpenses;

    const activeRentals = rentals.filter((r) => r.status !== 'devuelto');
    const overdueRentals = activeRentals.filter((r) => r.dueDate < today);
    const dueTodayRentals = activeRentals.filter((r) => r.dueDate === today);

    const heldGuarantees = activeRentals
      .filter((r) => r.guaranteeType === 'efectivo' || r.guaranteeType === 'efectivo_y_documento')
      .reduce((sum, r) => sum + (r.guaranteeAmount || 0), 0);

    const totalAvailableStock = products.reduce((sum, p) => sum + p.availableStock, 0);

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
      totalCatalogCount: products.length,
    };
  },
};
