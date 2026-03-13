
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShoppingCart, 
  Receipt,
  Search,
  Plus, 
  Trash2, 
  X, 
  Loader2, 
  Check, 
  ChevronRight, 
  ChevronDown,
  ArrowLeft,
  AlertTriangle,
  UserPlus,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Sale, Category, Customer } from '../types';
import { formatEthiopian } from '../utils/dateUtils';

interface SalesProps {
  products: Product[];
  sales: Sale[];
  categories: Category[];
  customers: Customer[];
  onAddSales: (salesItems: Omit<Sale, 'sale_id' | 'date'>[]) => Promise<string>;
  onAddCustomer: (customer: Omit<Customer, 'customer_id' | 'created_at'>) => Promise<void>;
}

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  base_quantity: number;
  unitPrice: number;
  sellingUnit: string;
  brand: string;
}

const SearchableProductDropdown = ({ products, selectedId, onSelect }: { products: Product[], selectedId: string, onSelect: (p: Product) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedProduct = products.find(p => p.product_id === selectedId);
  const filtered = products.filter(p => {
    try {
      const name = String(p?.product_name || '').toLowerCase();
      const brand = String(p?.brand || '').toLowerCase();
      const s = String(search || '').toLowerCase();
      return name.includes(s) || brand.includes(s);
    } catch (e) {
      return false;
    }
  });

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">እቃ ይፈልጉ (Search)</label>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-between px-5 py-5 border rounded-2xl transition-all ${isOpen ? 'border-orange-500 bg-white ring-4 ring-orange-500/10' : 'border-slate-200 bg-slate-50'}`}>
        <span className="flex items-center gap-3 truncate">
          <Search className="w-6 h-6 text-slate-400" />
          {selectedProduct ? <span className="font-bold text-slate-800 text-lg">{selectedProduct.product_name}</span> : <span className="text-slate-400">እቃ ይምረጡ...</span>}
        </span>
        <ChevronDown className="w-6 h-6 text-slate-400" />
      </button>
      {isOpen && (
        <div className="absolute z-[80] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <input autoFocus type="text" placeholder="እቃ ይፈልጉ..." className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {filtered.map(p => {
              const stock = Number(p.stock_qty);
              const isOutOfStock = stock <= 0;
              return (
                <button 
                  key={p.product_id} 
                  disabled={isOutOfStock}
                  onClick={() => { if (!isOutOfStock) { onSelect(p); setIsOpen(false); } }} 
                  className={`w-full flex items-center justify-between px-6 py-5 hover:bg-orange-50 border-b border-slate-50 last:border-0 ${isOutOfStock ? 'opacity-50 grayscale cursor-not-allowed bg-slate-50' : ''}`}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base text-slate-800">{p.product_name}</p>
                      {isOutOfStock && <span className="text-[9px] bg-slate-200 text-slate-500 font-black px-2 py-0.5 rounded-full uppercase">Sold Out</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase">{p.brand}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-black text-slate-900">{p.unit_price} ETB</p>
                     <p className={`text-[10px] font-black uppercase ${stock < Number(p.min_stock) ? 'text-orange-500' : 'text-slate-400'}`}>Stock: {stock}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const SearchableCustomerDropdown = ({ customers, selectedName, onSelect, onAddNew }: { customers: Customer[], selectedName: string, onSelect: (name: string) => void, onAddNew: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = (customers || []).filter(c => {
    try {
      const name = String(c?.customer_name || '').toLowerCase();
      const phone = String(c?.phone || '').toLowerCase();
      const s = String(search || '').toLowerCase();
      return name.includes(s) || phone.includes(s);
    } catch (e) {
      return false;
    }
  });

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">ደንበኛ ይምረጡ (Select Customer)</label>
      <div className="flex gap-2">
        <button type="button" onClick={() => setIsOpen(!isOpen)} className={`flex-1 flex items-center justify-between px-5 py-5 border rounded-2xl transition-all ${isOpen ? 'border-orange-500 bg-white ring-4 ring-orange-500/10' : 'border-slate-200 bg-slate-50'}`}>
          <span className="flex items-center gap-3 truncate">
            <UserIcon className="w-6 h-6 text-slate-400" />
            {selectedName ? <span className="font-bold text-slate-800 text-lg">{selectedName}</span> : <span className="text-slate-400">ደንበኛ ይምረጡ...</span>}
          </span>
          <ChevronDown className="w-6 h-6 text-slate-400" />
        </button>
        <button 
          type="button"
          onClick={onAddNew}
          className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all active:scale-95"
          title="Add New Customer"
        >
          <UserPlus className="w-6 h-6" />
        </button>
      </div>
      {isOpen && (
        <div className="absolute z-[80] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <input autoFocus type="text" placeholder="ደንበኛ ይፈልጉ..." className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.map(c => (
              <button 
                key={c.customer_id} 
                onClick={() => { onSelect(c.customer_name); setIsOpen(false); }} 
                className="w-full flex items-center justify-between px-6 py-5 hover:bg-orange-50 border-b border-slate-50 last:border-0"
              >
                <div className="text-left">
                  <p className="font-bold text-base text-slate-800">{c.customer_name}</p>
                  <p className="text-[11px] text-slate-400 font-bold uppercase">{c.phone}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm font-bold text-slate-400">ምንም ደንበኛ አልተገኘም</p>
                <button onClick={onAddNew} className="mt-4 text-orange-600 font-black uppercase text-[10px] tracking-widest">አዲስ መመዝገብ</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Sales: React.FC<SalesProps> = ({ products, sales, categories, customers, onAddSales, onAddCustomer }) => {
  const [showPOS, setShowPOS] = useState(false);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ customer_name: '', phone: '', address: '' });
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const [selectedItem, setSelectedItem] = useState({ product_id: '', quantity: 1, unit_name: '', unitPrice: 0, ratioToBase: 1 });
  const [transactionInfo, setTransactionInfo] = useState({ customer_name: '', payment_method: 'Cash' as any });

  const selectedProduct = products.find(p => p.product_id === selectedItem.product_id);
  const selectedCategory = categories.find(c => c.catagoryName === selectedProduct?.category);

  // Calculate current effective stock for the selected item (considering cart)
  const currentInCartQty = cart
    .filter(item => item.product_id === selectedItem.product_id)
    .reduce((acc, item) => acc + item.base_quantity, 0);

  const availableBaseStock = selectedProduct ? Math.max(0, Number(selectedProduct.stock_qty) - currentInCartQty) : 0;
  const requestedBaseQty = selectedItem.quantity * selectedItem.ratioToBase;
  const isInsufficientStock = selectedItem.quantity > 0 && requestedBaseQty > (availableBaseStock + 0.000001);

  const parseCategoryRates = (cat: Category) => {
    const pUnits = cat.purchasingUnit.split(',').map(u => u.trim()).filter(Boolean);
    const sUnits = cat.sellingUnit.split(',').map(u => u.trim()).filter(Boolean);
    const rateStrings = cat.ConvertionRate.split(',').map(r => r.trim()).filter(Boolean);
    
    const unitMap: Record<string, number> = {};
    
    // Initialize all known units to 1
    [...pUnits, ...sUnits].forEach(u => unitMap[u] = 1);
    
    rateStrings.forEach((rs, idx) => {
      if (rs.includes(':')) {
        const parts = rs.split(':');
        // Check for "Unit:Rate" or "Unit:1:Rate"
        if (parts.length === 2 && isNaN(Number(parts[0]))) {
          unitMap[parts[0].trim()] = parseFloat(parts[1]);
        } else if (parts.length === 3) {
          unitMap[parts[0].trim()] = parseFloat(parts[2]);
        } else if (parts.length === 2 && parts[0] === '1') {
          // Standard "1:Rate" format - map to pUnits by index
          if (pUnits[idx]) unitMap[pUnits[idx]] = parseFloat(parts[1]);
        }
      } else if (!isNaN(Number(rs))) {
        // Just a number - map to pUnits by index
        if (pUnits[idx]) unitMap[pUnits[idx]] = parseFloat(rs);
      }
    });
    return unitMap;
  };

  const availableUnits = useMemo(() => {
    if (!selectedCategory) return [];
    const sUnitNames = selectedCategory.sellingUnit.split(',').map(u => u.trim()).filter(Boolean);
    const unitMap = parseCategoryRates(selectedCategory);
    
    return sUnitNames.map((name) => {
      return { name, ratioToBase: unitMap[name] || 1 };
    });
  }, [selectedCategory]);

  const getProductUnitRatio = (product: Product) => {
    const cat = categories.find(c => c.catagoryName === product.category);
    if (!cat) return 1;
    const unitMap = parseCategoryRates(cat);
    return unitMap[product.unit] || 1;
  };

  useEffect(() => {
    if (selectedProduct && availableUnits.length > 0) {
      const defaultUnit = availableUnits[0];
      const pRatio = getProductUnitRatio(selectedProduct);
      setSelectedItem(prev => ({ 
        ...prev, 
        unit_name: defaultUnit.name, 
        ratioToBase: defaultUnit.ratioToBase, 
        unitPrice: (selectedProduct.unit_price / pRatio) * defaultUnit.ratioToBase
      }));
    }
  }, [selectedItem.product_id, availableUnits, selectedProduct]);

  const addToCart = () => {
    if (!selectedProduct || selectedItem.quantity <= 0 || isInsufficientStock) return;
    
    setCart(prev => [...prev, {
      product_id: selectedProduct.product_id,
      product_name: selectedProduct.product_name,
      quantity: selectedItem.quantity,
      base_quantity: Number((selectedItem.quantity * selectedItem.ratioToBase).toFixed(4)),
      unitPrice: selectedItem.unitPrice,
      sellingUnit: selectedItem.unit_name,
      brand: selectedProduct.brand
    }]);
    
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 800);
    setSelectedItem({ product_id: '', quantity: 1, unit_name: '', unitPrice: 0, ratioToBase: 1 });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      await onAddSales(cart.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        base_quantity: item.base_quantity,
        sellingUnit: item.sellingUnit,
        unitPrice: item.unitPrice,
        customer_name: transactionInfo.customer_name || 'Walk-in',
        payment_method: transactionInfo.payment_method,
        recorded_by: 'Admin',
        paymentMethod: transactionInfo.payment_method
      })));

      setSuccessMessage("ሽያጩ በተሳካ ሁኔታ ተጠናቋል!");
      setCart([]);
      setShowPOS(false);
      setShowCartMobile(false);
      setTransactionInfo({ customer_name: '', payment_method: 'Cash' });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCustomer(true);
    try {
      await onAddCustomer(newCustomerData);
      setTransactionInfo(prev => ({ ...prev, customer_name: newCustomerData.customer_name }));
      setShowAddCustomerModal(false);
      setNewCustomerData({ customer_name: '', phone: '', address: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-24 left-1/2 bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl z-[100] flex items-center gap-3"
          >
            <span className="font-black text-sm uppercase tracking-widest">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <motion.div variants={itemVariants} className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-black text-slate-800 tracking-tight ml-2">የቅርብ ጊዜ ደረሰኞች</h3>
          <button
            onClick={() => { setShowPOS(true); setShowCartMobile(false); }}
            className="m3-button hidden md:inline-flex items-center gap-2 px-5 py-3 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            New Sale
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          {sales.slice().reverse().slice(0, 15).map((sale, idx) => (
            <motion.div 
              layout
              key={idx} 
              className="premium-card p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-slate-800 text-base">{sale.product_name}</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                    {formatEthiopian(sale.date)} • {sale.customer_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-900">{(Number(sale.quantity) * Number(sale.unitPrice)).toLocaleString()} ETB</p>
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter">{sale.quantity} {sale.sellingUnit}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="md:hidden fixed bottom-24 right-6 z-[55]">
         <button 
           onClick={() => { setShowPOS(true); setShowCartMobile(false); }}
           className="w-16 h-16 bg-orange-600 rounded-2xl shadow-2xl flex items-center justify-center text-white active:scale-90 transition-all"
         >
           <Plus className="w-8 h-8 stroke-[3]" />
         </button>
      </motion.div>

      <AnimatePresence>
        {showPOS && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] flex flex-col safe-top"
          >
            <header className="android-header flex justify-between border-b border-slate-100 shrink-0">
               <button onClick={() => setShowPOS(false)} className="p-2 -ml-2 text-slate-600 rounded-full">
                 <X className="w-6 h-6" />
               </button>
               <span className="font-black text-lg">አዲስ ትዕዛዝ</span>
               <div className="w-6" />
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-container">
               {!showCartMobile ? (
                 <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="space-y-8"
                 >
                   <SearchableProductDropdown products={products} selectedId={selectedItem.product_id} onSelect={(p) => setSelectedItem({...selectedItem, product_id: p.product_id})} />
                   {selectedProduct && (
                     <motion.div 
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="space-y-6"
                     >
                       <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-8 shadow-2xl">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-2xl font-black tracking-tight leading-tight">{selectedProduct.product_name}</h4>
                              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">{selectedProduct.brand}</p>
                            </div>
                            <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-right">
                               <p className="text-[10px] font-black text-orange-400 uppercase">Available Stock</p>
                               <p className="text-xl font-black">
                                 {selectedItem.ratioToBase > 0 ? (availableBaseStock / selectedItem.ratioToBase).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 0} 
                                 <span className="text-xs font-bold text-slate-400"> {selectedItem.unit_name}</span>
                               </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">የመሸጫ ክፍያ (Unit)</label>
                            <div className="grid grid-cols-2 gap-3">
                              {availableUnits.map(u => {
                                const pRatio = selectedProduct ? getProductUnitRatio(selectedProduct) : 1;
                                const calculatedPrice = selectedProduct ? (selectedProduct.unit_price / pRatio) * u.ratioToBase : 0;
                                return (
                                  <button 
                                    key={u.name} 
                                    type="button" 
                                    onClick={() => setSelectedItem({
                                      ...selectedItem, 
                                      unit_name: u.name, 
                                      ratioToBase: u.ratioToBase, 
                                      unitPrice: calculatedPrice
                                    })} 
                                    className={`px-5 py-4 rounded-2xl text-[12px] font-black uppercase border transition-all ${selectedItem.unit_name === u.name ? 'bg-orange-600 border-orange-700 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                                  >
                                    {u.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                               <label className="text-[11px] font-black text-slate-500 uppercase ml-1">ብዛት (Qty)</label>
                               <input type="number" className={`w-full bg-slate-800 rounded-2xl px-6 py-5 text-white font-black text-2xl outline-none border-2 transition-all ${isInsufficientStock ? 'border-red-500 text-red-500' : 'border-transparent'}`} value={selectedItem.quantity} onChange={(e) => setSelectedItem({...selectedItem, quantity: Number(e.target.value)})} />
                             </div>
                             <div className="space-y-2">
                               <label className="text-[11px] font-black text-slate-500 uppercase ml-1">ዋጋ (Price)</label>
                               <input type="number" className="w-full bg-slate-800 rounded-2xl px-6 py-5 text-white font-black text-2xl outline-none" value={selectedItem.unitPrice} onChange={(e) => setSelectedItem({...selectedItem, unitPrice: Number(e.target.value)})} />
                             </div>
                          </div>

                          {isInsufficientStock && (
                            <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                              <p className="text-[10px] font-black text-red-100 uppercase leading-tight">
                                Insufficient Stock. You only have {(availableBaseStock / selectedItem.ratioToBase).toFixed(2)} {selectedItem.unit_name} available.
                              </p>
                            </div>
                          )}

                          <button 
                            onClick={addToCart} 
                            disabled={isInsufficientStock || selectedItem.quantity <= 0}
                            className={`m3-button w-full py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all ${addedAnimation ? 'bg-emerald-600' : isInsufficientStock ? 'bg-red-900/50 text-red-400 grayscale' : 'bg-orange-600'}`}
                          >
                            {addedAnimation ? <Check /> : isInsufficientStock ? 'Insufficient Stock' : <><Plus /> ጨምር</>}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                 <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   className="space-y-8"
                 >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-black">ትዕዛዝ ማጠቃለያ</h3>
                      <span className="bg-orange-600 text-white px-3 py-1 rounded-xl text-[10px] font-black">{cart.length} እቃዎች</span>
                    </div>
                    <div className="space-y-4">
                      {cart.map((item, idx) => (
                        <motion.div 
                          layout
                          key={idx} 
                          className="bg-slate-50 p-5 rounded-3xl flex items-center justify-between"
                        >
                           <div>
                             <p className="font-black text-slate-800">{item.product_name}</p>
                             <p className="text-[11px] font-bold text-slate-400 uppercase">{item.quantity} {item.sellingUnit} @ {item.unitPrice}</p>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="font-black">{(item.quantity * item.unitPrice).toLocaleString()}</span>
                              <button onClick={() => removeFromCart(idx)} className="text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
                           </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-12 space-y-6">
                       <div className="space-y-4">
                          <label className="text-[11px] font-black text-slate-400 uppercase ml-1 tracking-widest">የክፍያ ዘዴ (Payment Method)</label>
                          <div className="grid grid-cols-3 gap-3">
                            {(['Cash', 'Bank Transfer', 'Credit'] as const).map((method) => (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setTransactionInfo({...transactionInfo, payment_method: method})}
                                className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${transactionInfo.payment_method === method ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                              >
                                {method}
                              </button>
                            ))}
                          </div>
                       </div>

                       <div className="space-y-2">
                          {transactionInfo.payment_method === 'Credit' ? (
                            <SearchableCustomerDropdown 
                              customers={customers} 
                              selectedName={transactionInfo.customer_name} 
                              onSelect={(name) => setTransactionInfo({ ...transactionInfo, customer_name: name })}
                              onAddNew={() => setShowAddCustomerModal(true)}
                            />
                          ) : (
                            <>
                              <label className="text-[11px] font-black text-slate-400 uppercase ml-1">የደንበኛ ስም (Customer)</label>
                              <input className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none font-bold" value={transactionInfo.customer_name} onChange={(e) => setTransactionInfo({...transactionInfo, customer_name: e.target.value})} placeholder="በመደበኛ ደንበኛ" />
                            </>
                          )}
                       </div>
                    </div>
                 </motion.div>
               )}
            </div>

            <AnimatePresence>
              {showAddCustomerModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                    onClick={() => setShowAddCustomerModal(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                  >
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                      <h3 className="font-black text-xl">አዲስ ደንበኛ መመዝገቢያ</h3>
                      <button onClick={() => setShowAddCustomerModal(false)} className="p-2 text-slate-400"><X className="w-6 h-6" /></button>
                    </div>
                    <form onSubmit={handleAddCustomer} className="p-8 space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">ሙሉ ስም</label>
                          <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newCustomerData.customer_name} onChange={e => setNewCustomerData({...newCustomerData, customer_name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">ስልክ ቁጥር</label>
                          <input required type="tel" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newCustomerData.phone} onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">አድራሻ</label>
                          <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newCustomerData.address} onChange={e => setNewCustomerData({...newCustomerData, address: e.target.value})} />
                        </div>
                      </div>
                      <button type="submit" disabled={isAddingCustomer} className="m3-button w-full py-5 bg-slate-900 text-white font-black uppercase rounded-2xl flex items-center justify-center gap-3">
                        {isAddingCustomer ? <Loader2 className="animate-spin" /> : 'መዝግብ'}
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <footer className="p-6 border-t border-slate-100 bg-white safe-bottom">
               {!showCartMobile ? (
                 <button onClick={() => setShowCartMobile(true)} disabled={cart.length === 0} className="m3-button w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-between px-8 disabled:opacity-20">
                   <span>ትዕዛዝን ይመልከቱ</span>
                   <span className="flex items-center gap-2">{cartTotal.toLocaleString()} ETB <ChevronRight className="w-5 h-5" /></span>
                 </button>
               ) : (
                 <div className="flex items-center gap-4">
                    <button onClick={() => setShowCartMobile(false)} className="w-20 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-600"><ArrowLeft className="w-6 h-6" /></button>
                    <button onClick={handleFinalize} disabled={isSaving} className="m3-button flex-1 py-6 bg-orange-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3">{isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <>አጠናቅ (Finalize)</>}</button>
                 </div>
               )}
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Sales;
