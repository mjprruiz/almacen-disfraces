'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Product, Client, RentalItem, GuaranteeType } from '@/lib/types';
import {
  X,
  Search,
  Calendar,
  DollarSign,
  Sparkles,
  User,
  AlertCircle,
  ChevronDown,
  UserPlus,
  Plus,
  Trash2,
  Package,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface NewRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  clients: Client[];
  onOpenNewClient: () => void;
  onSubmit: (data: {
    productId?: string;
    clientId: string;
    dueDate: string;
    rentalPrice: number;
    subtotal?: number;
    discount?: number;
    guaranteeAmount: number;
    guaranteeType: GuaranteeType;
    notes: string;
    items?: RentalItem[];
    totalQuantity?: number;
  }) => Promise<void>;
}

export const NewRentalModal: React.FC<NewRentalModalProps> = ({
  isOpen,
  onClose,
  products,
  clients,
  onOpenNewClient,
  onSubmit,
}) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  // Candidate product selector for adding to items
  const [candidateProductId, setCandidateProductId] = useState('');
  const [candidateQuantity, setCandidateQuantity] = useState<number>(1);
  const [candidatePrice, setCandidatePrice] = useState<number>(0);
  const [productSearch, setProductSearch] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  // Cart / Items list for group or multi-item rentals
  const [items, setItems] = useState<RentalItem[]>([]);

  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // Default 2 days rental
    return d.toISOString().split('T')[0];
  });
  const [rentalPrice, setRentalPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [guaranteeAmount, setGuaranteeAmount] = useState<number>(0);

  // Checkbox states for Respaldo / Garantía
  const [hasCashGuarantee, setHasCashGuarantee] = useState<boolean>(false);
  const [hasDniGuarantee, setHasDniGuarantee] = useState<boolean>(true);
  const [isSinGarantia, setIsSinGarantia] = useState<boolean>(false);

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Subtotal bruto calculado dinámicamente
  const candidateProduct = products.find((p) => p.id === candidateProductId);
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const grossSubtotal = useMemo(() => {
    if (items.length > 0) {
      return items.reduce((s, it) => s + (it.subtotal ?? (it.unitPrice * it.quantity)), 0);
    }
    if (candidateProduct) {
      return candidatePrice * candidateQuantity;
    }
    return 0;
  }, [items, candidateProduct, candidatePrice, candidateQuantity]);

  // Reset or initialize when modal opens (ensures clean state on every new rental)
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSelectedClientId('');
      setClientSearch('');
      setIsClientDropdownOpen(false);
      setItems([]);
      setCandidateProductId('');
      setCandidateQuantity(1);
      setCandidatePrice(0);
      setProductSearch('');
      setIsProductDropdownOpen(false);
      setDiscount(0);
      setRentalPrice(0);
      setGuaranteeAmount(0);
      setHasCashGuarantee(false);
      setHasDniGuarantee(true); // DNI en custodia es estándar por defecto
      setIsSinGarantia(false);
      setNotes('');
      const d = new Date();
      d.setDate(d.getDate() + 2);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  // Recalculate rental price and guarantee when items, candidate or discount change
  useEffect(() => {
    const net = Math.max(0, grossSubtotal - discount);
    setRentalPrice(net);
    if (hasCashGuarantee && (guaranteeAmount === 0 || guaranteeAmount === grossSubtotal)) {
      setGuaranteeAmount(grossSubtotal);
    }
  }, [grossSubtotal, discount, hasCashGuarantee]);

  // 1. Productos ordenados alfabéticamente y filtrados
  const sortedAndFilteredProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));
    if (!productSearch.trim()) return sorted;
    const q = productSearch.toLowerCase();
    return sorted.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.size.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  // 2. Clientes ordenados alfabéticamente y filtrados
  const sortedAndFilteredClients = useMemo(() => {
    const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name));
    if (!clientSearch.trim()) return sorted;
    const q = clientSearch.toLowerCase();
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.dni && c.dni.includes(q))
    );
  }, [clients, clientSearch]);

  if (!isOpen) return null;

  const handleSelectProduct = (prod: Product) => {
    if (prod.availableStock <= 0) return;
    setCandidateProductId(prod.id);
    setCandidatePrice(prod.rentalPrice);
    setCandidateQuantity(1);
    setIsProductDropdownOpen(false);
    setProductSearch('');
  };

  const handleAddItemToRental = () => {
    if (!candidateProduct) return;
    if (candidateQuantity <= 0) {
      setError('La cantidad debe ser de al menos 1 unidad');
      return;
    }

    const available = candidateProduct.availableStock;
    const existingIndex = items.findIndex((it) => it.productId === candidateProduct.id);
    const currentInCart = existingIndex >= 0 ? items[existingIndex].quantity : 0;

    if (currentInCart + candidateQuantity > available) {
      setError(
        `Solo hay ${available} unidad(es) disponible(s) para "${candidateProduct.name}". Ya tienes ${currentInCart} en la lista.`
      );
      return;
    }

    setError('');

    if (existingIndex >= 0) {
      // Update existing item
      const updated = [...items];
      const newQty = updated[existingIndex].quantity + candidateQuantity;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        unitPrice: candidatePrice,
        subtotal: newQty * candidatePrice,
      };
      setItems(updated);
    } else {
      // Add new item
      const newItem: RentalItem = {
        productId: candidateProduct.id,
        productName: candidateProduct.name,
        productCode: candidateProduct.code,
        productSize: candidateProduct.size,
        quantity: candidateQuantity,
        unitPrice: candidatePrice,
        subtotal: candidateQuantity * candidatePrice,
      };
      setItems([...items, newItem]);
    }

    // Reset candidate
    setCandidateProductId('');
    setCandidateQuantity(1);
    setCandidatePrice(0);
    setProductSearch('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    const item = items[index];
    const prod = products.find((p) => p.id === item.productId);
    const available = prod ? prod.availableStock : item.quantity;

    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }

    if (newQty > available) {
      setError(`Stock máximo disponible para "${item.productName}": ${available}`);
      return;
    }

    setError('');
    const updated = [...items];
    updated[index] = {
      ...item,
      quantity: newQty,
      subtotal: newQty * item.unitPrice,
    };
    setItems(updated);
  };

  const handleSelectClient = (cli: Client) => {
    setSelectedClientId(cli.id);
    setIsClientDropdownOpen(false);
    setClientSearch('');
  };

  const handleSetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];

    if (!selectedClientId) {
      setError('Debes seleccionar un cliente');
      return;
    }
    if (!dueDate) {
      setError('Debes especificar la fecha pactada de devolución');
      return;
    }
    if (dueDate < todayStr) {
      setError('La fecha pactada de devolución no puede ser anterior a la fecha de hoy');
      return;
    }

    // Prepare final items
    let finalItems = [...items];
    // If user selected a costume but didn't click "Agregar", auto-include it!
    if (finalItems.length === 0 && candidateProduct) {
      if (candidateQuantity > candidateProduct.availableStock) {
        setError(`Stock insuficiente. Solo hay ${candidateProduct.availableStock} disponible(s).`);
        return;
      }
      finalItems = [
        {
          productId: candidateProduct.id,
          productName: candidateProduct.name,
          productCode: candidateProduct.code,
          productSize: candidateProduct.size,
          quantity: candidateQuantity,
          unitPrice: candidatePrice,
          subtotal: candidateQuantity * candidatePrice,
        },
      ];
    }

    if (finalItems.length === 0) {
      setError('Debes seleccionar al menos un disfraz para registrar el alquiler');
      return;
    }

    const totalGarments = finalItems.reduce((s, it) => s + it.quantity, 0);

    const resolvedGuaranteeType: GuaranteeType =
      hasCashGuarantee && hasDniGuarantee
        ? 'efectivo_y_documento'
        : hasCashGuarantee
        ? 'efectivo'
        : hasDniGuarantee
        ? 'documento'
        : 'ninguna';

    const finalGuaranteeAmount = hasCashGuarantee ? Number(guaranteeAmount) : 0;

    const subtotal = finalItems.reduce((s, it) => s + (it.subtotal ?? (it.unitPrice * it.quantity)), 0);
    let finalPrice = rentalPrice > 0 ? Number(rentalPrice) : Math.max(0, subtotal - discount);
    if (finalPrice <= 0 && subtotal > 0 && discount === 0) {
      finalPrice = subtotal;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        productId: finalItems[0].productId,
        clientId: selectedClientId,
        dueDate,
        rentalPrice: finalPrice,
        subtotal,
        discount: Number(discount) || 0,
        guaranteeAmount: finalGuaranteeAmount,
        guaranteeType: resolvedGuaranteeType,
        notes,
        items: finalItems,
        totalQuantity: totalGarments,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el alquiler');
    } finally {
      setLoading(false);
    }
  };

  const totalGarmentsCount = items.reduce((s, it) => s + it.quantity, 0) + (items.length === 0 && candidateProduct ? candidateQuantity : 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Registrar Nuevo Alquiler</h2>
              <p className="text-xs text-purple-200/80">Alquileres individuales y grupales (colegios, promociones)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-200 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* 1. SELECCIÓN DE CLIENTE */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                1. Cliente Responsable * (A-Z)
              </label>
              <button
                type="button"
                onClick={onOpenNewClient}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 mr-0.5" />
                <span>Crear Nuevo Cliente</span>
              </button>
            </div>

            {selectedClient ? (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    {selectedClient.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tel: <strong>{selectedClient.phone}</strong> {selectedClient.dni ? `• DNI: ${selectedClient.dni}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientId('');
                    setIsClientDropdownOpen(true);
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Escribe nombre, teléfono o DNI del cliente..."
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setIsClientDropdownOpen(true);
                    }}
                    onFocus={() => setIsClientDropdownOpen(true)}
                    className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none"
                  />
                  <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>

                {isClientDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                    {sortedAndFilteredClients.length === 0 ? (
                      <div className="p-4 text-center space-y-2">
                        <p className="text-xs text-slate-500">No se encontró a ningún cliente con "{clientSearch}".</p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsClientDropdownOpen(false);
                            onOpenNewClient();
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          + Registrar a "{clientSearch}" ahora
                        </button>
                      </div>
                    ) : (
                      sortedAndFilteredClients.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectClient(c)}
                          className="p-3 text-xs hover:bg-blue-50 cursor-pointer transition flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{c.name}</span>
                            <span className="text-[11px] text-slate-500 block">
                              Tel: {c.phone} {c.dni ? `• DNI: ${c.dni}` : ''}
                            </span>
                          </div>
                          <span className="text-[10px] text-purple-600 font-semibold">Seleccionar</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. SELECTOR DE DISFRACES & AGREGADOR AL PEDIDO */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center">
                <Layers className="w-3.5 h-3.5 mr-1 text-purple-600" />
                2. Selección de Disfraces (Individual o Grupal)
              </label>
              <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                Añade 1 o más trajes
              </span>
            </div>

            {/* Buscador de Producto */}
            {!candidateProduct ? (
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar disfraz por nombre, código (DISF001) o talla (M, L)..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setIsProductDropdownOpen(true);
                    }}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>

                {isProductDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                    {sortedAndFilteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No se encontraron disfraces con "{productSearch}".
                      </div>
                    ) : (
                      sortedAndFilteredProducts.map((p) => {
                        const isAvailable = p.availableStock > 0;
                        return (
                          <div
                            key={p.id}
                            onClick={() => isAvailable && handleSelectProduct(p)}
                            className={`p-2.5 text-xs flex items-center justify-between transition ${
                              isAvailable
                                ? 'hover:bg-purple-50 cursor-pointer'
                                : 'opacity-40 bg-slate-50 cursor-not-allowed'
                            }`}
                          >
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                  {p.code}
                                </span>
                                <span className="font-bold text-slate-800">{p.name}</span>
                                <span className="text-[10px] text-slate-500">[{p.size}]</span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {p.category} • Precio base: ${p.rentalPrice}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isAvailable
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {isAvailable ? `${p.availableStock} disp.` : 'AGOTADO'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Disfraz candidato seleccionado para agregar */
              <div className="bg-white border-2 border-purple-200 rounded-xl p-3 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                        {candidateProduct.code}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs">{candidateProduct.name}</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Talla: <strong>{candidateProduct.size}</strong> • {candidateProduct.category} • Disponibles en tienda: <strong className="text-emerald-700">{candidateProduct.availableStock}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCandidateProductId('')}
                    className="text-slate-400 hover:text-red-600 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 transition"
                  >
                    Cambiar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Cantidad a alquilar:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={candidateProduct.availableStock}
                      value={candidateQuantity}
                      onChange={(e) => setCandidateQuantity(Math.max(1, Math.min(candidateProduct.availableStock, Number(e.target.value))))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Precio Unitario ($):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={candidatePrice}
                      onChange={(e) => setCandidatePrice(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItemToRental}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar al Pedido</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TABLA / LISTA DE PRENDAS AGREGADAS */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <Package className="w-3 h-3 mr-1 text-purple-600" />
                  Prendas en este Alquiler ({items.length})
                </span>
                {items.length > 0 && (
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    {items.reduce((s, it) => s + it.quantity, 0)} prendas en total
                  </span>
                )}
              </div>

              {items.length === 0 ? (
                <div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl text-center text-slate-400 text-xs">
                  {candidateProduct ? (
                    <span className="text-purple-700 font-medium">
                      💡 Haz clic en <strong>"+ Agregar al Pedido"</strong> o pulsa Confirmar abajo para alquilar este disfraz.
                    </span>
                  ) : (
                    'No hay disfraces agregados aún. Busca un disfraz arriba y agrégalo.'
                  )}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                  {items.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/60 transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                            {it.productCode}
                          </span>
                          <span className="font-bold text-slate-900 truncate">{it.productName}</span>
                          <span className="text-[10px] text-slate-500">[{it.productSize}]</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          ${it.unitPrice.toFixed(2)} c/u
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(idx, it.quantity - 1)}
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs w-6 text-center text-slate-800">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(idx, it.quantity + 1)}
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="w-16 text-right font-bold text-slate-900">
                        ${(it.subtotal ?? (it.unitPrice * it.quantity)).toFixed(2)}
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-300 hover:text-red-600 p-1 rounded transition cursor-pointer"
                        title="Quitar prenda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. FECHA PACTADA DE DEVOLUCIÓN */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Fecha Pactada de Devolución *
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white transition outline-none"
                required
              />
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => handleSetDays(2)}
                  className="px-2.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 rounded-lg transition cursor-pointer"
                >
                  2 días
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDays(3)}
                  className="px-2.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 rounded-lg transition cursor-pointer"
                >
                  3 días
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDays(7)}
                  className="px-2.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 rounded-lg transition cursor-pointer"
                >
                  1 sem
                </button>
              </div>
            </div>
          </div>

          {/* 4. TOTALES FINANCIEROS Y RESPALDO / GARANTÍA */}
          <div className="space-y-3 pt-1">
            {/* Resumen Financiero: Subtotal, Descuento y Total Alquiler */}
            <div className="bg-purple-50/50 border border-purple-200/80 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                  4. Liquidación del Alquiler (A Pagar) *
                </label>
                {discount > 0 && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    Descuento de ${discount.toFixed(2)} aplicado
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Subtotal Prendas */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Subtotal Prendas ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      value={grossSubtotal.toFixed(2)}
                      readOnly
                      disabled
                      className="w-full pl-6 pr-2 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Descuento */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Descuento ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      max={grossSubtotal}
                      step="0.5"
                      placeholder="0.00"
                      value={discount || ''}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setDiscount(Math.min(val, grossSubtotal));
                      }}
                      className="w-full pl-6 pr-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-amber-700 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                {/* Total Alquiler a Pagar */}
                <div>
                  <label className="block text-[10px] font-semibold text-purple-900 mb-1">
                    Total a Pagar ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-purple-600 font-bold text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={rentalPrice}
                      onChange={(e) => setRentalPrice(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-6 pr-2 py-2 bg-white border-2 border-purple-500 rounded-xl text-xs font-black text-purple-950 focus:ring-2 focus:ring-purple-500 outline-none shadow-2xs"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Opciones de Respaldo / Garantía (Checkboxes) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-600" />
                  Respaldo / Garantía de Devolución
                </label>
                <span className="text-[10px] text-slate-500">Puedes marcar una o ambas opciones</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Checkbox 1: Efectivo retenido */}
                <div className={`p-3 rounded-xl border transition ${hasCashGuarantee ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-slate-200'}`}>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasCashGuarantee}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setHasCashGuarantee(checked);
                        if (checked) {
                          setIsSinGarantia(false);
                          if (guaranteeAmount === 0) setGuaranteeAmount(rentalPrice);
                        } else {
                          setGuaranteeAmount(0);
                          if (!hasDniGuarantee) setIsSinGarantia(true);
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-slate-800">Efectivo retenido ($)</span>
                  </label>

                  {hasCashGuarantee && (
                    <div className="mt-2 pl-6">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={guaranteeAmount}
                          onChange={(e) => setGuaranteeAmount(Math.max(0, Number(e.target.value)))}
                          placeholder="Monto garantía..."
                          className="w-full pl-7 pr-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Dinero a devolver al retornar el disfraz</span>
                    </div>
                  )}
                </div>

                {/* Checkbox 2: DNI Físico retenido */}
                <div className={`p-3 rounded-xl border transition flex flex-col justify-center ${hasDniGuarantee ? 'bg-blue-50/70 border-blue-300' : 'bg-white border-slate-200'}`}>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasDniGuarantee}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setHasDniGuarantee(checked);
                        if (checked) {
                          setIsSinGarantia(false);
                        } else {
                          if (!hasCashGuarantee) setIsSinGarantia(true);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-800">DNI / Documento físico</span>
                      <span className="text-[10px] text-slate-500 block">Queda en custodia en la tienda</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Checkbox 3: Sin Garantía */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSinGarantia || (!hasCashGuarantee && !hasDniGuarantee)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsSinGarantia(checked);
                      if (checked) {
                        setHasCashGuarantee(false);
                        setHasDniGuarantee(false);
                        setGuaranteeAmount(0);
                      } else {
                        setHasDniGuarantee(true);
                      }
                    }}
                    className="w-3.5 h-3.5 text-slate-500 rounded focus:ring-slate-400 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Sin garantía requerida (Alquiler exonerado / De confianza)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observaciones (Opcional - Ej. Colegio, Salón de clases, Accesorios incluidos)
            </label>
            <input
              type="text"
              placeholder="Ej. Colegio San Agustín - 3er grado de primaria, incluye bandas y sombreros..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200 flex-shrink-0">
            <div className="text-xs text-slate-500">
              {totalGarmentsCount > 0 ? (
                <span className="font-semibold text-purple-900">
                  Total a entregar: <strong>{totalGarmentsCount} traje(s)</strong> • <strong>${rentalPrice}</strong>
                </span>
              ) : null}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || (!candidateProduct && items.length === 0) || !selectedClientId}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? 'Registrando...' : `Confirmar Alquiler (${totalGarmentsCount} prendas)`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
