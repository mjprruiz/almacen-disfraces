'use client';

import React, { useState, useMemo } from 'react';
import { Product, User } from '@/lib/types';
import {
  Search,
  Plus,
  Sparkles,
  Tag,
  DollarSign,
  Package,
  Layers,
  Lock,
  Filter,
  PackagePlus,
} from 'lucide-react';

interface InventoryTabProps {
  products: Product[];
  currentUser: User | null;
  onOpenNewProduct: () => void;
  onOpenRestock?: (product: Product) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  products,
  currentUser,
  onOpenNewProduct,
  onOpenRestock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [genderFilter, setGenderFilter] = useState('todos');

  const isDueno = currentUser?.role === 'dueno';

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['todas', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'todas' && p.category !== categoryFilter) return false;
      if (genderFilter !== 'todos' && p.gender !== genderFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.size.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, categoryFilter, genderFilter, searchTerm]);

  // Overall totals
  const totals = useMemo(() => {
    const totalUnits = products.reduce((sum, p) => sum + p.stockTotal, 0);
    const totalAvailable = products.reduce((sum, p) => sum + p.availableStock, 0);
    const totalRented = products.reduce((sum, p) => sum + p.rentedCount, 0);
    const totalCost = products.reduce((sum, p) => sum + (p.purchaseCost * p.stockTotal), 0);
    return { totalUnits, totalAvailable, totalRented, totalCost };
  }, [products]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
            Catálogo e Inventario de Disfraces
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de stock físico, tallas, disponibilidad inmediata e historial de inversión.
          </p>
        </div>

        {isDueno ? (
          <button
            onClick={onOpenNewProduct}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Agregar Disfraz</span>
          </button>
        ) : (
          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-xl flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Solo el Dueño puede modificar precios o agregar modelos</span>
          </div>
        )}
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Modelos Registrados</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{products.length}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">Stock Disponible</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{totals.totalAvailable} prendas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider block">En Alquiler Ahora</span>
          <span className="text-2xl font-black text-purple-700 mt-1 block">{totals.totalRented} prendas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            {isDueno ? 'Inversión en Stock' : 'Total Prendas'}
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {isDueno ? `$${totals.totalCost.toFixed(2)}` : `${totals.totalUnits} unid.`}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Categoría: {c === 'todas' ? 'Todas' : c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="todos">Público: Todos</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
              <option value="Unisex">Unisex</option>
              <option value="Niño">Niño</option>
              <option value="Niña">Niña</option>
            </select>
          </div>
        </div>
      </div>

      {/* Costume List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => {
          const isAvailable = p.availableStock > 0;

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                {/* Badges */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md">
                    {p.code}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">
                      {p.category}
                    </span>
                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      Talla {p.size}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <h3 className="font-bold text-slate-900 text-base leading-tight">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Público: <strong className="text-slate-700">{p.gender}</strong>
                  {p.notes ? ` • ${p.notes}` : ''}
                </p>

                {/* Stock Bar */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-slate-600">Disponibilidad en local:</span>
                    <span className={isAvailable ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                      {isAvailable ? `${p.availableStock} disponibles` : 'Agotado temporalmente'}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>En alquiler: <strong>{p.rentedCount}</strong></span>
                    <span>Vendidos: <strong>{p.soldCount}</strong></span>
                    <span>Total compras: <strong>{p.stockTotal}</strong></span>
                  </div>
                </div>
              </div>

              {/* Pricing & Cost */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Alquiler</span>
                    <span className="text-base font-black text-purple-700">${p.rentalPrice}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Precio Venta</span>
                    <span className="text-sm font-bold text-slate-700">${p.salePrice}</span>
                  </div>

                  {isDueno && (
                    <div className="text-right bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <span className="text-[10px] uppercase text-amber-800 block font-bold">Último Costo</span>
                      <span className="text-xs font-bold text-amber-900">${p.purchaseCost}</span>
                    </div>
                  )}
                </div>

                {isDueno && (
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-slate-400">
                      Inversión lote: <strong>${(p.purchaseCost * p.stockTotal).toFixed(2)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenRestock?.(p)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg shadow-sm hover:shadow transition cursor-pointer text-xs"
                      title="Ingresar más stock de este disfraz"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>+ Stock</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
