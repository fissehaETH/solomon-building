
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Package, 
  ChevronDown, 
  Check, 
  Tag, 
  X, 
  Layers, 
  Loader2, 
  CheckCircle2, 
  History, 
  AlertCircle,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Category, User } from '../types';

interface InventoryProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Omit<Product, 'product_id' | 'created_at'>) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onAddCategory: (category: Omit<Category, 'catagory_id'>) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onAdjustStock: (productId: string, change: number, reason: string) => Promise<void>;
  currentUser: User | null;
}

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 20, x: '-50%' }}
      className="fixed bottom-24 md:bottom-8 left-1/2 z-[100]"
    >
      <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-bold text-sm tracking-wide">{message}</span>
      </div>
    </motion.div>
  );
};

const SearchableDropdown = ({ 
  label, 
  options, 
  selected, 
  onSelect, 
  placeholder,
  disabled = false,
  icon: Icon
}: { 
  label: string, 
  options: string[], 
  selected: string, 
  onSelect: (val: string) => void,
  placeholder: string,
  disabled?: boolean,
  icon: any
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer text-left disabled:opacity-50"
      >
        <span className="truncate flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          {selected || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-[70] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <input
                autoFocus
                type="text"
                placeholder="Filter..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onSelect(opt);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 transition-colors border-b border-slate-50 last:border-0"
                >
                  <span className="font-medium">{opt}</span>
                  {selected === opt && <Check className="w-4 h-4 text-orange-500" />}
                </button>
              )) : (
                <div className="px-4 py-5 text-center">
                  <p className="text-xs text-slate-400 italic">No matches found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Inventory: React.FC<InventoryProps> = ({ 
  products, 
  categories, 
  onAddProduct, 
  onDeleteProduct,
  onAddCategory, 
  onDeleteCategory,
  onAdjustStock, 
  currentUser 
}) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'categories'>('materials');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Requirements: Only 'Admin' and 'Salesperson' can manage stock.
  const canManageStock = currentUser?.role === 'Admin' || currentUser?.role === 'Salesperson';
  const isAdmin = currentUser?.role === 'Admin';
  
  const [newProduct, setNewProduct] = useState({
    product_name: '',
    category: '',
    brand: '',
    unit: '', 
    unit_price: 0, 
    stock_qty: 0, 
    min_stock: 5 
  });

  const [adjustment, setAdjustment] = useState({ change: 0, reason: '' });

  const selectedCategoryData = categories.find(c => c.catagoryName === newProduct.category);
  const categoryNames = categories.map(c => c.catagoryName);
  
  const availableBrands = selectedCategoryData 
    ? selectedCategoryData.brand.split(',').map(b => b.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    const parts = [newProduct.category, newProduct.unit, newProduct.brand].filter(Boolean);
    setNewProduct(prev => ({ ...prev, product_name: parts.join(' ') }));
  }, [newProduct.category, newProduct.unit, newProduct.brand]);

  const isDuplicate = useMemo(() => {
    if (!newProduct.product_name) return false;
    return products.some(p => p.product_name.toLowerCase().trim() === newProduct.product_name.toLowerCase().trim());
  }, [newProduct.product_name, products]);

  const handleCategorySelect = (val: string) => {
    const cat = categories.find(c => c.catagoryName === val);
    const units = cat?.purchasingUnit.split(',').map(u => u.trim()) || [];
    setNewProduct({
      ...newProduct,
      category: val,
      unit: units[0] || '',
      brand: ''
    });
  };

  const getConversionRatio = () => {
    if (!selectedCategoryData || !newProduct.unit) return 1;
    const unitMap = parseCategoryRates(selectedCategoryData);
    return unitMap[newProduct.unit] || 1;
  };

  const getProductRatio = (product: Product) => {
    const cat = categories.find(c => c.catagoryName === product.category);
    if (!cat) return 1;
    const unitMap = parseCategoryRates(cat);
    return unitMap[product.unit] || 1;
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isDuplicate) return;
    setIsSubmitting(true);
    try {
      const ratio = getConversionRatio();
      await onAddProduct({
        ...newProduct,
        stock_qty: newProduct.stock_qty * ratio,
        min_stock: newProduct.min_stock * ratio
      });
      setSuccessMessage(`Registered: ${newProduct.product_name}`);
      setShowAddModal(false);
      setNewProduct({ product_name: '', category: '', brand: '', unit: '', unit_price: 0, stock_qty: 0, min_stock: 5 });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    return p.product_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const [newCategory, setNewCategory] = useState({
    catagoryName: '',
    purchasingUnit: '',
    brand: '',
    sellingUnit: '',
    ConvertionRate: ''
  });

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await onDeleteCategory(categoryToDelete);
      setSuccessMessage('Category deleted successfully');
      setCategoryToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
      setCategoryToDelete(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await onDeleteProduct(productToDelete);
      setSuccessMessage('Product deleted successfully');
      setProductToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
      setProductToDelete(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddCategory(newCategory);
      setSuccessMessage(`Category Created: ${newCategory.catagoryName}`);
      setShowCategoryModal(false);
      setNewCategory({ catagoryName: '', purchasingUnit: '', brand: '', sellingUnit: '', ConvertionRate: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
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
        {successMessage && <Toast message={successMessage} onClose={() => setSuccessMessage(null)} />}
      </AnimatePresence>
      
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3 overflow-hidden"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="font-bold text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'materials' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Materials
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Categories
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md -mx-4 px-4 md:-mx-8 md:px-8 -mt-4 md:-mt-8 pt-4 md:pt-8 pb-4 mb-2">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 outline-none shadow-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {isAdmin && (
              <button 
                onClick={() => setShowCategoryModal(true)} 
                className="m3-button flex-1 md:flex-none px-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg text-xs"
              >
                <Layers className="w-4 h-4 inline mr-2" /> Category
              </button>
            )}
            {canManageStock && (
              <button 
                onClick={() => setShowAddModal(true)} 
                className="m3-button flex-1 md:flex-none px-8 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg text-xs"
              >
                <Plus className="w-5 h-5 inline mr-2" /> Material
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        {activeTab === 'materials' ? (
          <div className="premium-card overflow-hidden overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Unit</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">In Stock</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Price (ETB)</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(p => {
                  const isLowStock = Number(p.stock_qty) <= Number(p.min_stock);
                  const ratio = getProductRatio(p);
                  const displayQty = p.stock_qty / ratio;
                  return (
                    <motion.tr 
                      layout
                      key={p.product_id} 
                      className={`transition-colors group ${isLowStock ? 'bg-orange-50/60 hover:bg-orange-100/60' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                            <p className="font-extrabold text-slate-800">{p.product_name}</p>
                            {isLowStock && (
                              <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 animate-pulse" />
                            )}
                         </div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">{p.brand} • {p.category}</p>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-600">{p.unit}</td>
                      <td className={`px-8 py-5 text-center font-black ${isLowStock ? 'text-orange-600' : 'text-slate-900'}`}>
                        {displayQty}
                      </td>
                      <td className="px-8 py-5 text-right font-black text-orange-600">
                        {p.unit_price.toLocaleString()} <span className="text-[9px] font-bold text-slate-400 uppercase">per {p.unit}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canManageStock && (
                            <button onClick={() => setAdjustingProduct(p)} className="p-2 text-slate-400 hover:text-orange-500 transition-colors">
                              <History className="w-5 h-5" />
                            </button>
                          )}
                          {isAdmin && (
                            <button 
                              onClick={() => setProductToDelete(p.product_id)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">
                      No materials found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="premium-card overflow-hidden overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Name</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Units</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Brands</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categories.filter(c => c.catagoryName.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                  <motion.tr layout key={c.catagory_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-extrabold text-slate-800">{c.catagoryName}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1">
                        {c.sellingUnit.split(',').map(u => (
                          <span key={u} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {u.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-slate-600">{c.brand}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {isAdmin && (
                        <button 
                          onClick={() => setCategoryToDelete(c.catagory_id)}
                          disabled={isSubmitting}
                          className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showAddModal && canManageStock && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-lg relative h-[90vh] md:h-auto overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/80 backdrop-blur-md p-8 border-b border-slate-50 flex items-center justify-between z-10">
                 <h3 className="text-2xl font-black text-slate-900">New Material</h3>
                 <button onClick={() => setShowAddModal(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className={`bg-slate-900 rounded-3xl p-6 text-white space-y-3 relative overflow-hidden transition-all ${isDuplicate ? 'ring-4 ring-orange-500/30' : ''}`}>
                  <h4 className="text-xl font-black min-h-[3rem] leading-tight">{newProduct.product_name || 'Define Material...'}</h4>
                  {isDuplicate && (
                    <div className="mt-2 p-3 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-400 shrink-0" />
                      <p className="text-[10px] font-bold text-orange-100 uppercase">item is available please register in restock</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SearchableDropdown label="Category" icon={Layers} placeholder="Select" options={categoryNames} selected={newProduct.category} onSelect={handleCategorySelect} />
                  <SearchableDropdown label="Brand" icon={Tag} placeholder="Select" options={availableBrands} selected={newProduct.brand} onSelect={(val) => setNewProduct({...newProduct, brand: val})} disabled={!newProduct.category} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SearchableDropdown 
                    label="Purchasing Unit" 
                    icon={Package} 
                    placeholder="Select Unit" 
                    options={selectedCategoryData ? selectedCategoryData.purchasingUnit.split(',').map(u => u.trim()).filter(Boolean) : []} 
                    selected={newProduct.unit} 
                    onSelect={(val) => setNewProduct({...newProduct, unit: val})} 
                    disabled={!newProduct.category} 
                  />
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Arrival Stock</label>
                    <input required type="number" step="any" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg" value={newProduct.stock_qty || ''} onChange={e => setNewProduct({...newProduct, stock_qty: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Unit Price (ETB)</label>
                    <input required type="number" step="any" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg" value={newProduct.unit_price || ''} onChange={e => setNewProduct({...newProduct, unit_price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Min Stock Alert</label>
                    <input required type="number" step="any" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg" value={newProduct.min_stock || ''} onChange={e => setNewProduct({...newProduct, min_stock: Number(e.target.value)})} />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting || isDuplicate || !newProduct.category || !newProduct.brand} className="m3-button w-full py-5 bg-slate-900 text-white font-black uppercase rounded-2xl shadow-xl">
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Register Material'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCategoryModal && isAdmin && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-lg relative h-[90vh] md:h-auto overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/80 backdrop-blur-md p-8 border-b border-slate-50 flex items-center justify-between z-10">
                 <h3 className="text-2xl font-black text-slate-900">New Category</h3>
                 <button onClick={() => setShowCategoryModal(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleCategorySubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Category Name (e.g. Cement)</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newCategory.catagoryName} onChange={e => setNewCategory({...newCategory, catagoryName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Purchasing Units (comma separated)</label>
                    <input required placeholder="Quintal, Bag" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newCategory.purchasingUnit} onChange={e => setNewCategory({...newCategory, purchasingUnit: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Selling Units (comma separated)</label>
                    <input required placeholder="Bag, kg" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newCategory.sellingUnit} onChange={e => setNewCategory({...newCategory, sellingUnit: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Conversion Rate (e.g. Bag:50, kg:1)</label>
                    <input required placeholder="Quintal:100, Bag:50, kg:1" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newCategory.ConvertionRate} onChange={e => setNewCategory({...newCategory, ConvertionRate: e.target.value})} />
                    <p className="text-[9px] text-slate-400 ml-1 italic">Define how many base units (e.g. kg) are in each unit.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Brands (comma separated)</label>
                    <input required placeholder="Dangote, Derba" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newCategory.brand} onChange={e => setNewCategory({...newCategory, brand: e.target.value})} />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="m3-button w-full py-5 bg-slate-900 text-white font-black uppercase rounded-2xl shadow-xl">
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Register Category'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {adjustingProduct && canManageStock && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 space-y-6 shadow-2xl"
            >
              <h3 className="text-2xl font-black">Stock Update</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest -mt-4">{adjustingProduct.product_name}</p>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Adjustment (+/-)</label>
                <input 
                  type="number" 
                  step="any"
                  className="w-full py-6 text-center text-4xl font-black text-orange-600 bg-slate-50 rounded-3xl outline-none border-2 border-transparent focus:border-orange-500 transition-all"
                  value={adjustment.change || ''} 
                  onChange={(e) => setAdjustment({...adjustment, change: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Reason</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                  value={adjustment.reason} 
                  onChange={(e) => setAdjustment({...adjustment, reason: e.target.value})}
                  required
                >
                  <option value="" disabled>Select Reason</option>
                  <option value="Initial Stock">Initial Stock</option>
                  <option value="Correction">Correction</option>
                  <option value="Damage">Damage</option>
                  <option value="Return">Return</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => {
                  setAdjustingProduct(null);
                  setAdjustment({ change: 0, reason: '' });
                }} className="flex-1 py-5 bg-slate-100 text-slate-400 font-black uppercase rounded-2xl">Cancel</button>
                <button 
                  disabled={!adjustment.reason || adjustment.change === 0 || (Number(adjustingProduct.stock_qty) + adjustment.change < 0)}
                  onClick={async () => {
                    await onAdjustStock(adjustingProduct.product_id, adjustment.change, adjustment.reason);
                    setAdjustingProduct(null);
                    setAdjustment({ change: 0, reason: '' });
                  }} 
                  className="m3-button flex-[2] py-5 bg-slate-900 text-white font-black uppercase rounded-2xl shadow-lg disabled:opacity-50"
                >
                  Apply Update
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {categoryToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <Trash2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Delete Category?</h3>
                <p className="text-slate-500 font-bold leading-relaxed mb-10">
                  Are you sure you want to delete <span className="text-slate-900">"{categories.find(c => c.catagory_id === categoryToDelete)?.catagoryName}"</span>? This action cannot be undone.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setCategoryToDelete(null)}
                    className="py-5 bg-slate-100 text-slate-600 font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteCategory}
                    disabled={isSubmitting}
                    className="m3-button py-5 bg-red-500 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-600 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <Trash2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Delete Material?</h3>
                <p className="text-slate-500 font-bold leading-relaxed mb-10">
                  Are you sure you want to delete <span className="text-slate-900">"{products.find(p => p.product_id === productToDelete)?.product_name}"</span>? This action cannot be undone.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setProductToDelete(null)}
                    className="py-5 bg-slate-100 text-slate-600 font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteProduct}
                    disabled={isSubmitting}
                    className="m3-button py-5 bg-red-500 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-600 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Inventory;
