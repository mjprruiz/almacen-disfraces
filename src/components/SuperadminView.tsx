'use client';

import React, { useState } from 'react';
import { User, Store } from '@/lib/types';
import {
  Shield,
  Store as StoreIcon,
  Crown,
  Plus,
  Users,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  MapPin,
  LogOut,
  Sparkles,
  UserCheck,
  Search,
  X,
} from 'lucide-react';

interface SuperadminViewProps {
  currentUser: User;
  stores: Store[];
  users: User[];
  onLogout: () => void;
  onRefreshStores: () => Promise<void>;
  onRefreshUsers: () => Promise<void>;
}

export const SuperadminView: React.FC<SuperadminViewProps> = ({
  currentUser,
  stores,
  users,
  onLogout,
  onRefreshStores,
  onRefreshUsers,
}) => {
  const [activeTab, setActiveTab] = useState<'stores' | 'duenos' | 'all-users'>('stores');
  const [isNewStoreOpen, setIsNewStoreOpen] = useState(false);
  const [isNewDuenoOpen, setIsNewDuenoOpen] = useState(false);
  const [selectedUserForPin, setSelectedUserForPin] = useState<User | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Store form state
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeCurrency, setStoreCurrency] = useState('$');

  // Dueño form state
  const [duenoName, setDuenoName] = useState('');
  const [duenoUsername, setDuenoUsername] = useState('');
  const [duenoStoreId, setDuenoStoreId] = useState(stores[0]?.id || '');
  const [duenoPin, setDuenoPin] = useState('1234');

  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole: 'superadmin',
          name: storeName,
          address: storeAddress,
          phone: storePhone,
          currency: storeCurrency,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear sede');

      showSuccess(`¡Sede "${data.store.name}" creada exitosamente!`);
      setStoreName('');
      setStoreAddress('');
      setStorePhone('');
      setIsNewStoreOpen(false);
      await onRefreshStores();
    } catch (err: any) {
      setError(err.message || 'Error al registrar sede');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDueno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(duenoPin)) {
      setError('El PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole: 'superadmin',
          storeId: duenoStoreId,
          name: duenoName,
          username: duenoUsername,
          role: 'dueno',
          pin: duenoPin,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear dueño');

      showSuccess(`¡Dueño/a ${data.user.name} registrado con éxito con PIN ${duenoPin}!`);
      setDuenoName('');
      setDuenoUsername('');
      setDuenoPin('1234');
      setIsNewDuenoOpen(false);
      await onRefreshUsers();
    } catch (err: any) {
      setError(err.message || 'Error al crear dueño');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPin || !/^\d{4}$/.test(newPinValue)) {
      setError('El PIN debe tener exactamente 4 dígitos.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole: 'superadmin',
          userId: selectedUserForPin.id,
          newPin: newPinValue,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al resetear PIN');

      showSuccess(`¡PIN de ${selectedUserForPin.name} actualizado a: ${newPinValue}!`);
      setSelectedUserForPin(null);
      setNewPinValue('');
      await onRefreshUsers();
    } catch (err: any) {
      setError(err.message || 'Error al resetear PIN');
    } finally {
      setLoading(false);
    }
  };

  const duenos = users.filter((u) => u.role === 'dueno');
  const empleados = users.filter((u) => u.role === 'empleado');

  const filteredUsers = users.filter((u) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const store = stores.find((s) => s.id === u.storeId);
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (store && store.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      
      {/* Top Bar Navigation */}
      <header className="bg-slate-900 border-b border-purple-950 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3.5">
            
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-black tracking-tight text-white">
                    Almacén Disfraces
                  </h1>
                  <span className="text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded-full">
                    Consola Administrativa
                  </span>
                </div>
                <p className="text-xs text-purple-200/60">
                  Panel Exclusivo de Superadministrador
                </p>
              </div>
            </div>

            {/* User Badge & Logout */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-xs text-white">
                  <Shield className="w-4 h-4 text-purple-200" />
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold text-white block leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-purple-300 font-mono block leading-tight">
                    @{currentUser.username} • Superadmin
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 rounded-xl text-xs font-bold border border-red-500/30 transition cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Banner & Stats */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <span>Gestión de Sedes y Administración de Dueños</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Desde aquí registras nuevas tiendas físicas, vinculas a sus dueños comerciales y administras el personal de la empresa familiar.
              </p>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => {
                  setActiveTab('stores');
                  setIsNewStoreOpen(true);
                  setIsNewDuenoOpen(false);
                }}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nueva Sede</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('duenos');
                  setIsNewDuenoOpen(true);
                  setIsNewStoreOpen(false);
                }}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>+ Registrar Dueño</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">Sedes Comerciales</span>
                <span className="text-2xl font-black text-purple-950 mt-1 block">{stores.length}</span>
              </div>
              <StoreIcon className="w-8 h-8 text-purple-300" />
            </div>

            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Dueños Registrados</span>
                <span className="text-2xl font-black text-amber-950 mt-1 block">{duenos.length}</span>
              </div>
              <Crown className="w-8 h-8 text-amber-400" />
            </div>

            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Personal en Mostrador</span>
                <span className="text-2xl font-black text-blue-950 mt-1 block">{empleados.length}</span>
              </div>
              <Users className="w-8 h-8 text-blue-300" />
            </div>
          </div>
        </div>

        {/* Feedback Notifications */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="font-semibold">{success}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex space-x-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('stores')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'stores'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <StoreIcon className="w-3.5 h-3.5" />
            <span>Sedes / Tiendas ({stores.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('duenos')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'duenos'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Dueños de Sedes ({duenos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all-users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'all-users'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Directorio Global de Usuarios ({users.length})</span>
          </button>
        </div>

        {/* TAB 1: SEDES / TIENDAS */}
        {activeTab === 'stores' && (
          <div className="space-y-4">
            
            {/* Form Nueva Sede */}
            {isNewStoreOpen && (
              <form
                onSubmit={handleCreateStore}
                className="bg-white border-2 border-purple-300 rounded-3xl p-6 shadow-md space-y-4 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span>Registrar Nueva Sede Comercial</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsNewStoreOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Nombre de la Sede / Tienda *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. DisfrazArte - Sede San Miguel"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Teléfono / WhatsApp de la Tienda
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. +51 988 776 655"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Dirección del Local
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Av. La Marina 1520"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Moneda de Operación
                    </label>
                    <select
                      value={storeCurrency}
                      onChange={(e) => setStoreCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="$">Dólar ($)</option>
                      <option value="S/.">Soles (S/.)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsNewStoreOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Crear Sede'}
                  </button>
                </div>
              </form>
            )}

            {/* Grid de Sedes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map((s) => {
                const storeDuenos = users.filter((u) => u.storeId === s.id && u.role === 'dueno');
                const storeEmps = users.filter((u) => u.storeId === s.id && u.role === 'empleado');

                return (
                  <div
                    key={s.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold">
                          <StoreIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                          {s.slug}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight">
                          {s.name}
                        </h3>
                        {s.address && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{s.address}</span>
                          </p>
                        )}
                        {s.phone && (
                          <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{s.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3 text-slate-600">
                        <span>Dueños: <strong className="text-slate-900">{storeDuenos.length}</strong></span>
                        <span>Empleados: <strong className="text-slate-900">{storeEmps.length}</strong></span>
                      </div>
                      <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {s.currency}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: DUEÑOS */}
        {activeTab === 'duenos' && (
          <div className="space-y-4">
            
            {/* Form Nuevo Dueño */}
            {isNewDuenoOpen && (
              <form
                onSubmit={handleCreateDueno}
                className="bg-white border-2 border-amber-300 rounded-3xl p-6 shadow-md space-y-4 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>Registrar Nuevo Dueño de Sede</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsNewDuenoOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Nombre Completo del Dueño *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Roberto Mendoza"
                      value={duenoName}
                      onChange={(e) => setDuenoName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Nombre de Usuario (Login) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. roberto_admin"
                      value={duenoUsername}
                      onChange={(e) => setDuenoUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Sede Comercial Asignada *
                    </label>
                    <select
                      value={duenoStoreId}
                      onChange={(e) => setDuenoStoreId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      PIN Inicial (4 dígitos) *
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={duenoPin}
                      onChange={(e) => setDuenoPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-widest focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      El dueño podrá cambiar este PIN luego usando el botón [PIN] en su pantalla.
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsNewDuenoOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || duenoPin.length !== 4}
                    className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Registrar Dueño'}
                  </button>
                </div>
              </form>
            )}

            {/* Grid de Dueños */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {duenos.map((d) => {
                const store = stores.find((s) => s.id === d.storeId);
                return (
                  <div
                    key={d.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-black text-white text-base shadow-sm">
                          {d.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              👑 Dueño
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono">@{d.username}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Sede Asignada</span>
                        <span className="font-bold text-slate-800 block">{store?.name || d.storeId}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserForPin(d);
                          setNewPinValue('');
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 transition cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>Resetear PIN</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ALL USERS */}
        {activeTab === 'all-users' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Directorio Global de Todo el Personal</h3>
                <p className="text-xs text-slate-500">Supervisión de cuentas de todas las sedes comerciales</p>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, usuario o sede..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {filteredUsers.map((u) => {
                const store = stores.find((s) => s.id === u.storeId);
                const isSuper = u.role === 'superadmin';
                const isDueno = u.role === 'dueno';

                return (
                  <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white ${
                          isSuper ? 'bg-slate-900' : isDueno ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSuper
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : isDueno
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {isSuper ? '⚡ Superadmin' : isDueno ? '👑 Dueño' : '👤 Empleado'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          @{u.username} • Sede: <strong>{store?.name || u.storeId}</strong>
                        </p>
                      </div>
                    </div>

                    {!isSuper && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserForPin(u);
                          setNewPinValue('');
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Resetear PIN</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Resetear PIN */}
        {selectedUserForPin && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleResetPin}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 border border-slate-200 animate-in fade-in zoom-in-95"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Resetear PIN de {selectedUserForPin.name}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedUserForPin(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Ingresa el nuevo PIN de 4 dígitos para <strong>@{selectedUserForPin.username}</strong>:
              </p>

              <input
                type="password"
                maxLength={4}
                required
                autoFocus
                placeholder="••••"
                value={newPinValue}
                onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-center text-lg font-mono font-black tracking-widest focus:ring-2 focus:ring-amber-500 outline-none text-slate-900"
              />

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPin(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || newPinValue.length !== 4}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Confirmar PIN'}
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
};
