'use client';

import React, { useState } from 'react';
import { User, Store } from '@/lib/types';
import {
  X,
  FlaskConical,
  Key,
  Shield,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';

interface TestGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  stores: Store[];
  currentUser: User | null;
  onSelectUserAndStore: (user: User, store: Store) => void;
}

export const TestGuideModal: React.FC<TestGuideModalProps> = ({
  isOpen,
  onClose,
  users,
  stores,
  currentUser,
  onSelectUserAndStore,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'scenarios'>('scenarios');

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 1,
      title: '🔴 Caso 1: Alquiler con Retraso (Mora de 3 días)',
      badge: 'Retrasado',
      badgeColor: 'bg-red-100 text-red-800 border-red-200',
      description: 'Disfraz Spiderman Clásico a Juan Pérez (Ticket ALQ-1002). Venció hace 3 días.',
      howToTest: [
        'Ve a la pestaña "Mostrador & Alquileres" y filtra por "Con Retraso".',
        'Haz clic en el botón verde "WhatsApp": se abrirá el mensaje redactado formalmente exigiendo la devolución y advirtiendo recargos.',
        'Haz clic en "Devolver" para aplicar un recargo de mora (ej. $5) y verificar que el Spiderman vuelva al stock disponible.',
      ],
    },
    {
      id: 2,
      title: '🟡 Caso 2: Alquiler que Vence HOY',
      badge: 'Vence Hoy',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'Vestido de Princesa a María López (Ticket ALQ-1001). Fecha de vencimiento pactada: HOY.',
      howToTest: [
        'En la pestaña "Mostrador", filtra por "Vencen Hoy".',
        'Observa el aviso preventivo para el personal de mostrador.',
        'Prueba el botón de WhatsApp con el recordatorio cordial de entrega para hoy.',
      ],
    },
    {
      id: 3,
      title: '🟢 Caso 3: Alquiler En Plazo (A Futuro)',
      badge: 'En Plazo',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Disfraz de Bruja Hechicera a Carlos Mendoza (Ticket ALQ-1003). Quedan 3 días para su devolución.',
      howToTest: [
        'Verifica que el estado indique "En Plazo (3 d restantes)".',
        'Garantía registrada: $20 en efectivo en custodia.',
      ],
    },
    {
      id: 4,
      title: '📄 Caso 4: Garantía con Retención de DNI Físico',
      badge: 'Garantía DNI',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Traje de Pirata a Lucía Fernández (Ticket ALQ-1004). El cliente no dejó efectivo, sino su documento físico.',
      howToTest: [
        'Al hacer clic en "Devolver", el sistema recuerda: "Entregar el DNI / Documento físico retenido al cliente".',
        'Evita confusiones de caja en el mostrador.',
      ],
    },
    {
      id: 5,
      title: '🚫 Caso 5: Disfraz Totalmente Agotado (Validación)',
      badge: 'Stock Cero',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      description: 'Dinosaurio T-Rex Inflable (DISF005). Tenía 2 unidades en total y las 2 están actualmente alquiladas.',
      howToTest: [
        'Ve a "Catálogo de Disfraces" y busca "T-Rex": verás "Agotado temporalmente".',
        'Haz clic en "+ Nuevo Alquiler" y abre la lista de disfraces: el T-Rex aparece deshabilitado con la etiqueta (AGOTADO) para evitar sobre-alquilarlo.',
      ],
    },
    {
      id: 6,
      title: '🔒 Caso 6: Prueba de Seguridad de Roles (Anti-Manipulación)',
      badge: 'Seguridad',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'Evitar que el empleado vea los costos de compra, las ganancias netas o borre el historial.',
      howToTest: [
        'En la barra superior, cambia el perfil activo a "👤 Luis Gómez (Empleado)".',
        'Intenta hacer clic en la pestaña "Dashboard Financiero": el sistema mostrará la pantalla de bloqueo de seguridad.',
        'Ve a "Catálogo de Disfraces": los "Costos de Compra" están ocultos y el botón de agregar/editar catálogo no existe para el empleado.',
      ],
    },
    {
      id: 7,
      title: '🏪 Caso 7: Multi-Tienda Familiar (Aislamiento Total)',
      badge: 'Multi-Tienda',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: '3 tiendas familiares en 1 sola app sin cruzar datos de disfraces, clientes ni dinero.',
      howToTest: [
        'En la barra superior cambia a "Fantasía Real - Sede Norte".',
        'Verás que los disfraces (Batman, Merlina) y los clientes pertenecen exclusivamente a esa sede.',
        'Cambia a "Mundo Mágico - Sede Sur" para ver los de esa sede.',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-purple-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Guía de Pruebas y Credenciales</h2>
              <p className="text-xs text-purple-200/80">Entorno local con datos de demostración precargados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-200 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subnav */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50 flex-shrink-0">
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 ${
              activeTab === 'scenarios'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Los 7 Casos de Prueba Preparados</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 ${
              activeTab === 'users'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Usuarios y Roles por Tienda (6 Perfiles)</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: SCENARIOS */}
          {activeTab === 'scenarios' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 bg-purple-50 p-3 rounded-xl border border-purple-100">
                💡 <strong>Consejo:</strong> Hemos precargado estos 7 casos reales en la <strong>Sede Centro</strong> para que puedas probar todas las funcionalidades y validar cómo responde el sistema ante alquileres vencidos, garantías, disfraces agotados y permisos.
              </p>

              <div className="space-y-3">
                {scenarios.map((sc) => (
                  <div
                    key={sc.id}
                    className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 hover:bg-white transition shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{sc.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.badgeColor}`}>
                        {sc.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">{sc.description}</p>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/60 text-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider block">
                        ¿Cómo probarlo?
                      </span>
                      <ul className="space-y-1 text-slate-600">
                        {sc.howToTest.map((step, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Puedes cambiar de usuario en cualquier momento desde este menú o desde la barra superior para verificar cómo cambian los permisos y las restricciones de seguridad:
              </p>

              <div className="space-y-4">
                {stores.map((st) => {
                  const storeUsers = users.filter((u) => u.storeId === st.id);

                  return (
                    <div key={st.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="font-bold text-slate-900 text-sm">{st.name}</span>
                        <span className="text-[11px] text-slate-500">{st.address}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {storeUsers.map((u) => {
                          const isCurrent = currentUser?.id === u.id;
                          const isDueno = u.role === 'dueno';

                          return (
                            <div
                              key={u.id}
                              className={`p-3 rounded-xl border transition flex flex-col justify-between space-y-2 ${
                                isCurrent
                                  ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-200'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">{u.name}</span>
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                      isDueno
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {isDueno ? '👑 Dueño' : '👤 Empleado'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-mono mt-1">
                                  Usuario: <strong>{u.username}</strong> | PIN: <strong>{u.pin || '1234'}</strong>
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  onSelectUserAndStore(u, st);
                                  onClose();
                                }}
                                disabled={isCurrent}
                                className={`w-full text-center py-1.5 rounded-lg text-xs font-bold transition ${
                                  isCurrent
                                    ? 'bg-purple-600 text-white cursor-default'
                                    : 'bg-slate-100 text-slate-700 hover:bg-purple-100 hover:text-purple-800 cursor-pointer'
                                }`}
                              >
                                {isCurrent ? 'Activo actualmente' : 'Usar este perfil'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
          >
            Cerrar Guía
          </button>
        </div>
      </div>
    </div>
  );
};
