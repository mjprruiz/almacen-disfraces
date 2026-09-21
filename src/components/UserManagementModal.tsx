'use client';

import React, { useState } from 'react';
import { User, Store } from '@/lib/types';
import {
  X,
  Users,
  UserPlus,
  KeyRound,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Crown,
  UserCheck,
  UserX,
  RefreshCw,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  stores: Store[];
  users: User[];
  onRefreshUsers: () => Promise<void>;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  stores,
  users,
  onRefreshUsers,
}) => {
  // Tabs: 'list' | 'new' | 'reset-pin' | 'edit'
  const [view, setView] = useState<'list' | 'new' | 'reset-pin' | 'edit'>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states for New User
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newStoreId, setNewStoreId] = useState(stores[0]?.id || '');
  const [newRole, setNewRole] = useState<'dueno' | 'empleado'>('empleado');
  const [newPin, setNewPin] = useState('');

  // Form state for Reset PIN
  const [resetPinValue, setResetPinValue] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen || currentUser?.role !== 'dueno') return null;

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
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
          creatorUserId: currentUser.id,
          userRole: currentUser.role,
          storeId: currentUser.storeId,
          name: newName.trim(),
          username: newUsername.trim(),
          role: 'empleado',
          pin: newPin,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear usuario');

      showSuccess(`¡Empleado/a ${data.user.name} creado exitosamente con PIN ${newPin}!`);
      setNewName('');
      setNewUsername('');
      setNewPin('');
      setView('list');
      await onRefreshUsers();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!/^\d{4}$/.test(resetPinValue)) {
      setError('El nuevo PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          userRole: currentUser.role,
          userId: selectedUser.id,
          newPin: resetPinValue,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al resetear PIN');

      showSuccess(`¡PIN de ${selectedUser.name} actualizado a: ${resetPinValue}!`);
      setResetPinValue('');
      setSelectedUser(null);
      setView('list');
      await onRefreshUsers();
    } catch (err: any) {
      setError(err.message || 'Error al resetear PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      setLoading(true);
      setError('');
      const nextActive = user.active === false ? true : false;
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          userRole: currentUser.role,
          userId: user.id,
          updates: { active: nextActive },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar estado');

      showSuccess(
        nextActive
          ? `Usuario ${user.name} activado.`
          : `Usuario ${user.name} desactivado.`
      );
      await onRefreshUsers();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Gestión de Usuarios y Personal</h2>
              <p className="text-xs text-purple-200/80">
                Control de accesos, creación de empleados y restablecimiento de PINs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-200 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Body Views */}
        <div className="p-6">
          
          {/* VIEW: List of Users */}
          {view === 'list' && (() => {
            const storeUsers = users.filter((u) => u.storeId === currentUser.storeId);
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Personal de mi Sede ({storeUsers.length})
                  </span>
                  <button
                    onClick={() => {
                      setView('new');
                      setError('');
                    }}
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Nuevo Empleado</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                  {storeUsers.map((u) => {
                    const store = stores.find((s) => s.id === u.storeId);
                    const isDueno = u.role === 'dueno';
                    const isActive = u.active !== false;

                    return (
                      <div
                        key={u.id}
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50 transition ${
                          !isActive ? 'opacity-60 bg-slate-50' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white ${
                              isDueno
                                ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                                : 'bg-gradient-to-tr from-blue-500 to-indigo-600'
                            }`}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-slate-900 text-sm">{u.name}</h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-0.5 ${
                                  isDueno
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {isDueno && <Crown className="w-2.5 h-2.5 mr-0.5" />}
                                <span>{isDueno ? 'Dueño' : 'Mostrador'}</span>
                              </span>
                              {!isActive && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              @{u.username} • Sede: <strong>{store?.name || u.storeId}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setResetPinValue('');
                              setError('');
                              setView('reset-pin');
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200 transition cursor-pointer"
                            title="Cambiar o restablecer PIN de acceso"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                            <span>Resetear PIN</span>
                          </button>

                          {u.id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(u)}
                              className={`p-1.5 rounded-lg border transition cursor-pointer text-xs ${
                                isActive
                                  ? 'bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-700 border-slate-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                              title={isActive ? 'Desactivar usuario' : 'Reactivar usuario'}
                            >
                              {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* VIEW: New User Form */}
          {view === 'new' && (
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-purple-600" />
                  <span>Registrar Nuevo Empleado</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Volver a la lista
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pedro Castillo"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre de Usuario (Login) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. pedro_mostrador"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sede Asignada
                  </label>
                  <div className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                    {stores.find((s) => s.id === currentUser.storeId)?.name || 'Mi Sede'}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Rol de Acceso
                  </label>
                  <div className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                    Empleado (Mostrador de Alquileres)
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    PIN Inicial de Acceso (4 dígitos) *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="Ej. 1234"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full max-w-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-widest focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Este será el PIN numérico de 4 dígitos con el que iniciará sesión en el mostrador.
                  </span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: Reset PIN Form */}
          {view === 'reset-pin' && selectedUser && (
            <form onSubmit={handleResetPin} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Restablecer PIN de {selectedUser.name}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setView('list');
                    setSelectedUser(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Volver a la lista
                </button>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <p className="text-xs text-amber-900">
                  Ingresa el nuevo <strong>PIN de 4 dígitos</strong> para el usuario <strong>@{selectedUser.username}</strong>.
                  El usuario podrá ingresar inmediatamente con esta nueva clave.
                </p>

                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                    Nuevo PIN (4 dígitos) *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    autoFocus
                    placeholder="Ej. 4321"
                    value={resetPinValue}
                    onChange={(e) => setResetPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-48 px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-base font-mono font-black tracking-widest focus:ring-2 focus:ring-amber-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setView('list');
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || resetPinValue.length !== 4}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Guardando...' : 'Confirmar Nuevo PIN'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
