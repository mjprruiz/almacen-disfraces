'use client';

import React, { useState, useMemo } from 'react';
import { Rental, Store } from '@/lib/types';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { RentalDetailModal } from '@/components/RentalDetailModal';
import {
  Search,
  Plus,
  RotateCcw,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  DollarSign,
  Shield,
  User,
  Filter,
  LayoutGrid,
  List,
  Eye,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';

interface RentalsTabProps {
  rentals: Rental[];
  currentStore: Store | null;
  onOpenNewRental: () => void;
  onOpenNewSale: () => void;
  onOpenReturn: (rental: Rental) => void;
}

export const RentalsTab: React.FC<RentalsTabProps> = ({
  rentals,
  currentStore,
  onOpenNewRental,
  onOpenNewSale,
  onOpenReturn,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRentalForDetail, setSelectedRentalForDetail] = useState<Rental | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter rentals
  const filteredRentals = useMemo(() => {
    return rentals.filter((r) => {
      // Status filter
      if (filterStatus === 'demorados' && r.status !== 'demorado') return false;
      if (filterStatus === 'hoy' && (r.status === 'devuelto' || r.dueDate !== todayStr)) return false;
      if (filterStatus === 'en_plazo' && (r.status !== 'activo' || r.dueDate <= todayStr)) return false;
      if (filterStatus === 'devueltos' && r.status !== 'devuelto') return false;
      if (filterStatus === 'activos' && r.status === 'devuelto') return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          r.ticketCode.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          r.clientName.toLowerCase().includes(q) ||
          r.clientPhone.includes(q) ||
          (r.clientDni && r.clientDni.includes(q))
        );
      }

      return true;
    });
  }, [rentals, filterStatus, searchTerm, todayStr]);

  // Counts for tabs
  const counts = useMemo(() => {
    const demorados = rentals.filter((r) => r.status === 'demorado').length;
    const hoy = rentals.filter((r) => r.status !== 'devuelto' && r.dueDate === todayStr).length;
    const enPlazo = rentals.filter((r) => r.status === 'activo' && r.dueDate > todayStr).length;
    const devueltos = rentals.filter((r) => r.status === 'devuelto').length;
    const activos = rentals.filter((r) => r.status !== 'devuelto').length;
    return { demorados, hoy, enPlazo, devueltos, activos, total: rentals.length };
  }, [rentals, todayStr]);

  // Pagination
  const itemsPerPage = viewMode === 'cards' ? 6 : 10;
  const totalPages = Math.max(1, Math.ceil(filteredRentals.length / itemsPerPage));
  const paginatedRentals = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRentals.slice(start, start + itemsPerPage);
  }, [filteredRentals, currentPage, itemsPerPage]);

  const handleStatusFilterChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode: 'cards' | 'list') => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  // Generate WhatsApp reminder link
  const getWhatsAppUrl = (rental: Rental) => {
    const storeName = currentStore?.name || 'la tienda de disfraces';

    let message = '';
    if (rental.status === 'demorado') {
      message = `Hola ${rental.clientName}, te escribimos de *${storeName}*. Te recordamos con amabilidad que el alquiler del disfraz *${rental.productName}* (${rental.ticketCode}) venció el *${rental.dueDate}*. Por favor acércate a la tienda a realizar la devolución para evitar recargos adicionales. ¡Muchas gracias!`;
    } else if (rental.dueDate === todayStr) {
      message = `Hola ${rental.clientName}, te saludamos de *${storeName}*. Te recordamos que *hoy* es la fecha pactada para la devolución del disfraz *${rental.productName}* (${rental.ticketCode}). Te esperamos en el local. ¡Gracias por tu preferencia!`;
    } else {
      message = `Hola ${rental.clientName}, te escribimos de *${storeName}* respecto a tu alquiler del disfraz *${rental.productName}* (${rental.ticketCode}). Te recordamos que la fecha de devolución es el *${rental.dueDate}*. ¡Que disfrutes tu evento!`;
    }

    return buildWhatsAppUrl(rental.clientPhone, message);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Quick Actions & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
            Mostrador de Alquileres
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Control de entregas, fechas límites de devolución y seguimiento directo por WhatsApp.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenNewSale}
            className="flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer text-xs sm:text-sm"
            title="Registrar venta directa de disfraz o accesorio"
          >
            <DollarSign className="w-4 h-4" />
            <span>Nueva Venta</span>
          </button>

          <button
            onClick={onOpenNewRental}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Alquiler</span>
          </button>
        </div>
      </div>

      {/* Filter, Search & View Switcher Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        
        {/* Search input + View Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, teléfono, código de ticket o disfraz..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* View Switcher Toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => handleViewModeChange('cards')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista en tarjetas (cuadrícula)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista en lista compacta"
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => handleStatusFilterChange('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              filterStatus === 'todos'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Todos</span>
            <span className="opacity-75">({counts.total})</span>
          </button>

          <button
            onClick={() => handleStatusFilterChange('activos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              filterStatus === 'activos'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <span>En Alquiler (Activos)</span>
            <span className="opacity-75">({counts.activos})</span>
          </button>

          <button
            onClick={() => handleStatusFilterChange('demorados')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              filterStatus === 'demorados'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Con Retraso</span>
            <span className="bg-red-600 text-white px-1.5 py-0.2 rounded-full text-[10px]">
              {counts.demorados}
            </span>
          </button>

          <button
            onClick={() => handleStatusFilterChange('hoy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              filterStatus === 'hoy'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Vencen Hoy</span>
            <span className="bg-amber-500 text-white px-1.5 py-0.2 rounded-full text-[10px]">
              {counts.hoy}
            </span>
          </button>

          <button
            onClick={() => handleStatusFilterChange('en_plazo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              filterStatus === 'en_plazo'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <span>En Plazo</span>
            <span className="opacity-75">({counts.enPlazo})</span>
          </button>

          <button
            onClick={() => handleStatusFilterChange('devueltos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              filterStatus === 'devueltos'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Devueltos (Historial)</span>
            <span className="opacity-75">({counts.devueltos})</span>
          </button>
        </div>
      </div>

      {/* No results */}
      {filteredRentals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No se encontraron alquileres</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No hay registros que coincidan con los filtros actuales o la búsqueda realizada.
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* VISTA 1: CUADRÍCULA (CARDS) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedRentals.map((r) => {
              const isDueToday = r.status !== 'devuelto' && r.dueDate === todayStr;
              const isOverdue = r.status === 'demorado';
              const isReturned = r.status === 'devuelto';

              // Calculate delay or remaining days
              const dueTime = new Date(r.dueDate + 'T00:00:00').getTime();
              const nowTime = new Date(todayStr + 'T00:00:00').getTime();
              const daysDiff = Math.round((nowTime - dueTime) / (1000 * 60 * 60 * 24));

              const totalGarments = r.totalQuantity || (r.items ? r.items.reduce((s, it) => s + it.quantity, 0) : 1);

              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden ${
                    isOverdue
                      ? 'border-red-300 ring-1 ring-red-200'
                      : isDueToday
                      ? 'border-amber-300 ring-1 ring-amber-200'
                      : isReturned
                      ? 'border-slate-200 opacity-80'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Card Top */}
                  <div className="p-4 space-y-3">
                    
                    {/* Status Banner */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {r.ticketCode}
                        </span>
                        {totalGarments > 1 && (
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <Package className="w-3 h-3" />
                            <span>{totalGarments} prendas</span>
                          </span>
                        )}
                      </div>

                      {/* Status Pill */}
                      {isOverdue && (
                        <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Retrasado ({daysDiff} d)
                        </span>
                      )}
                      {isDueToday && (
                        <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 mr-1" />
                          ¡Vence Hoy!
                        </span>
                      )}
                      {!isOverdue && !isDueToday && !isReturned && (
                        <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          En Plazo ({Math.abs(daysDiff)} d restantes)
                        </span>
                      )}
                      {isReturned && (
                        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Devuelto ({r.returnDate})
                        </span>
                      )}
                    </div>

                    {/* Disfraz Info */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {r.productName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Código: <span className="font-mono">{r.productCode}</span> | Talla: <strong className="text-slate-700">{r.productSize}</strong>
                      </p>
                    </div>

                    {/* Cliente Info */}
                    <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 border border-slate-100">
                      <div className="flex items-center justify-between text-slate-800 font-semibold">
                        <span className="flex items-center">
                          <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {r.clientName}
                        </span>
                        <span className="text-slate-500 font-normal">{r.clientPhone}</span>
                      </div>
                      {r.clientDni && (
                        <p className="text-[11px] text-slate-400">DNI: {r.clientDni}</p>
                      )}
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Salida</span>
                        <span className="font-medium text-slate-700">{r.rentalDate}</span>
                      </div>
                      <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-50 text-red-900' : isDueToday ? 'bg-amber-50 text-amber-900' : 'bg-slate-50 text-slate-700'}`}>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Devolver antes de</span>
                        <span className="font-bold">{r.dueDate}</span>
                      </div>
                    </div>

                    {/* Precios & Garantías */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block font-bold">Total a Pagar</span>
                        <span className="font-black text-purple-700 text-sm">${r.rentalPrice.toFixed(2)}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase text-slate-400 block font-bold">Garantía Retenida</span>
                        <span className="font-semibold text-slate-700 text-xs">
                          {r.guaranteeType === 'efectivo_y_documento' || (r.guaranteeAmount > 0 && r.guaranteeType === 'documento')
                            ? `$${r.guaranteeAmount.toFixed(2)} (Ef.) + DNI físico`
                            : r.guaranteeType === 'efectivo'
                            ? `$${r.guaranteeAmount.toFixed(2)} (Efectivo)`
                            : r.guaranteeType === 'documento'
                            ? '🪪 DNI físico en custodia'
                            : 'Sin garantía'}
                        </span>
                      </div>
                    </div>

                    {r.notes && (
                      <p className="text-[11px] text-slate-500 bg-purple-50/50 p-2 rounded-lg italic">
                        Nota: {r.notes}
                      </p>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    
                    {/* Detalle Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedRentalForDetail(r)}
                      className="px-2.5 py-2 bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                      title="Ver ficha detallada y recibo"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Detalle</span>
                    </button>

                    {/* WhatsApp Reminder Button */}
                    <a
                      href={getWhatsAppUrl(r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Return Button */}
                    {!isReturned ? (
                      <button
                        onClick={() => onOpenReturn(r)}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Devolver</span>
                      </button>
                    ) : (
                      <span className="flex-1 text-center text-xs font-medium text-slate-400 py-2">
                        Completado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VISTA 2: LISTA COMPACTA / TABLA */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Prenda(s)</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Fechas (Salida → Vence)</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Total a Pagar</th>
                  <th className="py-3.5 px-4 text-center">Garantía</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRentals.map((r) => {
                  const isDueToday = r.status !== 'devuelto' && r.dueDate === todayStr;
                  const isOverdue = r.status === 'demorado';
                  const isReturned = r.status === 'devuelto';
                  const totalGarments = r.totalQuantity || (r.items ? r.items.reduce((s, it) => s + it.quantity, 0) : 1);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Ticket */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {r.ticketCode}
                      </td>

                      {/* Prenda(s) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 block max-w-xs truncate">
                            {r.productName}
                          </span>
                          {totalGarments > 1 && (
                            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                              {totalGarments} prendas
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {r.productCode} • Talla: {r.productSize}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{r.clientName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{r.clientPhone}</span>
                      </td>

                      {/* Fechas */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-600 block">{r.rentalDate}</span>
                        <span className={`font-bold ${isOverdue ? 'text-red-600' : isDueToday ? 'text-amber-600' : 'text-slate-800'}`}>
                          → {r.dueDate}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        {isOverdue && (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                            Retrasado
                          </span>
                        )}
                        {isDueToday && (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                            Vence Hoy
                          </span>
                        )}
                        {!isOverdue && !isDueToday && !isReturned && (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            En Plazo
                          </span>
                        )}
                        {isReturned && (
                          <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Devuelto
                          </span>
                        )}
                      </td>

                      {/* Total a Pagar */}
                      <td className="py-3.5 px-4 text-right font-black text-purple-700 text-xs">
                        ${r.rentalPrice.toFixed(2)}
                      </td>

                      {/* Garantía */}
                      <td className="py-3.5 px-4 text-center text-xs">
                        {r.guaranteeType === 'efectivo_y_documento' || (r.guaranteeAmount > 0 && r.guaranteeType === 'documento') ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-emerald-700">${r.guaranteeAmount.toFixed(2)}</span>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-full mt-0.5">
                              + DNI Físico
                            </span>
                          </div>
                        ) : r.guaranteeType === 'efectivo' ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                            ${r.guaranteeAmount.toFixed(2)} (Ef.)
                          </span>
                        ) : r.guaranteeType === 'documento' ? (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                            🪪 DNI Físico
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            Sin garantía
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center space-x-1.5">
                          
                          {/* Detalle */}
                          <button
                            type="button"
                            onClick={() => setSelectedRentalForDetail(r)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                            title="Ver ficha completa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp */}
                          <a
                            href={getWhatsAppUrl(r)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition cursor-pointer"
                            title="WhatsApp directo"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          {/* Devolver */}
                          {!isReturned && (
                            <button
                              type="button"
                              onClick={() => onOpenReturn(r)}
                              className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition cursor-pointer"
                              title="Devolver alquiler"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs text-slate-600">
          <span>
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({filteredRentals.length} alquileres en total)
          </span>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Rental Detail Modal */}
      <RentalDetailModal
        isOpen={Boolean(selectedRentalForDetail)}
        onClose={() => setSelectedRentalForDetail(null)}
        rental={selectedRentalForDetail}
        onOpenReturn={onOpenReturn}
      />
    </div>
  );
};
