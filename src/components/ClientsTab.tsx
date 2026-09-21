'use client';

import React, { useState, useMemo } from 'react';
import { Client, Rental, Store } from '@/lib/types';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import {
  Search,
  UserPlus,
  Phone,
  CreditCard,
  MapPin,
  MessageCircle,
  ShoppingBag,
  Users,
} from 'lucide-react';

interface ClientsTabProps {
  clients: Client[];
  rentals: Rental[];
  currentStore?: Store | null;
  onOpenNewClient: () => void;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({
  clients,
  rentals,
  currentStore,
  onOpenNewClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Map of client rentals count
  const clientStats = useMemo(() => {
    const map: Record<string, { total: number; active: number }> = {};
    rentals.forEach((r) => {
      if (!map[r.clientId]) {
        map[r.clientId] = { total: 0, active: 0 };
      }
      map[r.clientId].total += 1;
      if (r.status !== 'devuelto') {
        map[r.clientId].active += 1;
      }
    });
    return map;
  }, [rentals]);

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const q = searchTerm.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.dni && c.dni.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [clients, searchTerm]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
            Directorio de Clientes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Registro de clientes frecuentes, contactos de WhatsApp e historial de fidelidad.
          </p>
        </div>

        <button
          onClick={onOpenNewClient}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <UserPlus className="w-5 h-5" />
          <span>Registrar Cliente</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((c) => {
          const stats = clientStats[c.id] || { total: 0, active: 0 };
          const storeName = currentStore?.name || 'la tienda de disfraces';
          const message = stats.active > 0
            ? `Hola ${c.name}, te saludamos de *${storeName}*. Nos comunicamos con respecto a tu alquiler de disfraz en curso. ¿Tienes alguna consulta o necesitas coordinar la fecha de entrega?`
            : `Hola ${c.name}, te saludamos de *${storeName}*. Esperamos que te encuentres bien. ¿En qué podemos ayudarte el día de hoy?`;
          const whatsappUrl = buildWhatsAppUrl(c.phone, message);

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
                    {c.name}
                  </h3>
                  {stats.active > 0 && (
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      {stats.active} alquiler activo
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.phone}</span>
                  </div>

                  {c.dni && (
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>DNI / Cédula: <strong>{c.dni}</strong></span>
                    </div>
                  )}

                  {c.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}
                </div>

                {c.notes && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                    "{c.notes}"
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Total alquileres: <strong>{stats.total}</strong>
                </span>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
                  title={`Abrir WhatsApp con ${c.name} (${c.phone})`}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Enviar WhatsApp</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
