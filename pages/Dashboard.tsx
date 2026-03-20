
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  RefreshCcw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getBusinessInsights } from '../services/gemini';
import { Product, Sale, Customer, User, Category, Credit } from '../types';
import { formatEthiopian, getEthiopianWeekday, toEthiopianDate } from '../utils/dateUtils';
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
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState(7);
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  const hasFinancialVisibility = currentUser?.role === 'Admin';

  const generateInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const insights = await getBusinessInsights(products, sales);
      setAiInsights(insights || "No insights generated.");
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleExport = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    
    // Generate insights if not already present before exporting
    if (!aiInsights) {
      await generateInsights();
    }

    try {
      // Small delay to ensure insights are rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#F8FAFC',
        windowWidth: 1200 // Ensure consistent width for PDF
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Handle multi-page PDF if content is too long
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Solomon_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  const totalSalesValue = sales.reduce((acc, sale) => acc + (Number(sale.quantity) * Number(sale.unitPrice)), 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + (Number(p.stock_qty) * Number(p.unit_price)), 0);
  
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

  const chartData = Array.from({ length: timePeriod }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (timePeriod - 1 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayTotal = sales
      .filter(s => {
        const sDate = typeof s.date === 'string' ? s.date : (s.date as any)?.toDate?.().toISOString() || String(s.date);
        return sDate.startsWith(dateStr);
      })
      .reduce((acc, s) => acc + (Number(s.quantity) * Number(s.unitPrice)), 0);
    
    const eth = toEthiopianDate(d);
    return {
      name: timePeriod === 7 ? getEthiopianWeekday(d.toISOString()) : `${eth.monthName} ${eth.day}`,
      amount: dayTotal
    };
  });

  const last7DaysSales = chartData; // Keep for backward compatibility if needed, but we'll use chartData

  const recentSales = sales
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      ref={dashboardRef}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">
            Welcome back, {currentUser?.firstName}
          </h1>
          <div className="flex items-center gap-2 mt-3 text-slate-500 font-semibold">
            <Calendar className="w-4 h-4" />
            <span>{formatEthiopian(new Date().toISOString())}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="text-orange-600">Business Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-6 md:pb-0 scrollbar-hide -mx-1 px-1"
      >
        {hasFinancialVisibility && (
          <StatCard 
            title="Total Revenue" 
            value={`${totalSalesValue.toLocaleString()}`} 
            unit="ETB"
            icon={TrendingUp} 
            trend="+12.5%"
            trendUp={true}
            color="text-emerald-600" 
            bg="bg-emerald-50"
          />
        )}
        {hasFinancialVisibility && (
          <StatCard 
            title="Net Profit" 
            value={`${totalProfit.toLocaleString()}`} 
            unit="ETB"
            icon={TrendingUp} 
            trend="+8.2%"
            trendUp={true}
            color="text-orange-600" 
            bg="bg-orange-50"
          />
        )}
        {hasFinancialVisibility && (
          <StatCard 
            title="Inventory Value" 
            value={`${(totalInventoryValue/1000).toFixed(1)}K`} 
            unit="ETB"
            icon={Package} 
            trend="-2.4%"
            trendUp={false}
            color="text-blue-600" 
            bg="bg-blue-50"
          />
        )}
        <StatCard 
          title="Active Clients" 
          value={customers.length.toString()} 
          unit="Total"
          icon={Users} 
          trend="+5"
          trendUp={true}
          color="text-purple-600" 
          bg="bg-purple-50"
        />
        <StatCard 
          title="Stock Alerts" 
          value={lowStockCount.toString()} 
          unit="Items"
          icon={AlertTriangle} 
          color="text-orange-600" 
          bg="bg-orange-50"
          isAlert={lowStockCount > 0}
          onClick={() => lowStockCount > 0 && setShowLowStockModal(true)}
          showChevron={lowStockCount > 0}
        />
        {hasFinancialVisibility && (
          <StatCard 
            title="Outstanding Credit" 
            value={`${(totalCreditValue/1000).toFixed(1)}K`} 
            unit="ETB"
            icon={Receipt} 
            trend="+1.2K"
            trendUp={false}
            color="text-red-600" 
            bg="bg-red-50"
          />
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {hasFinancialVisibility && (
          <motion.div variants={itemVariants} className="lg:col-span-2 premium-card p-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sales Analytics</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Daily Revenue Performance</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
                <button 
                  onClick={() => setTimePeriod(7)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timePeriod === 7 ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  7 Days
                </button>
                <button 
                  onClick={() => setTimePeriod(30)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timePeriod === 30 ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  30 Days
                </button>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                    interval={timePeriod === 30 ? 4 : 0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ 
                      borderRadius: '24px', 
                      border: 'none', 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      padding: '16px 20px' 
                    }}
                    itemStyle={{ fontSize: '14px', fontWeight: 800, color: '#f97316' }}
                    labelStyle={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}
                  />
                  <Bar dataKey="amount" radius={[12, 12, 12, 12]} barSize={timePeriod === 30 ? 12 : 36}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#f97316' : '#e2e8f0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className={`${hasFinancialVisibility ? 'lg:col-span-1' : 'lg:col-span-3'} premium-card p-10 flex flex-col`}>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Recent Activity</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Live Sales Feed</p>
            </div>
            <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 space-y-6">
            {recentSales.map((sale, idx) => (
              <motion.div 
                key={`${sale.sale_id}-${sale.product_id}-${idx}`} 
                whileHover={{ x: 4 }}
                className="flex items-center gap-5 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-slate-50 rounded-[1.25rem] flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-orange-50 group-hover:border-orange-100 transition-all">
                  <Receipt className="w-6 h-6 text-slate-400 group-hover:text-orange-500" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[15px] font-bold text-slate-900 truncate leading-tight">{sale.product_name}</p>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                    {formatEthiopian(sale.date)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[15px] font-black text-slate-900">
                    {(Number(sale.quantity) * Number(sale.unitPrice)).toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Paid</p>
                </div>
              </motion.div>
            ))}
            {recentSales.length === 0 && (
              <div className="py-16 text-center text-slate-400 italic text-sm">No recent activities.</div>
            )}
          </div>
          <button className="mt-8 w-full py-4 bg-slate-50 text-slate-900 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
            View All Sales
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="premium-card p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">ትንታኔ</h3>
            </div>
            <button 
              onClick={generateInsights}
              disabled={isGeneratingInsights}
              className="p-3 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-all disabled:opacity-50"
            >
              {isGeneratingInsights ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="bg-slate-50 rounded-[2rem] p-8 min-h-[200px]">
            {aiInsights ? (
              <div className="prose prose-slate max-w-none">
                <div className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                  {aiInsights}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <Database className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold text-sm">Click the refresh button to generate AI insights for your business.</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="premium-card p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Stocks Available</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Current Inventory Status</p>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {products.length} Items
            </div>
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {products.sort((a, b) => Number(a.stock_qty) - Number(b.stock_qty)).slice(0, 10).map((product) => (
              <div key={product.product_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">{product.product_name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black tracking-tighter ${Number(product.stock_qty) <= Number(product.min_stock) ? 'text-orange-600' : 'text-slate-900'}`}>
                    {product.stock_qty}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase">{product.unit}</p>
                </div>
              </div>
            ))}
            {products.length > 10 && (
              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4">
                + {products.length - 10} more items in inventory
              </p>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showLowStockModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              onClick={() => setShowLowStockModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              <div className="p-10 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-5">
                  <div className="bg-orange-100 p-4 rounded-[1.5rem] text-orange-600">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Stock Alerts</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{lowStockCount} Items Need Attention</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLowStockModal(false)}
                  className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar bg-slate-50/50">
                <div className="space-y-4">
                  {lowStockItems.map((product) => {
                    const current = Number(product.stock_qty);
                    const min = Number(product.min_stock);
                    const isCritical = current === 0;
                    return (
                      <motion.div 
                        key={product.product_id} 
                        whileHover={{ scale: 1.02 }}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1.5">
                            <p className="font-black text-slate-900 text-lg tracking-tight leading-none">{product.product_name}</p>
                            {isCritical && <span className="bg-red-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full animate-pulse tracking-widest">Out of Stock</span>}
                          </div>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{product.brand} • {product.category}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-2 mb-1">
                             <span className={`text-2xl font-black tracking-tighter ${isCritical ? 'text-red-500' : 'text-orange-500'}`}>{current}</span>
                             <span className="text-xs text-slate-300 font-bold">/</span>
                             <span className="text-sm font-bold text-slate-400">{min} {product.unit}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              <div className="p-10 border-t border-slate-100 bg-white">
                 <button 
                  onClick={() => setShowLowStockModal(false)} 
                  className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                >
                  Acknowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  unit: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  trend?: string;
  trendUp?: boolean;
  isAlert?: boolean;
  onClick?: () => void;
  showChevron?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, icon: Icon, color, bg, trend, trendUp, isAlert, onClick, showChevron }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick} 
    className={`min-w-[200px] md:min-w-0 flex-1 premium-card p-8 relative overflow-hidden group ${isAlert ? 'ring-2 ring-orange-500/20 cursor-pointer' : ''}`}
  >
    <div className="flex items-start justify-between mb-8">
      <div className={`${bg} w-14 h-14 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform relative`}>
        <Icon className={`w-7 h-7 ${color}`} />
        {isAlert && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-4 border-white animate-pulse"></span>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </div>
    <div className="relative z-10">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{unit}</p>
        </div>
        {showChevron && <ChevronRight className="w-5 h-5 text-slate-300" />}
      </div>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-3">{title}</p>
    </div>
  </motion.div>
);

export default Dashboard;
