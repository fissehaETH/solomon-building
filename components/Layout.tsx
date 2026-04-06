
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
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
  ChevronRight,
  Shield,
  Search
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
  console.log('Layout: Rendering...', { activeTab, currentUser: !!currentUser });

  const menuItems = useMemo(() => {
    const allItems = [
      { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
      { id: 'inventory', label: 'Stock', icon: Package },
      { id: 'sales', label: 'POS', icon: ShoppingCart },
      { id: 'credits', label: 'Credits', icon: CreditCard },
      { id: 'customers', label: 'Clients', icon: Users },
      { id: 'purchases', label: 'Restock', icon: Truck },
      { id: 'users', label: 'Users', icon: Shield }
    ];

    if (currentUser?.role === 'Salesperson') {
      return allItems.filter(item => item.id !== 'customers' && item.id !== 'users');
    }
    
    return allItems;
  }, [currentUser]);

  const bottomMenuItems = useMemo(() => {
    return menuItems.filter(item => item.id !== 'credits' && item.id !== 'users');
  }, [menuItems]);

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
    <motion.div
      ref={notificationRef}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed md:absolute right-0 md:right-10 top-[72px] md:top-20 w-full md:w-96
      bg-white md:rounded-[2.5rem] shadow-2xl z-[100]
      border-b md:border border-slate-100
      flex flex-col max-h-[80vh] md:max-h-[600px]
      overflow-hidden"
    >
      <div className="p-8 border-b flex items-center justify-between bg-white sticky top-0 z-10">
        <div>
          <h3 className="font-extrabold text-xl tracking-tight">Notifications</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Stock Alerts & Updates
          </p>
        </div>
        <button
          onClick={() => setShowNotifications(false)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {lowStockItems.length > 0 ? (
          lowStockItems.map((item) => (
            <motion.div
              key={item.product_id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                handleTabChange('inventory');
                setShowNotifications(false);
              }}
              className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-orange-200 transition-all"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">
                  {item.product_name}
                </p>
                <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wider mt-0.5">
                  Low Stock: {item.stock_qty} / {item.min_stock} {item.unit}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </motion.div>
          ))
        ) : (
          <div className="py-24 text-center text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 opacity-20" />
            </div>
            <p className="font-bold text-xs uppercase tracking-widest">All caught up</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden flex-col md:flex-row font-sans">
      <aside className="hidden md:flex w-80 bg-slate-900 text-white flex-col shrink-0 border-r border-white/5">
        <div className="p-10 flex items-center gap-5">
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="bg-white w-20 h-20 p-2 rounded-[1.25rem] shadow-lg shadow-orange-500/20 shrink-0"
          >
            <BrandLogo />
          </motion.div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter leading-none">Solomon</h1>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 mt-1">
              Building Materials
            </p>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] transition-all duration-300 ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        <div className="p-8 mt-auto">
          <div className="bg-white/5 rounded-[2rem] p-5 flex items-center gap-4 border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center font-black text-orange-500 border border-orange-500/20">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{currentUser?.firstName}</p>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                {currentUser?.role}
              </p>
            </div>
            <button 
              onClick={onLogout} 
              className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <header className="md:hidden sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-40 safe-top">
        <div className="flex justify-between items-center px-6 py-4">
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="p-2.5 -ml-2 text-slate-600 active:bg-slate-100 rounded-2xl transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center">
            <span className="font-black text-xl tracking-tighter text-slate-900">ሰለሞን</span>
            <div className="h-1 w-4 bg-orange-500 rounded-full mt-0.5" />
          </div>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            onMouseDown={(e) => e.stopPropagation()}
            className={`p-2.5 -mr-2 text-slate-600 active:bg-slate-100 rounded-2xl relative transition-all ${showNotifications ? 'bg-orange-50 text-orange-600' : ''}`}
          >
            <Bell className="w-6 h-6" />
            {lowStockItems.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-orange-600 rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col"
            >
              <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex flex-col items-center gap-3">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-white w-32 h-32 p-4 rounded-[2rem] shadow-2xl shadow-orange-500/10"
                >
                  <BrandLogo />
                </motion.div>
                <div className="text-center">
                  <h1 className="font-black text-2xl text-slate-900 tracking-tighter">Solomon</h1>
                  <p className="text-[11px] uppercase font-bold tracking-[0.25em] text-slate-400 mt-1">Building Materials</p>
                </div>
              </div>

              <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center justify-between px-6 py-4 rounded-[1.5rem] transition-all duration-300 ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/25'
                          : 'text-slate-500 hover:bg-slate-50 active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px] text-slate-400'}`} />
                        <span className="font-bold text-[15px] tracking-tight">{item.label}</span>
                      </div>
                      {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>}
                    </button>
                  );
                })}
              </nav>

              <div className="p-8 mt-auto">
                <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center font-black text-orange-500 border border-orange-500/20 text-xl">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-black text-slate-900 truncate leading-tight">{currentUser?.firstName}</p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{currentUser?.role}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-red-100 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 active:scale-95 transition-all shadow-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotifications && <NotificationPanel />}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative overflow-hidden min-h-0">
        <header className="hidden md:flex h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 items-center justify-between px-12 shrink-0">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 capitalize">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
            <div className="h-1 w-8 bg-orange-500 rounded-full mt-1" />
          </div>
          <div className="flex items-center gap-5">
            <div className="relative hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-slate-50 border-none rounded-2xl pl-11 pr-6 py-3 text-sm font-medium w-64 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              onMouseDown={(e) => e.stopPropagation()}
              className={`p-3 rounded-2xl text-slate-500 hover:bg-slate-100 transition-all relative ${showNotifications ? 'bg-orange-50 text-orange-600' : 'bg-slate-50'}`}
            >
              <Bell className="w-5 h-5" />
              {lowStockItems.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-orange-600 rounded-full border-2 border-white"></span>
              )}
            </button>
            <button className="p-3 bg-slate-50 rounded-2xl text-slate-500 hover:bg-slate-100 transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            className="flex-1 overflow-y-auto p-6 md:p-12 scroll-container custom-scrollbar pb-80 md:pb-12 min-h-0"
          >
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="md:hidden glass fixed bottom-0 left-0 right-0 h-24 border-t border-slate-200/40 flex items-center justify-around px-4 z-40 safe-bottom shrink-0">
        {bottomMenuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className="relative flex flex-col items-center justify-center w-full h-full gap-1.5 group overflow-visible"
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div 
                    layoutId="navIndicator"
                    className="nav-indicator" 
                  />
                )}
              </AnimatePresence>
              <div className={`transition-all duration-500 ${isActive ? 'text-slate-900 scale-110' : 'text-slate-400'}`}>
                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              </div>
              <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${isActive ? 'text-slate-900 font-black' : 'text-slate-500'}`}>
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
