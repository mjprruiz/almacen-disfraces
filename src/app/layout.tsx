import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sistema de Alquiler e Inventario de Disfraces',
  description: 'Control de inventario, alquileres, devoluciones, clientes y finanzas multi-tienda',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-purple-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
