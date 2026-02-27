
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  LogOut,
  Settings,
  Bell,
  Menu,
  X,
  AlertTriangle,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { User, Product } from '../types';
import BrandLogo from './BrandLogo';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  lowStockItems: Product[];
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  lowStockItems
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const menuItems = useMemo(() => {
    const allItems = [
      { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
      { id: 'inventory', label: 'Stock', icon: Package },
      { id: 'sales', label: 'POS', icon: ShoppingCart },
      { id: 'customers', label: 'Clients', icon: Users },
      { id: 'purchases', label: 'Restock', icon: Truck }
    ];

    // Admin: Full access (stock, pos, clients, restock)
    // Salesperson: stock, pos, restock (No Clients)
    if (currentUser?.role === 'Salesperson') {
      return allItems.filter(item => item.id !== 'customers');
    }
    
    return allItems;
  }, [currentUser]);

  const initial = currentUser?.firstName?.[0]?.toUpperCase() ?? 'S';

  const handleTabChange = (tab: string) => {
    if (window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const NotificationPanel = () => (
    <div
      ref={notificationRef}
      className="fixed md:absolute right-0 md:right-10 top-0 md:top-20 w-full md:w-96
      bg-white md:rounded-[2rem] shadow-2xl z-[100]
      border-b md:border border-slate-100
      flex flex-col max-h-[80vh] md:max-h-[500px]
      animate-in slide-in-from-top md:fade-in md:zoom-in-95 duration-300 overflow-hidden"
    >
      <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
        <div>
          <h3 className="font-black text-lg">Notifications</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase">
            Stock Alerts
          </p>
        </div>
        <button
          onClick={() => setShowNotifications(false)}
          className="p-2 hover:bg-slate-100 rounded-xl md:hidden"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {lowStockItems.length > 0 ? (
          lowStockItems.map((item) => (
            <div
              key={item.product_id}
              onClick={() => {
                handleTabChange('inventory');
                setShowNotifications(false);
              }}
              className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-4 cursor-pointer hover:border-orange-300 transition-all active:scale-95"
            >
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm truncate">
                  {item.product_name}
                </p>
                <p className="text-[10px] font-bold text-red-500 uppercase">
                  Low Stock: {item.stock_qty} / {item.min_stock} {item.unit}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </div>
          ))
        ) : (
          <div className="py-20 text-center text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-bold text-sm uppercase">No new alerts</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden flex-col md:flex-row">
      <aside className="hidden md:flex w-72 bg-slate-900 text-white flex-col shrink-0">
        <div className="p-8 flex items-center gap-4">
          <div className="bg-orange-500 p-2 rounded-2xl">
            <BrandLogo size={32} color="white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl">Solomon</h1>
            <p className="text-[10px] uppercase text-slate-400">
              Building Materials
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-slate-800 rounded-3xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center font-black text-orange-500">
              {initial}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{currentUser?.firstName}</p>
              <p className="text-[10px] uppercase text-slate-400">
                {currentUser?.role}
              </p>
            </div>
            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <header className="md:hidden sticky top-0 bg-white border-b z-40 safe-top">
        <div className="flex justify-between items-center px-4 py-3">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-600 active:bg-slate-100 rounded-full transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-black text-xl tracking-tight text-slate-900">ሰለሞን መሳሪያዎች</span>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 -mr-2 text-slate-600 active:bg-slate-100 rounded-full relative ${showNotifications ? 'bg-orange-50 text-orange-600' : ''}`}
          >
            <Bell className="w-6 h-6" />
            {lowStockItems.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-orange-600 rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col items-center gap-4">
              <div className="bg-orange-500 p-3 rounded-[1.5rem] shadow-xl shadow-orange-500/20">
                <BrandLogo size={48} color="white" />
              </div>
              <div className="text-center">
                <h1 className="font-black text-xl text-slate-900 tracking-tight">Solomon Build</h1>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mt-1">Building Materials</p>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'text-slate-500 hover:bg-slate-50 active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="font-bold text-sm tracking-tight">{item.label}</span>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </button>
                );
              })}
            </nav>

            <div className="p-6 mt-auto">
              <div className="bg-slate-50 rounded-[2rem] p-5 border border-slate-100 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center font-black text-orange-500 border border-orange-500/20">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate leading-tight">{currentUser?.firstName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{currentUser?.role}</p>
                  </div>
                </div>
                
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-red-100 text-red-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-50 active:scale-95 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden min-h-0">
        <header className="hidden md:flex h-20 bg-white border-b items-center justify-between px-10 shrink-0">
          <h2 className="text-2xl font-black capitalize">
            {menuItems.find(m => m.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2.5 bg-slate-50 rounded-2xl text-slate-500 hover:bg-slate-100 transition-all relative">
              <Bell className="w-5 h-5" />
              {lowStockItems.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-orange-600 rounded-full border border-white"></span>
              )}
            </button>
            <button className="p-2.5 bg-slate-50 rounded-2xl text-slate-500 hover:bg-slate-100 transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
          {showNotifications && <NotificationPanel />}
        </header>

        {showNotifications && (
          <div className="md:hidden">
            <NotificationPanel />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-container custom-scrollbar pb-28 md:pb-8 min-h-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      <nav className="md:hidden glass fixed bottom-0 left-0 right-0 h-20 border-t border-slate-200/60 flex items-center justify-around px-2 z-40 safe-bottom shrink-0">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className="relative flex flex-col items-center justify-center w-full h-full gap-1 group overflow-visible"
            >
              {isActive && <div className="nav-indicator" />}
              <div className={`transition-all duration-300 ${isActive ? 'text-slate-900 scale-110' : 'text-slate-500'}`}>
                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              </div>
              <span className={`text-[10px] font-bold tracking-tight transition-colors ${isActive ? 'text-slate-900 font-black' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
