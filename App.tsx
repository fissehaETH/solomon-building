
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Customers from './pages/Customers';
import Users from './pages/Users';
import Credits from './pages/Credits';
import Login from './pages/Login';
import { api } from './services/api';
import { Product, Sale, Customer, User as UserType, Category, Purchase, Credit, CreditPayment } from './types';
import { Loader2, RefreshCcw, Wifi, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [creditPayments, setCreditPayments] = useState<CreditPayment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDBReady, setIsDBReady] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => Number(p.stock_qty) <= Number(p.min_stock));
  }, [products]);

  const loadStateFromAPI = () => {
    const state = api.getFullState();
    if (state) {
      setProducts(state.products || []);
      setSales(state.sales || []);
      setPurchases(state.purchases || []);
      setCustomers(state.customers || []);
      setCredits(state.credits || []);
      setCreditPayments(state.credit_payments || []);
      setCategories(state.categories || []);
      setUsers(state.users || []);
      setLastSynced(state.lastSynced || null);
      
      // Check if current user still exists in the synced users list
      if (currentUser) {
        const userExists = api.isUserValid(currentUser.user_id);
        if (!userExists) {
          handleLogout();
        }
      }
    }
  };

  useEffect(() => {
    const initApp = async () => {
      await api.initialize();
      
      const savedUser = localStorage.getItem('solomon_session');
      let initialUser: UserType | null = null;
      if (savedUser) {
        try {
          initialUser = JSON.parse(savedUser);
          if (initialUser) {
            const userExists = api.isUserValid(initialUser.user_id);
            if (!userExists) {
              localStorage.removeItem('solomon_session');
              initialUser = null;
            }
          }
        } catch (e) {
          localStorage.removeItem('solomon_session');
        }
      }
      
      setCurrentUser(initialUser);
      loadStateFromAPI();
      setIsDBReady(true);
    };
    initApp();
  }, []);

  const handleSync = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const success = await api.syncWithRemote();
      if (success) {
        loadStateFromAPI();
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser && isOnline && isDBReady) {
      handleSync();
    }
  }, [currentUser, isDBReady]);

  // Inactivity Logout Logic (2 minutes)
  useEffect(() => {
    if (!currentUser) return;

    let inactivityTimer: any;
    const INACTIVITY_LIMIT = 2 * 60 * 1000; // 2 minutes in milliseconds

    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_LIMIT);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Start the initial timer
    resetTimer();

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('solomon_session');
    setActiveTab('dashboard');
  };

  const handleAddProduct = async (product: Omit<Product, 'product_id' | 'created_at'>) => {
    if (currentUser && !api.isUserValid(currentUser.user_id)) {
      handleLogout();
      return;
    }
    await api.addProduct(product);
    loadStateFromAPI();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (currentUser && !api.isUserValid(currentUser.user_id)) {
      handleLogout();
      return;
    }
    await api.deleteProduct(productId);
    loadStateFromAPI();
  };

  const handleAddCategory = async (category: Omit<Category, 'catagory_id'>) => {
    if (currentUser && !api.isUserValid(currentUser.user_id)) {
      handleLogout();
      return;
    }
    await api.addCategory(category);
    loadStateFromAPI();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (currentUser && !api.isUserValid(currentUser.user_id)) {
      handleLogout();
      return;
    }
    await api.deleteCategory(categoryId);
    loadStateFromAPI();
  };

  const handleRegisterCustomer = async (customer: Omit<Customer, 'customer_id' | 'created_at'>) => {
    if (currentUser && !api.isUserValid(currentUser.user_id)) {
      handleLogout();
      return;
    }
    await api.addCustomer(customer);
    loadStateFromAPI();
  };

  const handleAdjustStock = async (productId: string, change: number, reason: string) => {
    if (currentUser && !api.isUserValid(currentUser.user_id)) {
      handleLogout();
      return;
    }
    await api.adjustStock(productId, change, reason);
    loadStateFromAPI();
  };

  const handleAddSales = async (salesItems: Omit<Sale, 'sale_id' | 'date'>[]) => {
    if (currentUser && !api.isUserValid(currentUser.user_id)) {
      handleLogout();
      return '';
    }
    const receiptId = await api.addSales(salesItems);
    loadStateFromAPI();
    return receiptId;
  };

  const handleAddPurchases = async (purchaseItems: Omit<Purchase, 'purchase_id' | 'date'>[]) => {
    if (currentUser && !api.isUserValid(currentUser.user_id)) {
      handleLogout();
      return;
    }
    await api.addPurchases(purchaseItems);
    loadStateFromAPI();
  };

  const handleAddUser = async (user: Omit<UserType, 'user_id' | 'created_at'>) => {
    if (currentUser && !api.isUserValid(currentUser.user_id)) {
      handleLogout();
      return;
    }
    await api.addUser(user);
    loadStateFromAPI();
  };

  const handleDeleteUser = async (userId: string) => {
    if (currentUser && !api.isUserValid(currentUser.user_id)) {
      handleLogout();
      return;
    }
    await api.deleteUser(userId);
    loadStateFromAPI();
  };

  const handleAddCreditPayment = async (payment: Omit<CreditPayment, 'id' | 'created_at'>) => {
    if (currentUser && !api.isUserValid(currentUser.user_id)) {
      handleLogout();
      return;
    }
    await api.addCreditPayment(payment);
    loadStateFromAPI();
  };

  const handleAddBulkCreditPayment = async (data: {
    customer_id: string;
    amount: number;
    payment_method: 'Cash' | 'Bank Transfer';
    note: string;
    received_by: string;
  }) => {
    if (currentUser && !api.isUserValid(currentUser.user_id)) {
      handleLogout();
      return;
    }
    await api.addBulkCreditPayment(data);
    loadStateFromAPI();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard products={products} sales={sales} customers={customers} credits={credits} categories={categories} currentUser={currentUser} />;
      case 'inventory':
        return (
          // Fixed line 130: Added currentUser prop which is required by Inventory component
          <Inventory 
            products={products} 
            categories={categories} 
            onAddProduct={handleAddProduct} 
            onDeleteProduct={handleDeleteProduct}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onAdjustStock={handleAdjustStock}
            currentUser={currentUser}
          />
        );
      case 'sales':
        return (
          <Sales 
            products={products} 
            sales={sales} 
            categories={categories}
            customers={customers}
            onAddSales={handleAddSales} 
            onAddCustomer={handleRegisterCustomer}
          />
        );
      case 'purchases':
        return (
          <Purchases 
            products={products} 
            categories={categories} 
            purchases={purchases}
            onAddPurchases={handleAddPurchases}
          />
        );
      case 'customers':
        return (
          <Customers 
            customers={customers} 
            credits={credits}
            onAddCustomer={handleRegisterCustomer} 
          />
        );
      case 'users':
        return (
          <Users 
            users={users} 
            onAddUser={handleAddUser} 
            onDeleteUser={handleDeleteUser}
            currentUser={currentUser}
          />
        );
      case 'credits':
        return (
          <Credits 
            credits={credits}
            payments={creditPayments}
            customers={customers}
            sales={sales}
            currentUser={currentUser}
            onAddPayment={handleAddCreditPayment}
            onAddBulkPayment={handleAddBulkCreditPayment}
          />
        );
      default:
        return <Dashboard products={products} sales={sales} customers={customers} credits={credits} categories={categories} currentUser={currentUser} />;
    }
  };

  if (!isDBReady) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
        <p className="font-black uppercase tracking-widest text-xs animate-pulse">Initializing Database...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      currentUser={currentUser}
      onLogout={handleLogout}
      lowStockItems={lowStockProducts}
    >
      <div className="flex items-center justify-end mb-6 -mt-2">
         <div className="flex items-center gap-3 pl-4 pr-3 py-2 bg-white border border-slate-100 rounded-full shadow-sm">
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-500" />
            )}
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
              {isOnline ? (lastSynced ? `Synced: ${new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}` : 'Ready to Sync') : 'Offline Storage Active'}
            </span>
            <button 
              onClick={handleSync}
              disabled={isRefreshing || !isOnline}
              className={`p-1.5 hover:bg-slate-100 rounded-full transition-all active:scale-90 ${isRefreshing || !isOnline ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <RefreshCcw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
            </button>
         </div>
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;
