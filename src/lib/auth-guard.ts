import { db } from '@/lib/db';
import { User, UserRole } from '@/lib/types';

export interface StoreAccessResult {
  allowed: boolean;
  user?: User;
  error?: string;
  statusCode: number;
}

/**
 * Valida que un usuario tenga permiso para operar sobre una sede (storeId) específica.
 * - Superadmin tiene acceso universal.
 * - Dueño y Empleado solo tienen acceso a su propia sede (user.storeId === storeId).
 * - Opcionalmente valida que el rol coincida con requiredRole.
 */
export function validateStoreAccess(params: {
  storeId: string;
  userId?: string | null;
  requiredRole?: UserRole;
}): StoreAccessResult {
  const { storeId, userId, requiredRole } = params;

  if (!userId) {
    return {
      allowed: false,
      error: 'Acceso no autorizado: se requiere identificación de usuario.',
      statusCode: 401,
    };
  }

  const user = db.getUserById(userId);
  if (!user || user.active === false) {
    return {
      allowed: false,
      error: 'Usuario no encontrado o cuenta desactivada.',
      statusCode: 401,
    };
  }

  // Superadmin has universal access
  if (user.role === 'superadmin') {
    return { allowed: true, user, statusCode: 200 };
  }

  // Aislamiento de Sede: Dueño y Empleado solo pueden acceder a su sede asignada
  if (user.storeId !== storeId) {
    return {
      allowed: false,
      error: 'Acceso denegado: no tienes permisos para consultar o modificar datos de otra sede.',
      statusCode: 403,
    };
  }

  // Validación de Rol Requerido
  if (requiredRole && user.role !== requiredRole) {
    return {
      allowed: false,
      error: `Acceso denegado: esta operación requiere permisos de rol "${requiredRole}".`,
      statusCode: 403,
    };
  }

  return { allowed: true, user, statusCode: 200 };
}
