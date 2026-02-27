
import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  X, 
  Loader2, 
  UserPlus,
  CheckCircle2
} from 'lucide-react';
import { Customer } from '../types';
import { formatEthiopian } from '../utils/dateUtils';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'customer_id' | 'created_at'>) => Promise<void>;
}

const Customers: React.FC<CustomersProps> = ({ customers, onAddCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    address: ''
  });

  const filteredCustomers = customers.filter(c => {
    const nameMatch = (c.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = String(c.phone || '').includes(searchTerm);
    return nameMatch || phoneMatch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAddCustomer(formData);
      setSuccess(true);
      setTimeout(() => {
        setShowAddModal(false);
        setSuccess(false);
        setFormData({ customer_name: '', phone: '', address: '' });
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="sticky top-0 z-20 bg-[#F8FAFC] -mx-4 px-4 md:-mx-8 md:px-8 -mt-4 md:-mt-8 pt-4 md:pt-8 pb-4 mb-2">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="ደንበኞችን ይፈልጉ (Search)..."
              className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 outline-none shadow-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setShowAddModal(true)} className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5" /> አዲስ ደንበኛ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(customer => (
          <div key={customer.customer_id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors"><Users className="w-6 h-6" /></div>
              <span className="text-[10px] font-black text-slate-300 uppercase">ID: {customer.customer_id.split('-')[1]}</span>
            </div>
            <h4 className="text-lg font-black text-slate-900 mb-4">{customer.customer_name}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-slate-500"><Phone className="w-4 h-4" /><span className="text-sm font-bold">{customer.phone}</span></div>
              <div className="flex items-center gap-3 text-slate-500"><MapPin className="w-4 h-4" /><span className="text-sm font-bold truncate">{customer.address}</span></div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">የተመዘገበበት፡ {formatEthiopian(customer.created_at)}</p>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-md animate-slide-up overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
               <h3 className="text-2xl font-black text-slate-900">አዲስ ደንበኛ መመዝገቢያ</h3>
               <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            {success ? (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10 text-emerald-600" /></div>
                <h4 className="text-xl font-black">ተሳክቷል!</h4>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">ሙሉ ስም</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">ስልክ ቁጥር</label>
                    <input required type="tel" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">አድራሻ</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-slate-900 text-white font-black uppercase rounded-2xl flex items-center justify-center gap-3">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'ደንበኛውን መዝግብ'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
