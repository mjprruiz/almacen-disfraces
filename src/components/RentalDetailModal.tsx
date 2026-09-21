'use client';

import React from 'react';
import { Rental } from '@/lib/types';
import {
  X,
  FileText,
  Calendar,
  User as UserIcon,
  Phone,
  CreditCard,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Package,
  MessageCircle,
  Shield,
  Sparkles,
} from 'lucide-react';

interface RentalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: Rental | null;
  onOpenReturn?: (rental: Rental) => void;
}

export const RentalDetailModal: React.FC<RentalDetailModalProps> = ({
  isOpen,
  onClose,
  rental,
  onOpenReturn,
}) => {
  if (!isOpen || !rental) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const isReturned = rental.status === 'devuelto';
  const isOverdue = !isReturned && rental.dueDate < todayStr;
  const isDueToday = !isReturned && rental.dueDate === todayStr;

  // Clean WhatsApp phone
  const cleanPhone = rental.clientPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(
    `Hola ${rental.clientName}, te saludamos de Almacén de Disfraces sobre tu alquiler ${rental.ticketCode}.`
  )}`;

  const totalGarments = rental.totalQuantity || (rental.items ? rental.items.reduce((s, it) => s + it.quantity, 0) : 1);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <FileText className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight">{rental.ticketCode}</h2>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isReturned
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : isOverdue
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : isDueToday
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isReturned
                    ? 'Devuelto'
                    : isOverdue
                    ? 'Con Retraso'
                    : isDueToday
                    ? 'Vence Hoy'
                    : 'En Plazo'}
                </span>
              </div>
              <p className="text-xs text-purple-200/70">Ficha Detallada del Alquiler</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white hover:bg-white/10 p-2 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* Client Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <UserIcon className="w-3.5 h-3.5 mr-1 text-purple-600" />
                Cliente Responsable
              </span>
              {rental.clientPhone && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold border border-emerald-200 transition cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-slate-400 block text-[10px]">Nombre Completo</span>
                <span className="font-bold text-sm text-slate-900">{rental.clientName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">DNI / Documento</span>
                <span className="font-semibold text-slate-800">{rental.clientDni || 'No registrado'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Teléfono de Contacto</span>
                <span className="font-semibold text-slate-800">{rental.clientPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Atendido por</span>
                <span className="font-semibold text-slate-800">{rental.userName}</span>
              </div>
            </div>
          </div>

          {/* Dates Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 shadow-2xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha de Salida</span>
              <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">
                {rental.rentalDate}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha Límite</span>
              <span
                className={`font-mono font-bold text-xs mt-0.5 block ${
                  isOverdue ? 'text-red-600' : isDueToday ? 'text-amber-600' : 'text-slate-800'
                }`}
              >
                {rental.dueDate}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Estado Entrega</span>
              <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                {isReturned ? `Devuelto el ${rental.returnDate || ''}` : 'Pendiente en mostrador'}
              </span>
            </div>
          </div>

          {/* Costumes / Items List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <Package className="w-3.5 h-3.5 mr-1 text-purple-600" />
                Prendas en este Alquiler ({totalGarments})
              </span>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                {totalGarments > 1 ? `${totalGarments} trajes en total` : '1 traje'}
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
              {rental.items && rental.items.length > 0 ? (
                rental.items.map((it, idx) => (
                  <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                        {it.quantity}x
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{it.productName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Código: {it.productCode} • Talla: <strong>{it.productSize}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800 text-xs">${(it.unitPrice * it.quantity).toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 block">(${it.unitPrice.toFixed(2)} c/u)</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-white flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                      1x
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{rental.productName}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Código: {rental.productCode} • Talla: <strong>{rental.productSize}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 text-xs">${rental.rentalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Totals Card */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 border border-purple-200 rounded-2xl p-4 space-y-3">
            {rental.discount && rental.discount > 0 ? (
              <div className="space-y-1 pb-2 border-b border-purple-100">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Subtotal Prendas:</span>
                  <span className="font-semibold font-mono">
                    ${(rental.subtotal ?? (rental.rentalPrice + rental.discount)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-amber-700 font-medium">
                  <span>Descuento Especial Aplicado:</span>
                  <span className="font-bold font-mono">-${rental.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-purple-200/60">
                  <span className="text-purple-900 font-bold">Total Alquiler a Pagar:</span>
                  <span className="font-black text-base text-purple-950">${rental.rentalPrice.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center text-xs pb-2 border-b border-purple-100">
                <div>
                  <span className="text-purple-900 font-bold block text-xs">Total Alquiler a Pagar:</span>
                  <span className="text-[10px] text-purple-700">Monto cobrado por el servicio de alquiler</span>
                </div>
                <span className="font-black text-base text-purple-950">${rental.rentalPrice.toFixed(2)}</span>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Garantía Retenida en Custodia:
              </span>

              {rental.guaranteeType === 'efectivo_y_documento' || (rental.guaranteeAmount > 0 && rental.guaranteeType === 'documento') ? (
                <div className="bg-white border border-emerald-300 rounded-xl p-3 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-bold flex items-center">
                      💵 Efectivo en Garantía:
                    </span>
                    <span className="font-black text-sm text-emerald-700">${rental.guaranteeAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-blue-800 font-bold flex items-center">
                      🪪 Documento Físico:
                    </span>
                    <span className="font-semibold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      DNI en custodia
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-800 font-medium bg-emerald-50/80 p-1.5 rounded-lg mt-1">
                    ⚠️ <strong>Al devolver las prendas:</strong> Devolver los ${rental.guaranteeAmount.toFixed(2)} en efectivo y entregar el DNI físico al cliente.
                  </p>
                </div>
              ) : rental.guaranteeType === 'efectivo' ? (
                <div className="bg-white border border-emerald-300 rounded-xl p-3 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-bold flex items-center">
                      💵 Efectivo retenido:
                    </span>
                    <span className="font-black text-sm text-emerald-700">${rental.guaranteeAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-emerald-800 font-medium bg-emerald-50/80 p-1.5 rounded-lg mt-1.5">
                    ⚠️ <strong>Al devolver las prendas:</strong> Devolver los ${rental.guaranteeAmount.toFixed(2)} en efectivo al cliente.
                  </p>
                </div>
              ) : rental.guaranteeType === 'documento' ? (
                <div className="bg-white border border-blue-300 rounded-xl p-3 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-800 font-bold flex items-center">
                      🪪 Documento retenido:
                    </span>
                    <span className="font-semibold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      DNI Físico en custodia
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-800 font-medium bg-blue-50/80 p-1.5 rounded-lg mt-1.5">
                    ⚠️ <strong>Al devolver las prendas:</strong> Entregar el DNI físico al cliente (No se retuvo dinero en efectivo).
                  </p>
                </div>
              ) : (
                <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 italic">
                  Sin garantía retenida (Cliente exonerado o de confianza).
                </div>
              )}
            </div>

            {rental.penaltyAmount && rental.penaltyAmount > 0 ? (
              <div className="flex justify-between items-center text-xs text-red-700 border-t border-purple-200 pt-2 font-bold">
                <span>Penalidad por Mora / Daños cobrada:</span>
                <span>+${rental.penaltyAmount.toFixed(2)}</span>
              </div>
            ) : null}
          </div>

          {/* Notes */}
          {rental.notes && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600">
              <span className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                Notas y Observaciones
              </span>
              <p className="leading-relaxed">{rental.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>

          {!isReturned && onOpenReturn && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenReturn(rental);
              }}
              className="px-5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Procesar Devolución</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
