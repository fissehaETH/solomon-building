
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  Package, 
  ChevronDown, 
  History, 
  ClipboardList, 
  AlertCircle,
  Search
} from 'lucide-react';
import { Product, Purchase, Category } from '../types';
import { formatEthiopian } from '../utils/dateUtils';

interface PurchasesProps {
  products: Product[];
  categories: Category[];
  purchases: Purchase[];
  onAddPurchases: (items: Omit<Purchase, 'purchase_id' | 'date'>[]) => Promise<void>;
}

interface IntakeItem {
  product_id: string;
  product_name: string;
  quantity: number;
  base_quantity: number;
  unitPrice: number;
  purchaseUnit: string;
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
  const filtered = products.filter(p => 
    p.product_name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">እቃ ይፈልጉ (Search catalog)</label>
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
            {filtered.map(p => (
              <button key={p.product_id} onClick={() => { onSelect(p); setIsOpen(false); }} className="w-full flex items-center justify-between px-6 py-5 hover:bg-orange-50 border-b border-slate-50 last:border-0">
                <div className="text-left">
                  <p className="font-bold text-base text-slate-800">{p.product_name}</p>
                  <p className="text-[11px] text-slate-400 font-bold uppercase">{p.brand}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Purchases: React.FC<PurchasesProps> = ({ products, categories, purchases, onAddPurchases }) => {
  const [activeMode, setActiveMode] = useState<'intake' | 'history'>('intake');
  const [cart, setCart] = useState<IntakeItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState({ product_id: '', quantity: 1, unitPrice: 0 });
  const [intakeInfo, setIntakeInfo] = useState({ supplier_name: '' });

  const selectedProduct = products.find(p => p.product_id === selectedItem.product_id);
  const selectedCategory = categories.find(c => c.catagoryName === selectedProduct?.category);

  const getConversionRatio = () => {
    if (!selectedCategory) return 1;
    const rates = selectedCategory.ConvertionRate.split(',').map(r => r.trim());
    const match = rates[0]?.match(/1:(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 1;
  };

  const addToCart = () => {
    if (!selectedProduct || selectedItem.quantity <= 0) return;
    const ratio = getConversionRatio();
    setCart(prev => [...prev, {
      product_id: selectedProduct.product_id,
      product_name: selectedProduct.product_name,
      quantity: selectedItem.quantity,
      base_quantity: selectedItem.quantity * ratio,
      unitPrice: selectedItem.unitPrice,
      purchaseUnit: selectedProduct.unit,
      brand: selectedProduct.brand
    }]);
    setSelectedItem({ product_id: '', quantity: 1, unitPrice: 0 });
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      await onAddPurchases(cart.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        base_quantity: item.base_quantity,
        unitPrice: item.unitPrice,
        purchaseUnit: item.purchaseUnit,
        supplier_name: intakeInfo.supplier_name || 'Direct Supply',
        recorded_by: 'Admin'
      })));
      setSuccessMessage("እቃዎች በተሳካ ሁኔታ ገብተዋል!");
      setCart([]);
      setActiveMode('history');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const totalCost = cart.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-8 py-4 rounded-3xl shadow-2xl z-[100] animate-in slide-in-from-bottom-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" /> {successMessage}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">የእቃ ግዥ (Logistics)</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">አዲስ እቃ ማስገባት</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl md:w-fit">
          <button onClick={() => setActiveMode('intake')} className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-xs uppercase transition-all ${activeMode === 'intake' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>አዲስ ግዥ</button>
          <button onClick={() => setActiveMode('history')} className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-xs uppercase transition-all ${activeMode === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>ታሪክ (History)</button>
        </div>
      </div>

      {activeMode === 'intake' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-8">
             <div className="flex items-center gap-4">
               <div className="bg-orange-500 p-4 rounded-2xl text-white shadow-lg shadow-orange-500/20"><Truck className="w-6 h-6" /></div>
               <div>
                 <h4 className="text-xl font-black">የእቃ መረጃ ማስገቢያ</h4>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">አዳዲስ እቃዎችን ይመዝግቡ</p>
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2">
                  <SearchableProductDropdown products={products} selectedId={selectedItem.product_id} onSelect={(p) => setSelectedItem({...selectedItem, product_id: p.product_id})} />
               </div>
               {selectedProduct && (
                 <>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ብዛት ({selectedProduct.unit})</label>
                      <input type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl outline-none" value={selectedItem.quantity} onChange={(e) => setSelectedItem({...selectedItem, quantity: Number(e.target.value)})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ዋጋ / {selectedProduct.unit}</label>
                      <input type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl outline-none" value={selectedItem.unitPrice} onChange={(e) => setSelectedItem({...selectedItem, unitPrice: Number(e.target.value)})} />
                   </div>
                   <div className="md:col-span-2 pt-4">
                      <button onClick={addToCart} disabled={!selectedItem.product_id} className="w-full py-5 bg-orange-500 text-white font-black uppercase tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-3"><Plus /> ወደ ዝርዝር ጨምር</button>
                   </div>
                 </>
               )}
             </div>
          </div>
          <div className="lg:col-span-4 bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col sticky top-8 shadow-2xl">
             <h4 className="text-xl font-black flex items-center gap-3 mb-8"><ClipboardList className="text-orange-500" /> ዝርዝር</h4>
             <div className="flex-1 space-y-4 mb-8">
               {cart.map((item, idx) => (
                 <div key={idx} className="bg-slate-800 p-5 rounded-[1.5rem] border border-slate-700 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-black mb-1">{item.product_name}</p>
                      <span className="text-[10px] text-slate-400 font-black">{item.quantity} {item.purchaseUnit}</span>
                    </div>
                    <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-600 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
                 </div>
               ))}
             </div>
             <form onSubmit={handleFinalize} className="mt-auto space-y-6 pt-6 border-t border-slate-800">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">አቅራቢ (Supplier)</label>
                   <input className="w-full px-5 py-4 bg-slate-800 rounded-2xl text-white text-sm font-bold outline-none" value={intakeInfo.supplier_name} onChange={(e) => setIntakeInfo({...intakeInfo, supplier_name: e.target.value})} placeholder="ለምሳሌ ፋብሪካ" />
                </div>
                <button type="submit" disabled={cart.length === 0 || isSaving} className="w-full py-6 bg-orange-500 text-white rounded-[1.5rem] font-black uppercase">ግዥውን አጠናቅ</button>
             </form>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">ቀን (Date)</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">እቃ (Material)</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">ብዛት (Volume)</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">አቅራቢ (Source)</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-right">ጠቅላላ ዋጋ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {purchases.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p, idx) => (
                    <tr key={`${p.purchase_id}-${p.product_id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="text-xs font-black text-slate-900">{formatEthiopian(p.date, true)}</p>
                      </td>
                      <td className="px-8 py-6"><p className="font-black text-slate-800 text-sm">{p.product_name}</p></td>
                      <td className="px-8 py-6"><span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase">{p.quantity} {p.purchaseUnit}</span></td>
                      <td className="px-8 py-6"><p className="text-sm font-bold text-slate-600">{p.supplier_name}</p></td>
                      <td className="px-8 py-6 text-right"><p className="font-black text-slate-900 text-base">{(Number(p.quantity || 0) * Number(p.unitPrice || (p as any).unitCost || 0)).toLocaleString()} ETB</p></td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
