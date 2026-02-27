
import React, { useState } from 'react';
import { Loader2, Lock, AlertCircle, WifiOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';
import BrandLogo from '../components/BrandLogo';

interface LoginProps {
  onLoginSuccess: (user: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticating) return;
    
    setLoginError('');
    setIsAuthenticating(true);
    
    try {
      const user = await api.validateUser(username, password);
      if (user) {
        localStorage.setItem('solomon_session', JSON.stringify(user));
        onLoginSuccess(user);
      } else {
        setLoginError('የገቡት መረጃዎች ስህተት ናቸው። እባክዎን መለያዎን እና የምስጢር ቃልዎን ያረጋግጡ።');
      }
    } catch (err) {
      console.error("Login component error:", err);
      setLoginError('የሲስተም ግንኙነት ተቋርጧል። እባክዎን ኢንተርኔትዎን ያረጋግጡ ወይም ደግመው ይሞክሩ።');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen blueprint flex items-center justify-center p-0 md:p-6 overflow-hidden">
      <div className="w-full max-w-6xl h-screen md:h-auto md:min-h-[750px] bg-white md:bg-slate-900/40 backdrop-blur-3xl md:rounded-[4rem] flex flex-col md:flex-row shadow-[0_0_100px_rgba(249,115,22,0.2)] overflow-hidden animate-fade-in-scale">
        
        {/* Brand Panel (Hidden on Mobile) */}
        <div className="hidden md:flex flex-1 flex-col p-20 relative">
           <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-5 mb-24 animate-in fade-in slide-in-from-left duration-700">
                 <div className="p-1 bg-white rounded-[1.5rem] shadow-2xl overflow-hidden shadow-orange-500/20 transform hover:rotate-3 transition-transform cursor-pointer">
                   <BrandLogo size={64} />
                 </div>
                 <div className="text-white">
                    <h2 className="text-4xl font-black tracking-tighter leading-none uppercase">ሰሎሞን</h2>
                    <p className="text-[11px] uppercase font-bold tracking-[0.4em] text-orange-500/80 mt-1">የህንፃ መሳሪያዎች</p>
                 </div>
              </div>

              <div className="mt-auto space-y-8">
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-700 stagger-1">
                    <h1 className="text-7xl font-black text-white leading-[1.1] tracking-tighter">
                      የኢትዮጵያን የወደፊት ሁኔታ <br/><span className="text-orange-500">መገንባት።</span>
                    </h1>
                 </div>

                 <div className="flex gap-5 animate-in fade-in slide-in-from-bottom duration-700 stagger-2">
                    <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white backdrop-blur-md">
                       <ShieldCheck className="w-5 h-5 text-orange-500" />
                       <span className="text-xs font-bold uppercase tracking-widest">ደህንነቱ የተጠበቀ</span>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-orange-500/30 rounded-full blur-[150px]"></div>
           </div>
        </div>

        {/* Login Panel */}
        <div className="flex-1 w-full md:w-[550px] bg-white md:m-5 md:rounded-[3.5rem] flex flex-col justify-center p-10 md:p-20 relative overflow-hidden flex-shrink-0">
           <div className="md:hidden flex flex-col items-center mb-16 animate-in fade-in slide-in-from-top duration-700">
              <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl shadow-orange-500/10 mb-6">
                <BrandLogo size={80} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center">ሰለሞን ህንጻ መሳሪያዎች</h1>
           </div>

           <div className="animate-in fade-in slide-in-from-bottom duration-700 stagger-2 w-full max-w-sm mx-auto">
              <form onSubmit={handleLogin} className="space-y-8">
                {loginError && (
                  <div className="bg-red-50 text-red-600 p-5 rounded-3xl text-sm flex items-start gap-4 border border-red-100 animate-in zoom-in duration-300">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <span className="font-bold leading-tight">{loginError}</span>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">የተጠቃሚ ስም</label>
                    <input 
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="ለምሳሌ admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-slate-900 text-lg"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">የምስጢር ቃል</label>
                    <div className="group relative">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-orange-500 transition-colors z-20" />
                      <input 
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-slate-900 relative z-10 text-lg"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-sm py-7 rounded-[2rem] hover:bg-black transition-all shadow-2xl active:scale-95 disabled:opacity-70 flex items-center justify-center gap-4 group"
                >
                  {isAuthenticating ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <> ይግቡ <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> </>
                  )}
                </button>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
