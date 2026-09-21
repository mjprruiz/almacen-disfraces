'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { X, Sparkles, AlertCircle, DollarSign, Tag, CheckCircle2 } from 'lucide-react';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSubmit: (product: {
    code: string;
    name: string;
    category: string;
    gender: 'Hombre' | 'Mujer' | 'Unisex' | 'Niño' | 'Niña';
    size: string;
    purchaseCost: number;
    rentalPrice: number;
    salePrice: number;
    stockTotal: number;
    isInitialInventory?: boolean;
    notes?: string;
  }) => Promise<void>;
}

export const NewProductModal: React.FC<NewProductModalProps> = ({
  isOpen,
  onClose,
  products,
  onSubmit,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Superhéroes');
  const [gender, setGender] = useState<'Hombre' | 'Mujer' | 'Unisex' | 'Niño' | 'Niña'>('Unisex');
  const [size, setSize] = useState('M');
  const [purchaseCost, setPurchaseCost] = useState<number>(20);
  const [rentalPrice, setRentalPrice] = useState<number>(15);
  const [salePrice, setSalePrice] = useState<number>(45);
  const [stockTotal, setStockTotal] = useState<number>(5);
  const [isInitialInventory, setIsInitialInventory] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-sugerencia del siguiente código único al abrir el modal
  useEffect(() => {
    if (isOpen) {
      let maxNum = 0;
      products.forEach((p) => {
        const match = p.code.match(/(\d+)/);
        if (match) {
          const n = parseInt(match[0], 10);
          if (n > maxNum) maxNum = n;
        }
      });
      const nextNum = maxNum + 1;
      const padded = String(nextNum).padStart(3, '0');
      setCode(`DISF${padded}`);
      setError('');
    }
  }, [isOpen, products]);

  if (!isOpen) return null;

  // Verificación en tiempo real de código duplicado
  const existingWithCode = products.find(
    (p) => p.code.toUpperCase() === code.trim().toUpperCase()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del disfraz es obligatorio');
      return;
    }
    if (!code.trim()) {
      setError('El código del disfraz es obligatorio');
      return;
    }
    if (existingWithCode) {
      setError(`El código "${code.toUpperCase()}" ya está asignado a "${existingWithCode.name}". Elige otro código.`);
      return;
    }
    if (stockTotal < 1) {
      setError('El stock inicial debe ser al menos 1 unidad');
      return;
    }
    if (rentalPrice < 0 || purchaseCost < 0 || salePrice < 0) {
      setError('Los precios y costos no pueden ser negativos');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category,
        gender,
        size: size.trim().toUpperCase(),
        purchaseCost: Number(purchaseCost) || 0,
        rentalPrice: Number(rentalPrice) || 0,
        salePrice: Number(salePrice) || 0,
        stockTotal: Number(stockTotal) || 1,
        isInitialInventory,
        notes: notes.trim(),
      });
      // Clear
      setCode('');
      setName('');
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar disfraz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-pink-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-pink-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Agregar Disfraz al Catálogo</h2>
              <p className="text-xs text-pink-200/80">Registro de código único y control de inversión</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-pink-200 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition"
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
          
          {/* Código y Nombre con validación de unicidad en vivo */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  Código *
                </label>
              </div>
              <input
                type="text"
                placeholder="DISF006"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full uppercase font-mono bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none transition ${
                  existingWithCode
                    ? 'border-red-500 bg-red-50/50 text-red-900 focus:ring-2 focus:ring-red-400'
                    : 'border-slate-300 focus:ring-2 focus:ring-purple-500'
                }`}
                required
              />
              {existingWithCode ? (
                <span className="text-[10px] text-red-600 font-semibold block mt-1 leading-tight">
                  ⚠️ Ya usado por: {existingWithCode.name}
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 font-medium block mt-1 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-0.5 inline" /> Código disponible
                </span>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nombre del Disfraz *
              </label>
              <input
                type="text"
                placeholder="Ej. Traje de Batman Arkham"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="Superhéroes">Superhéroes</option>
                <option value="Fantasía">Fantasía</option>
                <option value="Halloween">Halloween</option>
                <option value="Época">Época</option>
                <option value="Animales">Animales</option>
                <option value="Típicos">Típicos</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Público
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Unisex">Unisex</option>
                <option value="Niño">Niño</option>
                <option value="Niña">Niña</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Talla
              </label>
              <input
                type="text"
                placeholder="M, L, XL, 4-6..."
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full uppercase bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Costos e Inversión */}
          <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-3.5 space-y-3">
            <p className="text-xs font-bold text-purple-900 flex items-center">
              <DollarSign className="w-3.5 h-3.5 mr-1 text-purple-600" />
              Inversión y Precios (No negativos)
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-purple-950 uppercase mb-1">
                  Costo Compra ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <span className="text-[10px] text-purple-700">Inversión unitaria</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-950 uppercase mb-1">
                  Precio Alquiler ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={rentalPrice}
                  onChange={(e) => setRentalPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <span className="text-[10px] text-purple-700">Por evento</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-950 uppercase mb-1">
                  Precio Venta ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={salePrice}
                  onChange={(e) => setSalePrice(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-purple-700">Si se vende</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Stock Inicial (Unidades) *
              </label>
              <input
                type="number"
                min="1"
                value={stockTotal}
                onChange={(e) => setStockTotal(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
              <span className="text-[11px] text-slate-500">
                Inversión calculada: <strong>${(purchaseCost * stockTotal).toFixed(2)}</strong>
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Accesorios / Notas
              </label>
              <input
                type="text"
                placeholder="Capa, máscara, cinturón..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          {/* Checkbox de Inventario Inicial / Stock Antiguo */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3.5 space-y-1.5">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isInitialInventory}
                onChange={(e) => setIsInitialInventory(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-amber-950 block">
                  ¿Es Inventario Inicial / Stock Antiguo? (Ya amortizado)
                </span>
                <span className="text-[11px] text-amber-800/90 block leading-relaxed">
                  {isInitialInventory ? (
                    <>
                      ✓ Se registrará en el catálogo con su costo referencial, pero <strong>NO restará dinero de la caja de hoy</strong> ni alterará la auditoría financiera actual.
                    </>
                  ) : (
                    <>
                      ⚠️ <strong>Compra nueva realizada hoy:</strong> Se registrará un egreso de <strong>${(purchaseCost * stockTotal).toFixed(2)}</strong> en el libro de caja de hoy.
                    </>
                  )}
                </span>
              </div>
            </label>
          </div>

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
              disabled={loading || Boolean(existingWithCode)}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-pink-600 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg hover:from-purple-800 hover:to-pink-700 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Disfraz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
