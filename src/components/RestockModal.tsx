'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { X, PackagePlus, DollarSign, AlertCircle, TrendingUp, Info } from 'lucide-react';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSubmit: (params: {
    productId: string;
    quantity: number;
    purchaseCost: number;
    notes?: string;
  }) => Promise<void>;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  product,
  onSubmit,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [purchaseCost, setPurchaseCost] = useState<number>(20);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setPurchaseCost(product.purchaseCost);
      setQuantity(1);
      setNotes('');
      setError('');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const totalCost = (quantity * purchaseCost).toFixed(2);
  const isDifferentCost = purchaseCost !== product.purchaseCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1) {
      setError('La cantidad a ingresar debe ser al menos 1');
      return;
    }
    if (purchaseCost < 0) {
      setError('El costo de compra no puede ser negativo');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        productId: product.id,
        quantity: Number(quantity),
        purchaseCost: Number(purchaseCost),
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al reabastecer stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <PackagePlus className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Ingresar / Reabastecer Stock</h2>
              <p className="text-xs text-amber-200/80">Registrar nueva compra sin duplicar el disfraz</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition"
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
          
          {/* Card del Disfraz actual */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold bg-white text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                {product.code}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Talla: <strong className="text-slate-700">{product.size}</strong> • {product.category}
              </span>
            </div>

            <h4 className="font-bold text-slate-900 text-sm">{product.name}</h4>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60 text-slate-600">
              <span>Stock actual disponible: <strong className="text-emerald-700">{product.availableStock} unid.</strong></span>
              <span>Último costo: <strong>${product.purchaseCost}</strong></span>
            </div>
          </div>

          {/* Cantidad a Ingresar */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Cantidad de unidades compradas *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
              required
            />
            <span className="text-[11px] text-slate-500 block mt-1">
              El stock disponible pasará de {product.availableStock} a <strong>{product.availableStock + quantity} unidades</strong>.
            </span>
          </div>

          {/* Precio de Compra Unitario */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Precio de Compra Unitario ($) *
              </label>
              {isDifferentCost && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Cambio de precio (antes: ${product.purchaseCost})
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs">$</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(Math.max(0, Number(e.target.value)))}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                required
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              Actualizará el <strong>Último Costo de Compra</strong> en el catálogo a ${purchaseCost}.
            </span>
          </div>

          {/* Total a Egresar */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Egreso de Caja</span>
                <span className="text-xs text-amber-950">
                  {quantity} unid. x ${purchaseCost}
                </span>
              </div>
            </div>
            <span className="text-2xl font-black text-amber-800">-${totalCost}</span>
          </div>

          {/* Notas / Proveedor */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Proveedor o Referencia (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Proveedor Gamarra, Lote nuevo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
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
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg hover:from-amber-700 hover:to-orange-700 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Confirmar Ingreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
