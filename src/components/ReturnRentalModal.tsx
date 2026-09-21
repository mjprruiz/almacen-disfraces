'use client';

import React, { useState } from 'react';
import { Rental } from '@/lib/types';
import { X, CheckCircle, AlertTriangle, RotateCcw, DollarSign } from 'lucide-react';

interface ReturnRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: Rental | null;
  onSubmit: (params: {
    rentalId: string;
    penaltyAmount: number;
    returnNotes: string;
  }) => Promise<void>;
}

export const ReturnRentalModal: React.FC<ReturnRentalModalProps> = ({
  isOpen,
  onClose,
  rental,
  onSubmit,
}) => {
  const [penaltyAmount, setPenaltyAmount] = useState<number>(0);
  const [returnNotes, setReturnNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !rental) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = rental.dueDate < todayStr;
  
  // Calculate days difference
  const due = new Date(rental.dueDate + 'T00:00:00');
  const today = new Date(todayStr + 'T00:00:00');
  const diffDays = Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await onSubmit({
        rentalId: rental.id,
        penaltyAmount: Number(penaltyAmount),
        returnNotes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar la devolución');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-emerald-200" />
            <h2 className="text-lg font-bold">Registrar Devolución</h2>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Summary Card */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-800 text-sm">{rental.ticketCode}</span>
              <span className="text-slate-500">Alquilado el: {rental.rentalDate}</span>
            </div>

            <div className="text-slate-700">
              <p><strong>Disfraz:</strong> {rental.productName} [{rental.productSize}]</p>
              <p><strong>Cliente:</strong> {rental.clientName} (Tel: {rental.clientPhone})</p>
              <p><strong>Fecha Límite:</strong> {rental.dueDate}</p>
            </div>

            {/* Guarantee status info */}
            <div className="pt-1 text-slate-600 flex justify-between items-center">
              <span>Garantía en resguardo:</span>
              <span className="font-semibold text-emerald-700">
                {rental.guaranteeType === 'efectivo_y_documento' || (rental.guaranteeAmount > 0 && rental.guaranteeType === 'documento')
                  ? `$${rental.guaranteeAmount} en efectivo + DNI físico`
                  : rental.guaranteeType === 'efectivo'
                  ? `$${rental.guaranteeAmount} en efectivo`
                  : rental.guaranteeType === 'documento'
                  ? 'DNI / Documento físico'
                  : 'Ninguna'}
              </span>
            </div>
          </div>

          {/* Overdue alert */}
          {isOverdue && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Alquiler con retraso de {diffDays} día(s).</strong>
                <p className="mt-0.5 text-amber-700">Puedes aplicar un recargo por mora si corresponde según las políticas de la tienda.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Penalidad por mora o daños */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Recargo por Mora o Daños ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={penaltyAmount}
                  onChange={(e) => setPenaltyAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Si cobras penalidad, se sumará automáticamente a la caja de la tienda.
              </p>
            </div>

            {/* Observaciones de devolución */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Estado del Disfraz / Observaciones
              </label>
              <textarea
                rows={2}
                placeholder="Ej. Prenda completa, sin roturas, limpio..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Resumen de devolución de garantía */}
            {(rental.guaranteeType === 'efectivo_y_documento' || (rental.guaranteeAmount > 0 && rental.guaranteeType === 'documento')) && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                <p className="font-bold">Recordatorio para mostrador:</p>
                <p>1. Entregar los <strong>${rental.guaranteeAmount}</strong> de garantía en efectivo al cliente
                  {penaltyAmount > 0 ? ` (restando los $${penaltyAmount} de penalidad: devolver $${Math.max(0, rental.guaranteeAmount - penaltyAmount)})` : ''}.
                </p>
                <p>2. Devolver el <strong>DNI / Documento físico</strong> retenido al cliente.</p>
              </div>
            )}
            {rental.guaranteeType === 'efectivo' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <strong>Recordatorio para mostrador:</strong> Entregar los <strong>${rental.guaranteeAmount}</strong> de garantía de vuelta al cliente
                {penaltyAmount > 0 ? ` (restando los $${penaltyAmount} de penalidad: devolver $${Math.max(0, rental.guaranteeAmount - penaltyAmount)})` : ''}.
              </div>
            )}
            {rental.guaranteeType === 'documento' && rental.guaranteeAmount === 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <strong>Recordatorio para mostrador:</strong> Entregar el <strong>DNI / Documento físico</strong> retenido al cliente (no se retuvo efectivo).
              </div>
            )}

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-50 flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{loading ? 'Procesando...' : 'Confirmar Devolución'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
