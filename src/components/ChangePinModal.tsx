'use client';

import React, { useState } from 'react';
import { User } from '@/lib/types';
import { X, KeyRound, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onPinChanged: (updatedUser: User) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPinChanged,
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('El nuevo PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('El nuevo PIN y su confirmación no coinciden.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-pin',
          userId: currentUser.id,
          currentPin,
          newPin,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar PIN');

      setSuccess(true);
      onPinChanged(data.user);
      setTimeout(() => {
        setSuccess(false);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-purple-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Cambiar mi PIN</h2>
              <p className="text-xs text-purple-200/80">Personaliza tu clave de 4 dígitos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-200 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
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
            <span className="font-semibold">¡PIN actualizado exitosamente!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              PIN Actual *
            </label>
            <input
              type="password"
              maxLength={4}
              required
              autoFocus
              placeholder="••••"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-center text-lg font-mono font-black tracking-widest focus:ring-2 focus:ring-purple-500 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nuevo PIN (4 dígitos) *
            </label>
            <input
              type="password"
              maxLength={4}
              required
              placeholder="••••"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-center text-lg font-mono font-black tracking-widest focus:ring-2 focus:ring-purple-500 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Confirmar Nuevo PIN *
            </label>
            <input
              type="password"
              maxLength={4}
              required
              placeholder="••••"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-center text-lg font-mono font-black tracking-widest focus:ring-2 focus:ring-purple-500 outline-none text-slate-800"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Guardar Nuevo PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
