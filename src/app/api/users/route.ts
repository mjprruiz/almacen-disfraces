import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateStoreAccess } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get('storeId') || undefined;
    const userId = searchParams.get('userId');

    // Si se pasa userId, validar que si no es superadmin, solo vea usuarios de su sede
    if (userId) {
      const requestingUser = db.getUserById(userId);
      if (requestingUser && requestingUser.role !== 'superadmin') {
        const users = db.getUsers(requestingUser.storeId);
        return NextResponse.json({ users });
      }
    }

    const users = db.getUsers(storeIdParam);
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Caso Especial: Cambio de PIN por cuenta propia (Auto-servicio)
    if (body.action === 'change-pin') {
      const { userId, currentPin, newPin } = body;
      if (!userId || !currentPin || !newPin) {
        return NextResponse.json(
          { error: 'Se requiere ID de usuario, PIN actual y nuevo PIN.' },
          { status: 400 }
        );
      }
      const updatedUser = db.changeUserPin(userId, currentPin, newPin);
      return NextResponse.json({
        message: '¡Tu PIN ha sido cambiado con éxito!',
        user: updatedUser,
      });
    }

    // 2. Creación de Usuarios (Superadmin o Dueño)
    const { creatorUserId, userRole, storeId, name, username, role, pin, password } = body;

    // Verificar identidad del creador si se proporciona creatorUserId
    let actualCreatorRole = userRole;
    if (creatorUserId) {
      const creator = db.getUserById(creatorUserId);
      if (!creator || creator.active === false) {
        return NextResponse.json({ error: 'Creador no autorizado o inactivo.' }, { status: 401 });
      }
      actualCreatorRole = creator.role;

      // Un dueño SOLO puede crear usuarios en su propia sede
      if (actualCreatorRole === 'dueno' && creator.storeId !== storeId) {
        return NextResponse.json(
          { error: 'Acceso denegado. No puedes crear usuarios en una sede ajena.' },
          { status: 403 }
        );
      }
    }

    if (actualCreatorRole !== 'superadmin' && actualCreatorRole !== 'dueno') {
      return NextResponse.json(
        { error: 'Acceso denegado. No tienes permisos para registrar usuarios.' },
        { status: 403 }
      );
    }

    if (!storeId || !name || !username || !role) {
      return NextResponse.json(
        { error: 'Los campos tienda, nombre, usuario y rol son obligatorios.' },
        { status: 400 }
      );
    }

    // Validación de jerarquía: solo superadmin crea Dueños
    if (role === 'dueno' && actualCreatorRole !== 'superadmin') {
      return NextResponse.json(
        { error: 'Solo el Superadministrador puede registrar nuevos Dueños de sede.' },
        { status: 403 }
      );
    }

    const newUser = db.createUser({
      storeId,
      name,
      username,
      role,
      pin,
      password,
      creatorRole: actualCreatorRole,
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { adminUserId, userRole, userId, newPin, updates } = body;

    // Verificar quién ejecuta la acción
    let operatorRole = userRole;
    let operatorStoreId: string | undefined;

    if (adminUserId) {
      const operator = db.getUserById(adminUserId);
      if (!operator || operator.active === false) {
        return NextResponse.json({ error: 'Operador no autorizado.' }, { status: 401 });
      }
      operatorRole = operator.role;
      operatorStoreId = operator.storeId;
    }

    if (operatorRole !== 'superadmin' && operatorRole !== 'dueno') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de Dueño o Superadministrador.' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido.' }, { status: 400 });
    }

    // Si el operador es un Dueño, validar que el usuario objetivo pertenezca a su misma sede
    if (operatorRole === 'dueno' && operatorStoreId) {
      const targetUser = db.getUserById(userId);
      if (!targetUser || targetUser.storeId !== operatorStoreId) {
        return NextResponse.json(
          { error: 'Acceso denegado. No tienes permisos sobre usuarios de otra sede.' },
          { status: 403 }
        );
      }
    }

    // 1. Resetear PIN
    if (newPin) {
      const updatedUser = db.resetUserPin(userId, newPin);
      return NextResponse.json({
        message: 'PIN restablecido exitosamente.',
        user: updatedUser,
      });
    }

    // 2. Actualizaciones generales
    if (updates) {
      const updatedUser = db.updateUser(userId, updates);
      return NextResponse.json({ user: updatedUser });
    }

    return NextResponse.json({ error: 'No se especificaron cambios a realizar.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const adminUserId = searchParams.get('adminUserId');
    const userRole = searchParams.get('userRole');

    let operatorRole = userRole;
    let operatorStoreId: string | undefined;

    if (adminUserId) {
      const operator = db.getUserById(adminUserId);
      if (!operator || operator.active === false) {
        return NextResponse.json({ error: 'Operador no autorizado.' }, { status: 401 });
      }
      operatorRole = operator.role;
      operatorStoreId = operator.storeId;
    }

    if (operatorRole !== 'superadmin' && operatorRole !== 'dueno') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de Dueño o Superadministrador.' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido.' }, { status: 400 });
    }

    if (operatorRole === 'dueno' && operatorStoreId) {
      const targetUser = db.getUserById(userId);
      if (!targetUser || targetUser.storeId !== operatorStoreId) {
        return NextResponse.json(
          { error: 'Acceso denegado. No tienes permisos sobre usuarios de otra sede.' },
          { status: 403 }
        );
      }
    }

    const success = db.deleteUser(userId);
    if (!success) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Usuario desactivado correctamente.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
