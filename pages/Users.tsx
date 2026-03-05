
import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  Trash2, 
  Shield, 
  User as UserIcon, 
  Search, 
  X, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  MoreVertical
} from 'lucide-react';
import { User } from '../types';
import { formatEthiopian } from '../utils/dateUtils';

interface UsersProps {
  users: User[];
  onAddUser: (user: Omit<User, 'user_id' | 'created_at'>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  currentUser: User | null;
}

const Users: React.FC<UsersProps> = ({ users, onAddUser, onDeleteUser, currentUser }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    role: 'Salesperson' as 'Admin' | 'Salesperson'
  });

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.firstName || !formData.lastName || !formData.username || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
      setError("Username already exists.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddUser(formData);
      setSuccess("User registered successfully!");
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        role: 'Salesperson'
      });
      setTimeout(() => {
        setShowAddModal(false);
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to add user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    if (user.user_id === 'SEED-001') {
      alert("Cannot delete the default admin user.");
      return;
    }

    if (user.user_id === currentUser?.user_id) {
      alert("You cannot delete your own account.");
      return;
    }

    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    setIsSubmitting(true);
    try {
      await onDeleteUser(userToDelete.user_id);
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">Manage system access and roles</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-900/20"
        >
          <UserPlus className="w-5 h-5" />
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <span>Total Users: {users.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => (
                <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${user.role === 'Admin' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{user.firstName} {user.lastName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {user.user_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-slate-600">@{user.username}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${user.role === 'Admin' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                      {user.role === 'Admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                      {user.role}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-500">{formatEthiopian(user.created_at)}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {user.user_id !== 'SEED-001' && user.user_id !== currentUser?.user_id && (
                      <button 
                        onClick={() => handleDeleteClick(user)}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto">
                      <UserIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No users found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Register User</h3>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Create new system account</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                    <input 
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                    <input 
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                  <input 
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input 
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, role: 'Salesperson'})}
                      className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${formData.role === 'Salesperson' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      Salesperson
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, role: 'Admin'})}
                      className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${formData.role === 'Admin' ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-500 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-black uppercase tracking-wider">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-black uppercase tracking-wider">{success}</p>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                  {isSubmitting ? 'Registering...' : 'Register User'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-xl flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300">
            <div className="p-10 text-center">
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                <Trash2 className="w-10 h-10" />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Delete User?</h3>
              <p className="text-slate-500 font-bold leading-relaxed mb-8">
                Are you sure you want to remove <span className="text-slate-900">@{userToDelete.username}</span>? This action is permanent and cannot be undone.
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className="w-full py-5 bg-red-500 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-600 shadow-xl shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  {isSubmitting ? 'Deleting...' : 'Yes, Delete User'}
                </button>
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  disabled={isSubmitting}
                  className="w-full py-5 bg-slate-100 text-slate-500 font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
