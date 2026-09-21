'use client';

import React from 'react';
import { Store, User, UserRole } from '@/lib/types';
import {
  Store as StoreIcon,
  Shield,
  UserCheck,
  ShoppingBag,
  Sparkles,
  Users,
  BarChart3,
  Lock,
  LogOut,
  KeyRound,
} from 'lucide-react';

interface HeaderProps {
  stores: Store[];
  currentStore: Store | null;
  currentUser: User | null;
  onLogout: () => void;
  onOpenUserManagement?: () => void;
  onOpenSuperadminPanel?: () => void;
  onOpenChangePin: () => void;
  activeTab: 'rentals' | 'inventory' | 'clients' | 'dashboard';
  setActiveTab: (tab: 'rentals' | 'inventory' | 'clients' | 'dashboard') => void;
  overdueCount: number;
  dueTodayCount: number;
  onOpenTestGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stores,
  currentStore,
  currentUser,
  onLogout,
  onOpenUserManagement,
  onOpenSuperadminPanel,
  onOpenChangePin,
  activeTab,
  setActiveTab,
  overdueCount,
  dueTodayCount,
  onOpenTestGuide,
}) => {
  const isSuperadmin = currentUser?.role === 'superadmin';
  const isDueno = currentUser?.role === 'dueno';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      {/* Top Bar: Multi-Store & User Role Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 border-b border-slate-100 gap-3">
          
          {/* Brand & Store Selector */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  Almacén Disfraces
                </h1>
                <p className="text-xs text-slate-500">Sistema Multi-Tienda & Control</p>
              </div>
            </div>

            {/* Sede Asignada Fija (Sin selector para evitar acceso a sedes ajenas) */}
            <div className="flex items-center space-x-2 bg-purple-50 text-purple-900 px-3.5 py-1.5 rounded-xl border border-purple-200/80 text-xs font-bold shadow-2xs">
              <StoreIcon className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-xs">{currentStore?.name || 'Sede Asignada'}</span>
            </div>
          </div>

          {/* User Info, Admin Button & Logout */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-wrap gap-y-2">
            
            {/* User Badge */}
            {currentUser && (
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                    isSuperadmin
                      ? 'bg-slate-900'
                      : isDueno
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                      : 'bg-gradient-to-tr from-blue-500 to-indigo-600'
                  }`}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 block leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block leading-tight">
                    {isSuperadmin ? '⚡ Superadmin' : isDueno ? '👑 Dueño' : '👤 Mostrador'}
                  </span>
                </div>
              </div>
            )}

            {/* Superadmin: Panel Global */}
            {isSuperadmin && onOpenSuperadminPanel && (
              <button
                onClick={onOpenSuperadminPanel}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                title="Panel de Superadministrador para sedes y dueños"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Panel Global</span>
              </button>
            )}

            {/* Dueño: Equipo y Usuarios */}
            {isDueno && onOpenUserManagement && (
              <button
                onClick={onOpenUserManagement}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 transition cursor-pointer shadow-xs"
                title="Administrar empleados de esta sede"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Equipo</span>
              </button>
            )}

            {/* Cambiar mi PIN (para dueños y empleados) */}
            {!isSuperadmin && (
              <button
                onClick={onOpenChangePin}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer"
                title="Cambiar mi PIN de acceso"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>PIN</span>
              </button>
            )}

            {/* Cerrar Sesión */}
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-xl text-xs font-bold border border-slate-200 hover:border-red-200 transition cursor-pointer"
              title="Cerrar sesión actual"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-4 pt-2 overflow-x-auto pb-1 text-sm font-medium">
          <button
            onClick={() => setActiveTab('rentals')}
            className={`flex items-center py-2.5 px-3.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'rentals'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Mostrador & Alquileres
            {(overdueCount > 0 || dueTodayCount > 0) && (
              <span className="ml-2 flex items-center space-x-1">
                {overdueCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {overdueCount}
                  </span>
                )}
                {dueTodayCount > 0 && (
                  <span className="bg-amber-400 text-slate-900 text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {dueTodayCount}
                  </span>
                )}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center py-2.5 px-3.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Catálogo de Disfraces
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center py-2.5 px-3.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'clients'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Clientes
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center py-2.5 px-3.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isDueno ? (
              <BarChart3 className="w-4 h-4 mr-2 text-emerald-600" />
            ) : (
              <Lock className="w-4 h-4 mr-2 text-slate-400" />
            )}
            Dashboard Financiero
            {!isDueno && (
              <span className="ml-1.5 text-[10px] uppercase font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                Solo Dueño
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
