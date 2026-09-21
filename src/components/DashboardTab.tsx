'use client';

import React, { useState, useMemo } from 'react';
import { DashboardMetrics, CashMovement, User, Rental } from '@/lib/types';
import {
  DollarSign,
  TrendingUp,
  Package,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface DashboardTabProps {
  metrics: DashboardMetrics | null;
  cashMovements: CashMovement[];
  currentUser: User | null;
  activeRentals: Rental[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  metrics,
  cashMovements,
  currentUser,
  activeRentals,
}) => {
  const isDueno = currentUser?.role === 'dueno';

  // Date filters: 'today' | 'week' | 'month' | 'all' | 'custom'
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('all');
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  // Table filters & pagination
  const [typeFilter, setTypeFilter] = useState<'all' | 'ingreso' | 'egreso'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter movements by date range
  const periodMovements = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const currentMonthPrefix = today.slice(0, 7); // e.g. "2026-09"

    return cashMovements.filter((m) => {
      if (dateFilter === 'today') return m.date === today;
      if (dateFilter === 'week') return m.date >= sevenDaysAgo && m.date <= today;
      if (dateFilter === 'month') return m.date.startsWith(currentMonthPrefix);
      if (dateFilter === 'custom') {
        if (customStartDate && m.date < customStartDate) return false;
        if (customEndDate && m.date > customEndDate) return false;
        return true;
      }
      return true; // 'all'
    });
  }, [cashMovements, dateFilter, customStartDate, customEndDate]);

  // Compute metrics for the selected period
  const periodRentalRevenue = useMemo(() => {
    return periodMovements
      .filter((m) => m.type === 'ingreso_alquiler')
      .reduce((sum, m) => sum + m.amount, 0);
  }, [periodMovements]);

  const periodSalesRevenue = useMemo(() => {
    return periodMovements
      .filter((m) => m.type === 'ingreso_venta')
      .reduce((sum, m) => sum + m.amount, 0);
  }, [periodMovements]);

  const periodTotalRevenue = periodRentalRevenue + periodSalesRevenue;

  const periodExpenses = useMemo(() => {
    return periodMovements
      .filter((m) => m.type === 'egreso_compra' || m.type === 'egreso_gasto')
      .reduce((sum, m) => sum + m.amount, 0);
  }, [periodMovements]);

  // Flujo real de dinero en el período
  const periodNetCash = periodTotalRevenue - periodExpenses;

  // Filter table movements by search and type
  const displayMovements = useMemo(() => {
    return periodMovements.filter((m) => {
      if (typeFilter === 'ingreso' && !m.type.startsWith('ingreso')) return false;
      if (typeFilter === 'egreso' && !m.type.startsWith('egreso')) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          m.description.toLowerCase().includes(q) ||
          m.userName.toLowerCase().includes(q) ||
          m.date.includes(q) ||
          m.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [periodMovements, typeFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(displayMovements.length / itemsPerPage));
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return displayMovements.slice(start, start + itemsPerPage);
  }, [displayMovements, currentPage]);

  // Reset page when filters change
  const handleDateFilterChange = (filter: 'today' | 'week' | 'month' | 'all' | 'custom') => {
    setDateFilter(filter);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (type: 'all' | 'ingreso' | 'egreso') => {
    setTypeFilter(type);
    setCurrentPage(1);
  };

  // If user is an employee, display security restriction screen
  if (!isDueno) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-2xl mx-auto shadow-sm my-8 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Módulo Financiero Protegido</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          El <strong>Dashboard de Ganancias e Inversión</strong> contiene información contable confidencial del negocio (márgenes, costos de adquisición y balance de caja).
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 text-left space-y-1.5">
          <p className="font-semibold text-slate-700">🔒 Control de Seguridad Activo:</p>
          <p>• Tu usuario actual tiene perfil de <strong>Empleado (Mostrador)</strong>.</p>
          <p>• Puedes gestionar alquileres, devoluciones y consultar stock en las pestañas correspondientes.</p>
          <p>• Para ver este reporte, se requiere acceso de <strong>Dueño</strong>.</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8 text-center text-slate-400">
        Cargando métricas del negocio...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-purple-300 font-bold block mb-1">
            Panel de Control Financiero
          </span>
          <h2 className="text-2xl font-black tracking-tight">
            Flujo de Dinero y Balance de Caja
          </h2>
          <p className="text-xs text-purple-200/80 mt-1">
            Control en tiempo real de ingresos por alquileres, ventas y egresos reales de compras.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-xs font-semibold text-purple-100">
          👑 Vista exclusiva para Dueños
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center mr-1">
            <Calendar className="w-3.5 h-3.5 mr-1 text-purple-600" />
            Período:
          </span>

          <button
            type="button"
            onClick={() => handleDateFilterChange('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              dateFilter === 'today'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => handleDateFilterChange('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              dateFilter === 'week'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Esta Semana
          </button>

          <button
            type="button"
            onClick={() => handleDateFilterChange('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              dateFilter === 'month'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Este Mes
          </button>

          <button
            type="button"
            onClick={() => handleDateFilterChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              dateFilter === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todo el Historial
          </button>
        </div>

        {/* Custom Date Pickers */}
        <div className="flex items-center space-x-2 text-xs w-full md:w-auto">
          <span className="text-slate-400 text-xs font-semibold">Rango:</span>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => {
              setCustomStartDate(e.target.value);
              setDateFilter('custom');
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => {
              setCustomEndDate(e.target.value);
              setDateFilter('custom');
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* KPI Cards: Flujo Real de Dinero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Ingresos Totales del Período */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Recaudado
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">
            ${periodTotalRevenue.toFixed(2)}
          </p>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between border-t border-slate-100 pt-2">
            <span>Alquileres: <strong>${periodRentalRevenue.toFixed(2)}</strong></span>
            <span>Ventas: <strong>${periodSalesRevenue.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* 2. Egresos Reales de Caja (Compras Nuevas / Gastos) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Egresos de Caja
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">
            ${periodExpenses.toFixed(2)}
          </p>
          <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            Compras de stock nuevo y gastos del período.
          </p>
        </div>

        {/* 3. Flujo Neto de Dinero / Ganancia Real */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Flujo de Caja Neto
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${periodNetCash >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-3xl font-black mt-2 ${periodNetCash >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ${periodNetCash.toFixed(2)}
          </p>
          <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            {periodNetCash >= 0
              ? '✓ Ganancia limpia en efectivo generada.'
              : '⚠️ Egresos superan los ingresos en este rango.'}
          </p>
        </div>

        {/* 4. Valoración del Patrimonio en Stock (Activo Físico) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Patrimonio en Disfraces
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-700 mt-2">
            ${metrics.totalInventoryCost.toFixed(2)}
          </p>
          <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            Valor de los <strong>{metrics.totalCatalogCount}</strong> modelos en stock (Activo físico).
          </p>
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Prendas en la Calle</span>
            <p className="text-xl font-bold text-slate-900">{metrics.activeRentalsCount} disfraces alquilados</p>
            <span className="text-[11px] text-emerald-600 font-semibold">{metrics.totalAvailableStock} listos en tienda</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Devoluciones para Hoy</span>
            <p className="text-xl font-bold text-amber-800">{metrics.dueTodayRentalsCount} clientes esperan entregar hoy</p>
            <span className="text-[11px] text-slate-400">Revisar mostrador</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">En Mora / Retrasados</span>
            <p className="text-xl font-bold text-red-700">{metrics.overdueRentalsCount} disfraces vencidos</p>
            <span className="text-[11px] text-slate-400">Usar botón de WhatsApp para aviso</span>
          </div>
        </div>
      </div>

      {/* Audit Log / Movimientos de Caja con Filtros y Paginación */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Table Header & Controls */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Libro de Movimientos de Caja & Auditoría
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro inalterable de cobros de alquiler, ventas y compras de stock con responsable asignado.
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-semibold self-start sm:self-auto">
              {displayMovements.length} movimientos en este filtro
            </span>
          </div>

          {/* Sub-bar: Type Filter + Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            
            {/* Type Filter Pills */}
            <div className="flex items-center space-x-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleTypeFilterChange('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({periodMovements.length})
              </button>

              <button
                type="button"
                onClick={() => handleTypeFilterChange('ingreso')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  typeFilter === 'ingreso'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Ingresos ({periodMovements.filter((m) => m.type.startsWith('ingreso')).length})
              </button>

              <button
                type="button"
                onClick={() => handleTypeFilterChange('egreso')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  typeFilter === 'egreso'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Egresos ({periodMovements.filter((m) => m.type.startsWith('egreso')).length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por concepto o usuario..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Descripción / Concepto</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4 text-right">Monto ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No se encontraron movimientos para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((m) => {
                  const isIncome = m.type.startsWith('ingreso');

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {m.date}
                      </td>
                      <td className="py-3 px-4">
                        {isIncome ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <ArrowDownLeft className="w-3 h-3 mr-1" />
                            Ingreso ({m.type.replace('ingreso_', '')})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            Egreso ({m.type.replace('egreso_', '')})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {m.description}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {m.userName}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold text-sm ${isIncome ? 'text-emerald-600' : 'text-amber-700'}`}>
                        {isIncome ? `+$${m.amount.toFixed(2)}` : `-$${m.amount.toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({displayMovements.length} movimientos)
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
      </div>
    </div>
  );
};
