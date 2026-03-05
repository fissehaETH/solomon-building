
import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  ChevronRight, 
  Calendar, 
  User as UserIcon, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  Filter,
  X,
  Loader2,
  Receipt,
  History,
  ArrowLeft,
  ShoppingCart
} from 'lucide-react';
import { Credit, CreditPayment, Customer, User, Sale } from '../types';
import { formatEthiopian } from '../utils/dateUtils';

interface CreditsProps {
  credits: Credit[];
  payments: CreditPayment[];
  customers: Customer[];
  sales: Sale[];
  currentUser: User | null;
  onAddPayment: (payment: Omit<CreditPayment, 'id' | 'created_at'>) => Promise<void>;
  onAddBulkPayment: (data: {
    customer_id: string;
    amount: number;
    payment_method: 'Cash' | 'Bank Transfer';
    note: string;
    received_by: string;
  }) => Promise<void>;
}

const Credits: React.FC<CreditsProps> = ({ 
  credits, 
  payments, 
  customers, 
  sales,
  currentUser,
  onAddPayment,
  onAddBulkPayment
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Paid' | 'Overdue'>('All');
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer'>('Cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCredits = useMemo(() => {
    let result = credits.filter(credit => {
      const customer = customers.find(c => c.customer_id === credit.customer_id);
      const matchesSearch = 
        credit.credit_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer?.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || credit.status === statusFilter;
      
      const matchesCustomer = !selectedCustomerId || credit.customer_id === selectedCustomerId;
      
      return matchesSearch && matchesStatus && matchesCustomer;
    });

    return result.sort((a, b) => {
      const custA = customers.find(c => c.customer_id === a.customer_id)?.customer_name || '';
      const custB = customers.find(c => c.customer_id === b.customer_id)?.customer_name || '';
      
      // Primary sort: Customer Name (A-Z)
      const nameCompare = custA.localeCompare(custB);
      if (nameCompare !== 0) return nameCompare;
      
      // Secondary sort: Date (Newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [credits, customers, searchQuery, statusFilter, selectedCustomerId]);

  const customerSummaries = useMemo(() => {
    const summaryMap: Record<string, { 
      customer_id: string; 
      customer_name: string; 
      total_amount: number; 
      remaining_amount: number; 
      credit_count: number;
      last_credit_date: string;
      status: 'Pending' | 'Paid' | 'Overdue';
    }> = {};

    credits.forEach(credit => {
      const customer = customers.find(c => c.customer_id === credit.customer_id);
      if (!customer) return;

      if (!summaryMap[customer.customer_id]) {
        summaryMap[customer.customer_id] = {
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          total_amount: 0,
          remaining_amount: 0,
          credit_count: 0,
          last_credit_date: credit.credit_date,
          status: 'Pending'
        };
      }

      const summary = summaryMap[customer.customer_id];
      summary.total_amount += Number(credit.total_amount);
      summary.remaining_amount += Number(credit.remaining_amount);
      summary.credit_count += 1;
      
      if (new Date(credit.credit_date) > new Date(summary.last_credit_date)) {
        summary.last_credit_date = credit.credit_date;
      }

      // If any credit is overdue, the whole customer is overdue
      if (credit.status === 'Overdue') summary.status = 'Overdue';
      else if (credit.status === 'Pending' && summary.status !== 'Overdue') summary.status = 'Pending';
      else if (credit.status === 'Paid' && summary.status === 'Paid') summary.status = 'Paid';
    });

    return Object.values(summaryMap)
      .filter(s => s.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.customer_name.localeCompare(b.customer_name));
  }, [credits, customers, searchQuery]);

  const selectedCreditPayments = useMemo(() => {
    if (!selectedCredit) return [];
    return payments
      .filter(p => p.credit_id === selectedCredit.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [selectedCredit, payments]);

  const selectedCreditItems = useMemo(() => {
    if (!selectedCredit) return [];
    return sales.filter(s => s.sale_id === selectedCredit.sale_id);
  }, [selectedCredit, sales]);

  const selectedCustomerSummary = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customerSummaries.find(s => s.customer_id === selectedCustomerId);
  }, [selectedCustomerId, customerSummaries]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCredit || !paymentAmount || isSubmitting) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0 || amount > selectedCredit.remaining_amount) {
      alert('እባክዎን ትክክለኛ የክፍያ መጠን ያስገቡ።');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddPayment({
        credit_id: selectedCredit.id,
        amount,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString(),
        note: paymentNote,
        received_by: currentUser?.firstName || 'Unknown'
      });
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNote('');
      // Refresh selected credit to show updated balance
      const updated = credits.find(c => c.id === selectedCredit.id);
      if (updated) setSelectedCredit(updated);
    } catch (err) {
      console.error("Payment failed:", err);
      alert('ክፍያውን መመዝገብ አልተቻለም። እባክዎን ደግመው ይሞክሩ።');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !paymentAmount || isSubmitting) return;

    const amount = parseFloat(paymentAmount);
    const totalRemaining = selectedCustomerSummary?.remaining_amount || 0;

    if (isNaN(amount) || amount <= 0 || amount > totalRemaining) {
      alert('እባክዎን ትክክለኛ የክፍያ መጠን ያስገቡ።');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddBulkPayment({
        customer_id: selectedCustomerId,
        amount,
        payment_method: paymentMethod,
        note: paymentNote,
        received_by: currentUser?.firstName || 'Unknown'
      });
      setShowBulkPaymentModal(false);
      setPaymentAmount('');
      setPaymentNote('');
    } catch (error) {
      console.error('Bulk payment failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Overdue': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-orange-50 text-orange-600 border-orange-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle2 className="w-3 h-3" />;
      case 'Overdue': return <AlertCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Credit</p>
              <h3 className="text-2xl font-black text-slate-900">
                {credits.reduce((sum, c) => sum + Number(c.total_amount), 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">ETB</span>
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collected</p>
              <h3 className="text-2xl font-black text-slate-900">
                {payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">ETB</span>
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining</p>
              <h3 className="text-2xl font-black text-slate-900">
                {credits.reduce((sum, c) => sum + Number(c.remaining_amount), 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">ETB</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Credits List */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            {viewMode === 'details' && (
              <button 
                onClick={() => {
                  setViewMode('summary');
                  setSelectedCustomerId(null);
                  setSelectedCredit(null);
                }}
                className="p-3 bg-slate-100 rounded-2xl text-slate-600 hover:bg-slate-200 transition-colors"
                title="Back to Summary"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder={viewMode === 'summary' ? "Search by customer..." : "Search by credit #..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500/20 transition-all font-bold text-slate-900"
              />
            </div>
            {viewMode === 'details' && (
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl w-full md:w-auto">
                {(['All', 'Pending', 'Paid', 'Overdue'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
            {viewMode === 'details' && selectedCustomerSummary && selectedCustomerSummary.remaining_amount > 0 && (
              <button 
                onClick={() => {
                  setPaymentAmount(selectedCustomerSummary.remaining_amount.toString());
                  setShowBulkPaymentModal(true);
                }}
                className="flex items-center gap-2 px-6 py-4 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" />
                Pay Total Debt
              </button>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    {viewMode === 'summary' ? (
                      <>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Debt</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Credits</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Activity</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      </>
                    ) : (
                      <>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit Details</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      </>
                    )}
                    <th className="px-8 py-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {viewMode === 'summary' ? (
                    customerSummaries.map((summary) => (
                      <tr 
                        key={summary.customer_id} 
                        onClick={() => {
                          setSelectedCustomerId(summary.customer_id);
                          setViewMode('details');
                        }}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900">{summary.customer_name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {summary.customer_id.split('-')[1]}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-black text-slate-900">{summary.remaining_amount.toLocaleString()} <span className="text-[10px] text-slate-400">ETB</span></p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">of {summary.total_amount.toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-600 uppercase">{summary.credit_count} Records</span>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-bold text-slate-600">{formatEthiopian(summary.last_credit_date)}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${getStatusColor(summary.status)}`}>
                            {getStatusIcon(summary.status)}
                            {summary.status}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 transition-all" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    filteredCredits.map((credit) => (
                      <tr 
                        key={credit.id} 
                        onClick={() => setSelectedCredit(credit)}
                        className={`hover:bg-slate-50/50 transition-colors cursor-pointer group ${selectedCredit?.id === credit.id ? 'bg-orange-50/30' : ''}`}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500 text-xs">
                              {credit.credit_number.slice(-3)}
                            </div>
                            <div>
                              <p className="font-black text-slate-900">{credit.credit_number}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatEthiopian(credit.credit_date)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div>
                            <p className="font-black text-slate-900">{Number(credit.remaining_amount).toLocaleString()} <span className="text-[10px] text-slate-400">ETB</span></p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">of {Number(credit.total_amount).toLocaleString()}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${getStatusColor(credit.status)}`}>
                            {getStatusIcon(credit.status)}
                            {credit.status}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <ChevronRight className={`w-5 h-5 text-slate-300 group-hover:text-orange-500 transition-all ${selectedCredit?.id === credit.id ? 'translate-x-1 text-orange-500' : ''}`} />
                        </td>
                      </tr>
                    ))
                  )}
                  {((viewMode === 'summary' && customerSummaries.length === 0) || (viewMode === 'details' && filteredCredits.length === 0)) && (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                          <CreditCard className="w-16 h-16" />
                          <p className="font-black uppercase tracking-widest text-sm">No records found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Details Sidebar */}
        <div className="w-full lg:w-96 shrink-0">
          {selectedCredit ? (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xl">Credit Details</h3>
                  <button onClick={() => setSelectedCredit(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Receipt className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit Number</p>
                      <p className="font-black text-slate-900">{selectedCredit.credit_number}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-100 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                      <div className="flex items-center gap-2 text-slate-900">
                        <Calendar className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-xs font-bold">{formatEthiopian(selectedCredit.due_date)}</span>
                      </div>
                    </div>
                    <div className="p-4 border border-slate-100 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <div className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase ${selectedCredit.status === 'Paid' ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {getStatusIcon(selectedCredit.status)}
                        {selectedCredit.status}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining Balance</p>
                      <h4 className="text-3xl font-black">{Number(selectedCredit.remaining_amount).toLocaleString()} <span className="text-sm font-bold opacity-50">ETB</span></h4>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 transition-all duration-1000" 
                        style={{ width: `${((Number(selectedCredit.total_amount) - Number(selectedCredit.remaining_amount)) / Number(selectedCredit.total_amount)) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                      {Math.round(((Number(selectedCredit.total_amount) - Number(selectedCredit.remaining_amount)) / Number(selectedCredit.total_amount)) * 100)}% Collected
                    </p>
                  </div>

                  {/* Items List */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-4 h-4 text-slate-400" />
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items Taken</h4>
                    </div>
                    <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-100">
                      {selectedCreditItems.map((item, idx) => (
                        <div key={idx} className="p-4 border-b border-slate-100 last:border-0 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-black text-slate-800">{item.product_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{item.quantity} {item.sellingUnit} @ {item.unitPrice} ETB</p>
                          </div>
                          <p className="text-xs font-black text-slate-900">{(Number(item.quantity) * Number(item.unitPrice)).toLocaleString()} ETB</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedCredit.status !== 'Paid' && (
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Plus className="w-4 h-4" />
                      Add Payment
                    </button>
                  )}
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-slate-400" />
                  <h3 className="font-black text-lg">Payment History</h3>
                </div>

                <div className="space-y-4">
                  {selectedCreditPayments.length > 0 ? (
                    selectedCreditPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center gap-4 p-4 border border-slate-50 rounded-2xl hover:bg-slate-50/50 transition-colors">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                          <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900">{Number(payment.amount).toLocaleString()} <span className="text-[10px] text-slate-400">ETB</span></p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{formatEthiopian(payment.payment_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{payment.payment_method}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">By {payment.received_by}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center opacity-20">
                      <p className="text-xs font-black uppercase tracking-widest">No payments yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm text-slate-300">
                <Receipt className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-black text-slate-900">Select a Credit</h4>
                <p className="text-xs font-bold text-slate-400 mt-1">Click on a credit record to view details and manage payments.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Payment Modal */}
      {showBulkPaymentModal && selectedCustomerSummary && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Pay Total Debt</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Customer: {selectedCustomerSummary.customer_name}
                </p>
              </div>
              <button onClick={() => setShowBulkPaymentModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleBulkPaymentSubmit} className="p-8 space-y-6">
              <div className="p-6 bg-slate-900 rounded-3xl text-white">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Remaining Balance</p>
                <h4 className="text-3xl font-black">{selectedCustomerSummary.remaining_amount.toLocaleString()} <span className="text-sm font-bold opacity-50">ETB</span></h4>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Amount</label>
                  <div className="relative mt-2">
                    <input 
                      type="number"
                      required
                      step="0.01"
                      max={selectedCustomerSummary.remaining_amount}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500/20 transition-all font-black text-slate-900"
                      placeholder="0.00"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">ETB</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {(['Cash', 'Bank Transfer'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${paymentMethod === method ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Note (Optional)</label>
                  <textarea 
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="w-full px-6 py-4 mt-2 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500/20 transition-all font-bold text-slate-900 min-h-[100px]"
                    placeholder="Add a note..."
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Confirm Payment
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedCredit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowPaymentModal(false)} />
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-black text-xl text-slate-900">Add Payment</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Recording payment for {selectedCredit.credit_number}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Amount (ETB)</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">ETB</div>
                  <input 
                    type="number"
                    required
                    autoFocus
                    max={selectedCredit.remaining_amount}
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-orange-500 focus:bg-white transition-all outline-none font-black text-slate-900 text-xl"
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 ml-1">Remaining balance: {Number(selectedCredit.remaining_amount).toLocaleString()} ETB</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Cash', 'Bank Transfer'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${paymentMethod === method ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Note (Optional)</label>
                <textarea 
                  placeholder="Add any details about this payment..."
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-slate-900 text-sm min-h-[100px] resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !paymentAmount}
                className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Confirm Payment <ArrowUpRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Credits;
