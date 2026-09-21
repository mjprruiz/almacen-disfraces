'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Store, User, Product, Client, Rental, RentalItem, GuaranteeType, CashMovement, DashboardMetrics } from '@/lib/types';
import { Header } from '@/components/Header';
import { RentalsTab } from '@/components/RentalsTab';
import { InventoryTab } from '@/components/InventoryTab';
import { ClientsTab } from '@/components/ClientsTab';
import { DashboardTab } from '@/components/DashboardTab';
import { NewRentalModal } from '@/components/NewRentalModal';
import { ReturnRentalModal } from '@/components/ReturnRentalModal';
import { NewProductModal } from '@/components/NewProductModal';
import { NewClientModal } from '@/components/NewClientModal';
import { TestGuideModal } from '@/components/TestGuideModal';
import { NewSaleModal } from '@/components/NewSaleModal';
import { RestockModal } from '@/components/RestockModal';
import { LoginScreen } from '@/components/LoginScreen';
import { UserManagementModal } from '@/components/UserManagementModal';
import { ChangePinModal } from '@/components/ChangePinModal';
import { SuperadminPanelModal } from '@/components/SuperadminPanelModal';
import { SuperadminView } from '@/components/SuperadminView';

export default function Home() {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'rentals' | 'inventory' | 'clients' | 'dashboard'>('rentals');

  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Modals state
  const [isNewRentalOpen, setIsNewRentalOpen] = useState(false);
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isReturnRentalOpen, setIsReturnRentalOpen] = useState(false);
  const [selectedRentalToReturn, setSelectedRentalToReturn] = useState<Rental | null>(null);
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedProductToRestock, setSelectedProductToRestock] = useState<Product | null>(null);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isSuperadminPanelOpen, setIsSuperadminPanelOpen] = useState(false);
  const [isTestGuideOpen, setIsTestGuideOpen] = useState(false);

  // Notification toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const refreshStores = useCallback(async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      if (data.stores) setStores(data.stores);
    } catch (err) {
      console.error('Error refreshing stores:', err);
    }
  }, []);

  // Refresh users list (e.g. after creating a user or resetting PIN)
  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
        if (currentUser) {
          const updated = data.users.find((u: User) => u.id === currentUser.id);
          if (updated) setCurrentUser(updated);
        }
      }
    } catch (err) {
      console.error('Error refreshing users:', err);
    }
  }, [currentUser]);

  // 1. Load initial stores and users + check saved session
  useEffect(() => {
    async function loadMeta() {
      try {
        const [storesRes, usersRes] = await Promise.all([
          fetch('/api/stores').then((r) => r.json()),
          fetch('/api/users').then((r) => r.json()),
        ]);

        let loadedStores: Store[] = [];
        let loadedUsers: User[] = [];

        if (storesRes.stores && storesRes.stores.length > 0) {
          loadedStores = storesRes.stores;
          setStores(loadedStores);
        }
        if (usersRes.users) {
          loadedUsers = usersRes.users;
          setUsers(loadedUsers);
        }

        // Check localStorage session
        const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('almacen_user_id') : null;
        const savedStoreId = typeof window !== 'undefined' ? localStorage.getItem('almacen_store_id') : null;

        if (savedUserId) {
          const user = loadedUsers.find((u) => u.id === savedUserId && u.active !== false);
          if (user) {
            setCurrentUser(user);
            const store = loadedStores.find((s) => s.id === user.storeId) || loadedStores[0];
            if (store) setCurrentStore(store);
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setIsAuthChecking(false);
      }
    }
    loadMeta();
  }, []);

  const handleLoginSuccess = (user: User, store: Store) => {
    setCurrentUser(user);
    const assignedStore = stores.find((s) => s.id === user.storeId) || store;
    setCurrentStore(assignedStore);
    if (typeof window !== 'undefined') {
      localStorage.setItem('almacen_user_id', user.id);
      localStorage.setItem('almacen_store_id', assignedStore.id);
    }
    showToast(`¡Bienvenido/a, ${user.name}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('almacen_user_id');
      localStorage.removeItem('almacen_store_id');
    }
    showToast('Sesión cerrada correctamente.');
  };

  // 2. Fetch data whenever currentStore changes
  const refreshStoreData = useCallback(async () => {
    if (!currentStore || !currentUser || currentUser.role === 'superadmin') return;
    try {
      setLoading(true);
      const storeId = currentStore.id;
      const userId = currentUser.id;

      const [prodRes, cliRes, rentRes, dashRes] = await Promise.all([
        fetch(`/api/products?storeId=${storeId}&userId=${userId}`).then((r) => r.json()),
        fetch(`/api/clients?storeId=${storeId}&userId=${userId}`).then((r) => r.json()),
        fetch(`/api/rentals?storeId=${storeId}&userId=${userId}`).then((r) => r.json()),
        fetch(`/api/dashboard?storeId=${storeId}&userId=${userId}`).then((r) => r.json()),
      ]);

      if (prodRes.products) setProducts(prodRes.products);
      if (cliRes.clients) setClients(cliRes.clients);
      if (rentRes.rentals) setRentals(rentRes.rentals);
      if (dashRes.metrics) setMetrics(dashRes.metrics);
      if (dashRes.cashMovements) setCashMovements(dashRes.cashMovements);
    } catch (err) {
      console.error('Error refreshing store data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentStore, currentUser]);

  useEffect(() => {
    refreshStoreData();
  }, [refreshStoreData]);

  // Overdue and Due Today counters for badges
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = rentals.filter((r) => r.status === 'demorado').length;
  const dueTodayCount = rentals.filter((r) => r.status !== 'devuelto' && r.dueDate === todayStr).length;

  // Actions
  const handleCreateRental = async (data: {
    productId?: string;
    clientId: string;
    dueDate: string;
    rentalPrice?: number;
    subtotal?: number;
    discount?: number;
    guaranteeAmount: number;
    guaranteeType: GuaranteeType;
    notes: string;
    items?: RentalItem[];
    totalQuantity?: number;
  }) => {
    if (!currentStore || !currentUser) return;
    const res = await fetch('/api/rentals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: currentStore.id,
        userId: currentUser.id,
        userName: currentUser.name,
        ...data,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al guardar');
    showToast(`¡Alquiler ${json.rental.ticketCode} registrado con éxito!`);
    await refreshStoreData();
  };

  const handleReturnRental = async (params: {
    rentalId: string;
    penaltyAmount: number;
    returnNotes: string;
  }) => {
    if (!currentStore || !currentUser) return;
    const res = await fetch('/api/rentals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: currentStore.id,
        userId: currentUser.id,
        userName: currentUser.name,
        ...params,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al procesar devolución');
    showToast(`¡Devolución registrada correctamente! Disfraz devuelto al stock disponible.`);
    await refreshStoreData();
  };

  const handleCreateProduct = async (productData: any) => {
    if (!currentStore || !currentUser) return;
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: currentStore.id,
        userId: currentUser.id,
        product: productData,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al guardar disfraz');
    showToast(`¡Disfraz ${json.product.name} agregado al catálogo!`);
    await refreshStoreData();
  };

  const handleCreateClient = async (clientData: any) => {
    if (!currentStore || !currentUser) return;
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: currentStore.id,
        userId: currentUser.id,
        client: clientData,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al registrar cliente');
    showToast(`¡Cliente ${json.client.name} registrado correctamente!`);
    await refreshStoreData();
  };

  const handleCreateSale = async (data: {
    productId: string;
    clientId?: string;
    quantity: number;
    salePrice: number;
    discount?: number;
    notes?: string;
  }) => {
    if (!currentStore || !currentUser) return;
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: currentStore.id,
        userId: currentUser.id,
        userName: currentUser.name,
        ...data,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al procesar la venta');
    showToast(`¡Venta de ${data.quantity} prenda(s) registrada con éxito!`);
    await refreshStoreData();
  };

  const handleRestockProduct = async (data: {
    productId: string;
    quantity: number;
    purchaseCost: number;
    notes?: string;
  }) => {
    if (!currentStore || !currentUser) return;
    const res = await fetch('/api/products/restock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: currentStore.id,
        userId: currentUser.id,
        userName: currentUser.name,
        ...data,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al reabastecer stock');
    showToast(`¡Se agregaron ${data.quantity} unidad(es) de ${json.product.name} al stock!`);
    await refreshStoreData();
  };

  // If not authenticated, render LoginScreen
  if (!isAuthChecking && !currentUser) {
    return (
      <LoginScreen
        stores={stores}
        users={users}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // If authenticated as superadmin, render dedicated administrative console
  if (currentUser?.role === 'superadmin') {
    return (
      <>
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div
              className={`px-4 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center space-x-2 text-white ${
                toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            >
              <span>{toast.message}</span>
            </div>
          </div>
        )}
        <SuperadminView
          currentUser={currentUser}
          stores={stores}
          users={users}
          onLogout={handleLogout}
          onRefreshStores={refreshStores}
          onRefreshUsers={refreshUsers}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center space-x-2 text-white ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        stores={stores}
        currentStore={currentStore}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenSuperadminPanel={() => setIsSuperadminPanelOpen(true)}
        onOpenChangePin={() => setIsChangePinOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        overdueCount={overdueCount}
        dueTodayCount={dueTodayCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && !currentStore ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-500">Cargando datos de la tienda...</p>
          </div>
        ) : (
          <>
            {activeTab === 'rentals' && (
              <RentalsTab
                rentals={rentals}
                currentStore={currentStore}
                onOpenNewRental={() => setIsNewRentalOpen(true)}
                onOpenNewSale={() => setIsNewSaleOpen(true)}
                onOpenReturn={(rental) => {
                  setSelectedRentalToReturn(rental);
                  setIsReturnRentalOpen(true);
                }}
              />
            )}

        {activeTab === 'inventory' && (
          <InventoryTab
            products={products}
            currentUser={currentUser}
            onOpenNewProduct={() => setIsNewProductOpen(true)}
            onOpenRestock={(product) => {
              setSelectedProductToRestock(product);
              setIsRestockOpen(true);
            }}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsTab
            clients={clients}
            rentals={rentals}
            currentStore={currentStore}
            onOpenNewClient={() => setIsNewClientOpen(true)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            metrics={metrics}
            cashMovements={cashMovements}
            currentUser={currentUser}
            activeRentals={rentals.filter((r) => r.status !== 'devuelto')}
          />
        )}
          </>
        )}
      </main>

      {/* Modals */}
      <NewRentalModal
        isOpen={isNewRentalOpen}
        onClose={() => setIsNewRentalOpen(false)}
        products={products}
        clients={clients}
        onOpenNewClient={() => setIsNewClientOpen(true)}
        onSubmit={handleCreateRental}
      />

      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        products={products}
        clients={clients}
        onOpenNewClient={() => setIsNewClientOpen(true)}
        onSubmit={handleCreateSale}
      />

      <ReturnRentalModal
        isOpen={isReturnRentalOpen}
        onClose={() => {
          setIsReturnRentalOpen(false);
          setSelectedRentalToReturn(null);
        }}
        rental={selectedRentalToReturn}
        onSubmit={handleReturnRental}
      />

      <NewProductModal
        isOpen={isNewProductOpen}
        onClose={() => setIsNewProductOpen(false)}
        products={products}
        onSubmit={handleCreateProduct}
      />

      <RestockModal
        isOpen={isRestockOpen}
        onClose={() => {
          setIsRestockOpen(false);
          setSelectedProductToRestock(null);
        }}
        product={selectedProductToRestock}
        onSubmit={handleRestockProduct}
      />

      <NewClientModal
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        onSubmit={handleCreateClient}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        currentUser={currentUser}
        stores={stores}
        users={users}
        onRefreshUsers={refreshUsers}
      />

      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        currentUser={currentUser}
        onPinChanged={(updatedUser) => {
          setCurrentUser(updatedUser);
          showToast('¡Tu PIN ha sido actualizado!');
        }}
      />

      <SuperadminPanelModal
        isOpen={isSuperadminPanelOpen}
        onClose={() => setIsSuperadminPanelOpen(false)}
        currentUser={currentUser}
        stores={stores}
        users={users}
        onRefreshStores={refreshStores}
        onRefreshUsers={refreshUsers}
      />

      <TestGuideModal
        isOpen={isTestGuideOpen}
        onClose={() => setIsTestGuideOpen(false)}
        users={users}
        stores={stores}
        currentUser={currentUser}
        onSelectUserAndStore={(u, s) => {
          handleLoginSuccess(u, s);
        }}
      />
    </div>
  );
}
