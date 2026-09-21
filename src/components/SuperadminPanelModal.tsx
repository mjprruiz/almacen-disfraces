'use client';

import React, { useState } from 'react';
import { User, Store } from '@/lib/types';
import {
  X,
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
} from 'lucide-react';

interface SuperadminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  stores: Store[];
  users: User[];
  onRefreshStores: () => Promise<void>;
  onRefreshUsers: () => Promise<void>;
}

export const SuperadminPanelModal: React.FC<SuperadminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  stores,
  users,
  onRefreshStores,
  onRefreshUsers,
}) => {
  const [activeTab, setActiveTab] = useState<'stores' | 'duenos' | 'all-users'>('stores');
  const [isNewStoreOpen, setIsNewStoreOpen] = useState(false);
  const [isNewDuenoOpen, setIsNewDuenoOpen] = useState(false);
  const [selectedUserForPin, setSelectedUserForPin] = useState<User | null>(null);
  const [newPinValue, setNewPinValue] = useState('');

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

  if (!isOpen || currentUser?.role !== 'superadmin') return null;

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
      setError('El PIN debe tener exactamente 4 dígitos.');
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 px-6 py-4 flex items-center justify-between text-white flex-shrink-0 border-b border-purple-800/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center space-x-2">
                <span>Panel de Control Superadministrador</span>
                <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/30 px-2 py-0.5 rounded-full font-mono">
                  Global
                </span>
              </h2>
              <p className="text-xs text-purple-200/70">
                Gestión de Sedes Comerciales, Dueños y Supervisión General
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white hover:bg-white/10 rounded-xl p-1.5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50 flex-shrink-0">
          <button
            onClick={() => setActiveTab('stores')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'stores'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <StoreIcon className="w-3.5 h-3.5" />
            <span>Sedes / Tiendas ({stores.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('duenos')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'duenos'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Dueños Registrados ({duenos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all-users')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'all-users'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Todo el Personal ({users.length})</span>
          </button>
        </div>

        {/* Feedback */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="font-semibold">{success}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: STORES */}
          {activeTab === 'stores' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Sedes Comerciales Activas
                </span>
                <button
                  onClick={() => setIsNewStoreOpen(!isNewStoreOpen)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:from-purple-700 hover:to-indigo-700 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isNewStoreOpen ? 'Cancelar' : '+ Nueva Sede'}</span>
                </button>
              </div>

              {/* Form Nueva Sede */}
              {isNewStoreOpen && (
                <form
                  onSubmit={handleCreateStore}
                  className="bg-purple-50/50 border border-purple-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150"
                >
                  <h4 className="text-xs font-bold text-purple-900 flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span>Registrar Nueva Sede Comercial</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Nombre de la Tienda / Sede *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. DisfrazArte - Sede San Miguel"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
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
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
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
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Moneda
                      </label>
                      <select
                        value={storeCurrency}
                        onChange={(e) => setStoreCurrency(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="$">Dólar ($)</option>
                        <option value="S/.">Soles (S/.)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsNewStoreOpen(false)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white rounded-xl transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                    >
                      {loading ? 'Guardando...' : 'Crear Sede'}
                    </button>
                  </div>
                </form>
              )}

              {/* Grid de Sedes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stores.map((s) => {
                  const storeDuenos = users.filter((u) => u.storeId === s.id && u.role === 'dueno');
                  const storeEmps = users.filter((u) => u.storeId === s.id && u.role === 'empleado');

                  return (
                    <div
                      key={s.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                            <StoreIcon className="w-4 h-4 text-purple-600" />
                            <span>{s.name}</span>
                          </h4>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {s.slug}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-slate-500 mt-2">
                          {s.address && (
                            <p className="flex items-center space-x-1.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{s.address}</span>
                            </p>
                          )}
                          {s.phone && (
                            <p className="flex items-center space-x-1.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{s.phone}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                        <span>Dueños: <strong>{storeDuenos.length}</strong></span>
                        <span>Empleados: <strong>{storeEmps.length}</strong></span>
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Dueños y Administradores de Sedes
                </span>
                <button
                  onClick={() => setIsNewDuenoOpen(!isNewDuenoOpen)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isNewDuenoOpen ? 'Cancelar' : '+ Registrar Dueño'}</span>
                </button>
              </div>

              {/* Form Nuevo Dueño */}
              {isNewDuenoOpen && (
                <form
                  onSubmit={handleCreateDueno}
                  className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150"
                >
                  <h4 className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>Registrar Nuevo Dueño de Sede</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
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
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Sede que Administrará *
                      </label>
                      <select
                        value={duenoStoreId}
                        onChange={(e) => setDuenoStoreId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
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
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-widest focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsNewDuenoOpen(false)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white rounded-xl transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || duenoPin.length !== 4}
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                    >
                      {loading ? 'Guardando...' : 'Registrar Dueño'}
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Dueños */}
              <div className="space-y-2">
                {duenos.map((d) => {
                  const store = stores.find((s) => s.id === d.storeId);
                  return (
                    <div
                      key={d.id}
                      className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold text-white text-sm">
                          {d.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              👑 Dueño
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            @{d.username} • Sede: <strong>{store?.name || d.storeId}</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserForPin(d);
                          setNewPinValue('');
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 transition cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Resetear PIN</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ALL USERS */}
          {activeTab === 'all-users' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Directorio Global de Usuarios
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {users.map((u) => {
                  const store = stores.find((s) => s.id === u.storeId);
                  const isSuper = u.role === 'superadmin';
                  const isDueno = u.role === 'dueno';

                  return (
                    <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white ${
                            isSuper
                              ? 'bg-slate-900'
                              : isDueno
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
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
                          className="text-xs font-bold text-slate-600 hover:text-purple-700 bg-slate-100 hover:bg-purple-50 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Resetear PIN
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inline Reset PIN Prompt */}
          {selectedUserForPin && (
            <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
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

        </div>
      </div>
    </div>
  );
};
