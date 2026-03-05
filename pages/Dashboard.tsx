
import React, { useState } from 'react';
import { 
  TrendingUp, 
  Package, 
  Users, 
  AlertTriangle,
  Receipt,
  ArrowRight,
  X,
  AlertCircle,
  ChevronRight,
  Database,
  Loader2,
  CheckCircle2,
  RefreshCcw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Product, Sale, Customer, User, Category, Credit } from '../types';
import { formatEthiopian, getEthiopianWeekday } from '../utils/dateUtils';
import { api } from '../services/api';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  credits: Credit[];
  categories: Category[];
  currentUser: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ products, sales, customers, credits, categories, currentUser }) => {
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showMigrateConfirm, setShowMigrateConfirm] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleMigrateClick = () => {
    console.log("Migration button clicked, showing confirm modal");
    setShowMigrateConfirm(true);
  };

  const executeMigration = async () => {
    console.log("Executing migration process...");
    setShowMigrateConfirm(false);
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const result = await api.migrateFromGoogleSheets();
      console.log("Migration result:", result);
      setMigrationResult(result);
      if (result.success) {
        console.log("Reloading in 3 seconds...");
        setTimeout(() => window.location.reload(), 3000);
      }
    } catch (err) {
      console.error("Dashboard executeMigration error:", err);
      setMigrationResult({ success: false, message: "An unexpected error occurred during migration." });
    } finally {
      setIsMigrating(false);
    }
  };
  
  // Restriction: Only Admin can see financial revenue and inventory values.
  const hasFinancialVisibility = currentUser?.role === 'Admin';
  
  const totalSalesValue = sales.reduce((acc, sale) => acc + (Number(sale.quantity) * Number(sale.unitPrice)), 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + (Number(p.stock_qty) * Number(p.unit_price)), 0);
  
  // Profit Calculation: Sales Revenue - Cost of Goods Sold
  const totalCostValue = sales.reduce((acc, sale) => {
    const product = products.find(p => p.product_id === sale.product_id);
    if (!product) return acc;
    
    const category = categories.find(c => c.catagoryName === product.category);
    let factor = 1;
    if (category && category.ConvertionRate) {
      const parts = category.ConvertionRate.split(':');
      if (parts.length >= 2) {
        const f = parseFloat(parts[1]);
        if (!isNaN(f)) factor = f;
      }
    }
    
    const costPerBaseUnit = Number(product.unit_price) / factor;
    return acc + (Number(sale.base_quantity) * costPerBaseUnit);
  }, 0);

  const totalProfit = totalSalesValue - totalCostValue;
  const totalCreditValue = credits.reduce((acc, c) => acc + Number(c.remaining_amount), 0);
  
  const lowStockItems = products.filter(p => Number(p.stock_qty) <= Number(p.min_stock));
  const lowStockCount = lowStockItems.length;

  const last7DaysSales = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayTotal = sales
      .filter(s => {
        const sDate = typeof s.date === 'string' ? s.date : (s.date as any)?.toDate?.().toISOString() || String(s.date);
        return sDate.startsWith(dateStr);
      })
      .reduce((acc, s) => acc + (Number(s.quantity) * Number(s.unitPrice)), 0);
    return {
      name: getEthiopianWeekday(d.toISOString()),
      amount: dayTotal
    };
  });

  const recentSales = sales
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide -mx-1 px-1">
        {hasFinancialVisibility && (
          <StatCard 
            title="Revenue (ገቢ)" 
            value={`${totalSalesValue.toLocaleString()}`} 
            unit="ETB"
            icon={TrendingUp} 
            color="text-emerald-600" 
            bg="bg-emerald-50"
          />
        )}
        {hasFinancialVisibility && (
          <StatCard 
            title="Profit (ትርፍ)" 
            value={`${totalProfit.toLocaleString()}`} 
            unit="ETB"
            icon={TrendingUp} 
            color="text-orange-600" 
            bg="bg-orange-50"
          />
        )}
        {hasFinancialVisibility && (
          <StatCard 
            title="Inventory (ክምችት)" 
            value={`${(totalInventoryValue/1000).toFixed(1)}K`} 
            unit="ETB"
            icon={Package} 
            color="text-blue-600" 
            bg="bg-blue-50"
          />
        )}
        <StatCard 
          title="Customers (ደንበኞች)" 
          value={customers.length.toString()} 
          unit="ጠቅላላ"
          icon={Users} 
          color="text-purple-600" 
          bg="bg-purple-50"
        />
        <StatCard 
          title="Alerts (ማስጠንቀቂያ)" 
          value={lowStockCount.toString()} 
          unit="ያለቁ"
          icon={AlertTriangle} 
          color="text-orange-600" 
          bg="bg-orange-50"
          isAlert={lowStockCount > 0}
          onClick={() => lowStockCount > 0 && setShowLowStockModal(true)}
          showChevron={lowStockCount > 0}
        />
        {hasFinancialVisibility && (
          <StatCard 
            title="Credit (ብድር)" 
            value={`${(totalCreditValue/1000).toFixed(1)}K`} 
            unit="ETB"
            icon={Receipt} 
            color="text-red-600" 
            bg="bg-red-50"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {hasFinancialVisibility && (
          <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">የሽያጭ ትንተና (Analysis)</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">የዕለታዊ ገቢ ሁኔታ</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7DaysSales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ 
                      borderRadius: '20px', 
                      border: 'none', 
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      padding: '12px 16px' 
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 800, color: '#f97316' }}
                    labelStyle={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 8, 8]} barSize={32}>
                    {last7DaysSales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 6 ? '#f97316' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className={`${hasFinancialVisibility ? 'lg:col-span-1' : 'lg:col-span-3'} bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col`}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">የቅርብ ጊዜ እንቅስቃሴዎች</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">የቀጥታ ሽያጮች</p>
            </div>
          </div>
          <div className="flex-1 space-y-5">
            {recentSales.map((sale, idx) => (
              <div key={`${sale.sale_id}-${sale.product_id}-${idx}`} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-orange-50 transition-all">
                  <Receipt className="w-5 h-5 text-slate-400 group-hover:text-orange-500" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-black text-slate-800 truncate leading-tight">{sale.product_name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    {formatEthiopian(sale.date)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-900">
                    {(Number(sale.quantity) * Number(sale.unitPrice)).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <div className="py-10 text-center text-slate-400 italic text-sm">No recent activities.</div>
            )}
          </div>
        </div>
      </div>

      {showLowStockModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">የእቃ እጥረት (Restock)</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{lowStockCount} እቃዎች ሊያልቁ ነው</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLowStockModal(false)}
                className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar bg-slate-50/50">
              <div className="space-y-3">
                {lowStockItems.map((product) => {
                  const current = Number(product.stock_qty);
                  const min = Number(product.min_stock);
                  const isCritical = current === 0;
                  return (
                    <div key={product.product_id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-black text-slate-800 tracking-tight">{product.product_name}</p>
                          {isCritical && <span className="bg-red-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">ያለቀ</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{product.brand} • {product.category}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 mb-1">
                           <span className={`text-lg font-black tracking-tighter ${isCritical ? 'text-red-500' : 'text-orange-500'}`}>{current}</span>
                           <span className="text-[10px] text-slate-300 font-bold">/</span>
                           <span className="text-xs font-bold text-slate-400">{min} {product.unit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-8 border-t border-slate-100 bg-white">
               <button onClick={() => setShowLowStockModal(false)} className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl">ተቀብያለሁ</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  unit: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  isAlert?: boolean;
  onClick?: () => void;
  showChevron?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, icon: Icon, color, bg, isAlert, onClick, showChevron }) => (
  <div onClick={onClick} className={`min-w-[160px] md:min-w-0 flex-1 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/20 relative overflow-hidden group hover:scale-[1.02] transition-all ${isAlert ? 'ring-2 ring-orange-500/20 cursor-pointer' : ''}`}>
    <div className={`${bg} w-12 h-12 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform relative`}>
      <Icon className={`w-6 h-6 ${color}`} />
      {isAlert && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
    </div>
    <div className="relative z-10">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase">{unit}</p>
        </div>
        {showChevron && <ChevronRight className="w-5 h-5 text-slate-300" />}
      </div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{title}</p>
    </div>
  </div>
);

export default Dashboard;
