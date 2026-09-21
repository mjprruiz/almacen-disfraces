'use client';

import React, { useState, useMemo } from 'react';
import { Product, Client } from '@/lib/types';
import {
  X,
  Search,
  DollarSign,
  ShoppingBag,
  User,
  AlertCircle,
  ChevronDown,
  UserPlus,
  PackageCheck,
} from 'lucide-react';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  clients: Client[];
  onOpenNewClient: () => void;
  onSubmit: (data: {
    productId: string;
    clientId?: string;
    quantity: number;
    salePrice: number;
    discount?: number;
    notes?: string;
  }) => Promise<void>;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen,
  onClose,
  products,
  clients,
  onOpenNewClient,
  onSubmit,
}) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  const [quantity, setQuantity] = useState<number>(1);
  const [salePrice, setSalePrice] = useState<number>(45);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Limpiar estado cada vez que se abre la ventana de nueva venta
  React.useEffect(() => {
    if (isOpen) {
      setSelectedProductId('');
      setSelectedClientId('');
      setProductSearch('');
      setClientSearch('');
      setIsProductDropdownOpen(false);
      setIsClientDropdownOpen(false);
      setQuantity(1);
      setSalePrice(45);
      setDiscount(0);
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  // 1. Productos ordenados A-Z y filtrados
  const sortedAndFilteredProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));
    if (!productSearch.trim()) return sorted;
    const q = productSearch.toLowerCase();
    return sorted.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.size.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  // 2. Clientes ordenados A-Z y filtrados
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

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  if (!isOpen) return null;

  const handleSelectProduct = (prod: Product) => {
    if (prod.availableStock <= 0) return;
    setSelectedProductId(prod.id);
    setSalePrice(prod.salePrice);
    setQuantity(1);
    setIsProductDropdownOpen(false);
    setProductSearch('');
  };

  const handleSelectClient = (cli: Client) => {
    setSelectedClientId(cli.id);
    setIsClientDropdownOpen(false);
    setClientSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError('Debes seleccionar un disfraz para la venta');
      return;
    }
    if (!selectedProduct) return;
    if (quantity < 1) {
      setError('La cantidad vendida debe ser al menos 1');
      return;
    }
    if (quantity > selectedProduct.availableStock) {
      setError(`Stock insuficiente. Solo hay ${selectedProduct.availableStock} unidades disponibles.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        productId: selectedProductId,
        clientId: selectedClientId || undefined,
        quantity: Number(quantity),
        salePrice: Number(salePrice),
        discount: Number(discount) || 0,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar la venta');
    } finally {
      setLoading(false);
    }
  };

  const subtotalSale = salePrice * quantity;
  const finalSaleAmount = Math.max(0, subtotalSale - discount);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Registrar Venta Directa</h2>
              <p className="text-xs text-emerald-200/80">Descuenta stock permanente e ingresa dinero a caja</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* 1. SELECCIÓN DE PRODUCTO A VENDER */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Disfraz o Prenda a Vender * (Ordenado A-Z)
            </label>

            {selectedProduct ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold bg-white text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-200">
                      {selectedProduct.code}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{selectedProduct.name}</h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Talla: <strong>{selectedProduct.size}</strong> • Disponibles para venta: <strong className="text-emerald-700">{selectedProduct.availableStock} unid.</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductId('');
                    setIsProductDropdownOpen(true);
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
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
                    placeholder="Escribe para buscar prenda a vender..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setIsProductDropdownOpen(true);
                    }}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                  <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>

                {isProductDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-100">
                    {sortedAndFilteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No se encontraron prendas con "{productSearch}".
                      </div>
                    ) : (
                      sortedAndFilteredProducts.map((p) => {
                        const isAvailable = p.availableStock > 0;
                        return (
                          <div
                            key={p.id}
                            onClick={() => isAvailable && handleSelectProduct(p)}
                            className={`p-3 text-xs flex items-center justify-between transition ${
                              isAvailable
                                ? 'hover:bg-emerald-50 cursor-pointer'
                                : 'opacity-40 bg-slate-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                  {p.code}
                                </span>
                                <span className="font-bold text-slate-800">{p.name}</span>
                                <span className="text-[10px] text-slate-500">[{p.size}]</span>
                              </div>
                              <span className="text-[11px] text-slate-500 block">
                                Precio Venta catálogo: <strong>${p.salePrice}</strong>
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
            )}
          </div>

          {/* 2. CLIENTE (OPCIONAL O REGISTRADO) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                2. Cliente (Opcional - Venta en Mostrador)
              </label>
              <button
                type="button"
                onClick={onOpenNewClient}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:underline flex items-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5 mr-0.5" />
                <span>+ Crear Cliente</span>
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
                    Tel: <strong>{selectedClient.phone}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientId('');
                    setIsClientDropdownOpen(true);
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                >
                  Quitar / Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente registrado o dejar en blanco para venta rápida..."
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setIsClientDropdownOpen(true);
                    }}
                    onFocus={() => setIsClientDropdownOpen(true)}
                    className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>

                {isClientDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                    <div
                      onClick={() => {
                        setSelectedClientId('');
                        setIsClientDropdownOpen(false);
                      }}
                      className="p-2.5 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer italic"
                    >
                      • Venta anónima de mostrador (sin asociar a cliente)
                    </div>
                    {sortedAndFilteredClients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectClient(c)}
                        className="p-2.5 text-xs hover:bg-blue-50 cursor-pointer transition flex items-center justify-between"
                      >
                        <span className="font-bold text-slate-800">{c.name}</span>
                        <span className="text-[11px] text-slate-500">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. CANTIDAD, PRECIO Y DESCUENTO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Cantidad a Vender *
              </label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.availableStock || 99}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
              {selectedProduct && (
                <span className="text-[10px] text-slate-500 block mt-1">
                  Máx: <strong>{selectedProduct.availableStock}</strong> disp.
                </span>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Precio Unitario ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={salePrice}
                  onChange={(e) => setSalePrice(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Descuento ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  max={subtotalSale}
                  step="0.5"
                  placeholder="0.00"
                  value={discount || ''}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    setDiscount(Math.min(val, subtotalSale));
                  }}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-2xl text-xs font-bold text-amber-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              {discount > 0 && (
                <span className="text-[10px] text-amber-600 block mt-1 font-semibold">
                  -${discount.toFixed(2)} dto.
                </span>
              )}
            </div>
          </div>

          {/* Resumen Total */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total a Cobrar</span>
                <span className="text-xs text-emerald-950">
                  {quantity} x ${salePrice} {discount > 0 ? `(-$${discount.toFixed(2)} dto.)` : ''}
                </span>
              </div>
            </div>
            <div className="text-right">
              {discount > 0 && (
                <span className="text-xs text-slate-400 line-through block font-mono">
                  ${subtotalSale.toFixed(2)}
                </span>
              )}
              <span className="text-2xl font-black text-emerald-700">${finalSaleAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observaciones (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Pago con transferencia, para colegio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Botones */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedProductId}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg hover:from-emerald-700 hover:to-teal-800 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Procesando Venta...' : 'Confirmar y Cobrar Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
