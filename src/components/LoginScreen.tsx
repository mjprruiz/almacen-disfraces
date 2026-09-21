'use client';

import React, { useState, useEffect } from 'react';
import { Store, User } from '@/lib/types';
import {
  Sparkles,
  Store as StoreIcon,
  User as UserIcon,
  Lock,
  ArrowLeft,
  Delete,
  AlertCircle,
  ShieldCheck,
  Crown,
  Shield,
  Key,
} from 'lucide-react';

interface LoginScreenProps {
  stores: Store[];
  users: User[];
  onLoginSuccess: (user: User, store: Store) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  stores,
  users,
  onLoginSuccess,
}) => {
  const [isSuperadminMode, setIsSuperadminMode] = useState<boolean>(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Superadmin credentials
  const [adminUsername, setAdminUsername] = useState('superadmin');
  const [adminPassword, setAdminPassword] = useState('');

  // Pre-select the first store by default
  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const activeStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

  // Filter active users for the chosen store
  const storeUsers = users.filter(
    (u) => u.storeId === selectedStoreId && u.active !== false && u.role !== 'superadmin'
  );

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setPin('');
    setError('');
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setPin('');
    setError('');
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        attemptLogin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const attemptLogin = async (pinToVerify: string) => {
    if (!selectedUser || !activeStore) return;
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          pin: pinToVerify,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'PIN incorrecto');
        setPin('');
        return;
      }

      onLoginSuccess(data.user, activeStore);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleSuperadminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Credenciales de superadministrador incorrectas');
        return;
      }

      onLoginSuccess(data.user, data.store || activeStore || stores[0]);
    } catch (err: any) {
      setError(err.message || 'Error al conectar');
    } finally {
      setLoading(false);
    }
  };

  // Allow physical keyboard typing when in PIN mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSuperadminMode) return;
      if (!selectedUser) return;
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser, pin, isSuperadminMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      
      {/* Brand Header */}
      <div className="text-center mb-6 space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 shadow-xl shadow-purple-500/25 mb-1">
          <Sparkles className="w-7 h-7 text-white animate-pulse" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Almacén Disfraces
        </h1>
        <p className="text-xs sm:text-sm text-purple-200/70 font-medium">
          Sistema de Control de Inventario, Alquileres y Caja
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-white/20 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODE 1: SUPERADMIN LOGIN (Username + Password) */}
        {isSuperadminMode ? (
          <form onSubmit={handleSuperadminSubmit} className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsSuperadminMode(false);
                  setError('');
                }}
                className="flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a acceso con PIN</span>
              </button>
              <span className="text-[10px] font-mono uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                Superadmin
              </span>
            </div>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Acceso Superadministrador</h3>
              <p className="text-xs text-slate-500">Gestión global de tiendas y registro de dueños</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Usuario
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500 outline-none text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Verificando...' : 'Ingresar como Superadministrador'}
            </button>
          </form>
        ) : (
          /* MODE 2: COUNTER / OWNER LOGIN WITH PIN */
          !selectedUser ? (
            <div className="p-6 space-y-5">
              {/* Store Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <StoreIcon className="w-3.5 h-3.5 text-purple-600" />
                  <span>Selecciona la Sede / Tienda</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {stores.map((s) => {
                    const isSelected = s.id === selectedStoreId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStoreId(s.id);
                          setError('');
                        }}
                        className={`w-full text-left px-4 py-3 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 text-purple-900 font-bold shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              isSelected ? 'bg-purple-600 ring-4 ring-purple-200' : 'bg-slate-300'
                            }`}
                          />
                          <span className="text-sm">{s.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {users.filter((u) => u.storeId === s.id && u.active !== false && u.role !== 'superadmin').length} usuarios
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Users of selected store */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-purple-600" />
                  <span>¿Quién está ingresando?</span>
                </label>

                {storeUsers.length === 0 ? (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 text-center">
                    No hay usuarios activos registrados para esta sede.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {storeUsers.map((u) => {
                      const isDueno = u.role === 'dueno';
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          className="w-full text-left p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-purple-50/70 hover:border-purple-300 transition flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm ${
                                isDueno
                                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                                  : 'bg-gradient-to-tr from-blue-500 to-indigo-600'
                              }`}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition">
                                {u.name}
                              </h4>
                              <span className="text-[11px] text-slate-400">
                                Usuario: @{u.username}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                                isDueno
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isDueno && <Crown className="w-3 h-3 mr-0.5 text-amber-600" />}
                              <span>{isDueno ? 'Dueño' : 'Mostrador'}</span>
                            </span>
                            <Lock className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* PIN Entry Screen */
            <div className="p-6 space-y-6">
              
              {/* Top Bar with User Info & Back */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <button
                  type="button"
                  onClick={handleBackToUsers}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer p-1 -ml-1 rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Cambiar usuario</span>
                </button>

                <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-2.5 py-1 rounded-full">
                  {activeStore.name}
                </span>
              </div>

              {/* User Profile Header */}
              <div className="text-center space-y-2">
                <div
                  className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg ${
                    selectedUser.role === 'dueno'
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/20'
                      : 'bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-blue-500/20'
                  }`}
                >
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {selectedUser.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Ingresa tu PIN de 4 dígitos para acceder
                </p>
              </div>

              {/* PIN Dots Display */}
              <div className="flex justify-center items-center space-x-3 py-2">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all duration-150 ${
                        filled
                          ? 'bg-purple-600 scale-125 ring-4 ring-purple-100'
                          : 'bg-slate-200'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Numeric Keypad (for touchscreens or mouse) */}
              <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(String(num))}
                    disabled={loading}
                    className="h-12 rounded-2xl bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-800 font-black text-lg transition active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading || pin.length === 0}
                  className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-200 text-slate-500 font-bold text-xs transition active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-30"
                >
                  Limpiar
                </button>

                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  disabled={loading}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-800 font-black text-lg transition active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading || pin.length === 0}
                  className="h-12 rounded-2xl bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 font-bold text-xs transition active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-30"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              {/* Forgot PIN Note */}
              <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-400">
                  ¿Olvidaste tu PIN? Solicita al <strong>Dueño / Administrador</strong> que lo restablezca desde su panel.
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Footer Info & Superadmin Switcher */}
      <div className="mt-8 flex flex-col items-center space-y-2 text-center">
        {!isSuperadminMode && (
          <button
            type="button"
            onClick={() => {
              setIsSuperadminMode(true);
              setError('');
            }}
            className="text-xs text-purple-300/80 hover:text-white font-semibold transition flex items-center space-x-1.5 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Acceso Superadministrador (con Contraseña)</span>
          </button>
        )}

        <div className="text-xs text-purple-300/60 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Acceso protegido por rol y sede comercial</span>
        </div>
      </div>
    </div>
  );
};
