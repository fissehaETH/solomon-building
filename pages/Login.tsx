
import React, { useState } from 'react';
import { Loader2, Lock, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { User as UserType } from '../types';
import BrandLogo from '../components/BrandLogo';

interface LoginProps {
  onLoginSuccess: (user: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen blueprint flex items-center justify-center p-0 sm:p-4 md:p-8 lg:p-12 overflow-y-auto selection:bg-orange-500/30">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-7xl h-auto min-h-screen sm:min-h-[800px] bg-white sm:bg-slate-900/60 sm:backdrop-blur-3xl sm:rounded-[3rem] lg:rounded-[4rem] flex flex-col lg:flex-row shadow-[0_0_100px_rgba(249,115,22,0.15)] overflow-hidden border border-white/10 my-auto"
      >
        
        {/* Brand Panel (Left Side on Desktop/Tablet Landscape) */}
        <div className="hidden lg:flex flex-1 flex-col p-12 xl:p-20 relative overflow-hidden">
           <div className="relative z-20 flex flex-col h-full">
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="flex items-center gap-6 mb-24"
              >
                 <div className="p-1 bg-white rounded-[1.5rem] shadow-2xl shadow-orange-500/20 transform hover:rotate-6 transition-transform cursor-pointer">
                   <BrandLogo size={320} />
                 </div>
                 <div className="text-white">
                    <h2 className="text-4xl font-black tracking-tighter leading-none uppercase">ሰሎሞን</h2>
                    <p className="text-[11px] uppercase font-bold tracking-[0.4em] text-orange-500 mt-1">የህንፃ መሳሪያዎች</p>
                 </div>
              </motion.div>

              <div className="mt-auto space-y-10">
                 <motion.div 
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.4, duration: 0.8 }}
                   className="space-y-4"
                 >
                    <h1 className="text-6xl xl:text-8xl font-black text-white leading-[0.9] tracking-tighter">
                      የኢትዮጵያን <br/>ወደፊት <br/><span className="text-orange-500">መገንባት።</span>
                    </h1>
                    <p className="text-slate-400 text-lg font-medium max-w-md mt-6">
                      ለዘመናዊ ግንባታ ጥራት ያላቸውን የህንፃ መሳሪያዎች በታማኝነት እናቀርባለን።
                    </p>
                 </motion.div>

                 <motion.div 
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.6, duration: 0.8 }}
                   className="flex flex-wrap gap-4"
                 >
                    <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white backdrop-blur-md hover:bg-white/10 transition-colors">
                       <ShieldCheck className="w-5 h-5 text-orange-500" />
                       <span className="text-xs font-bold uppercase tracking-widest">ደህንነቱ የተጠበቀ</span>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white backdrop-blur-md hover:bg-white/10 transition-colors">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                       <span className="text-xs font-bold uppercase tracking-widest">ሲስተሙ ዝግጁ ነው</span>
                    </div>
                 </motion.div>
              </div>
           </div>
           
           {/* Background Decorative Elements */}
           <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[120px]"
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.3, 1],
                  x: [0, 50, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]"
              />
           </div>
        </div>

        {/* Login Panel (Right Side on Desktop, Full on Mobile) */}
        <div className="flex-1 w-full lg:w-[600px] bg-white lg:m-6 lg:rounded-[2.5rem] xl:rounded-[3.5rem] flex flex-col justify-center p-8 sm:p-12 xl:p-24 relative overflow-hidden flex-shrink-0">
           
           {/* Mobile/Tablet Header */}
           <div className="lg:hidden flex flex-col items-center mb-12 sm:mb-16">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-3 rounded-[2.5rem] shadow-2xl shadow-orange-500/10 mb-6 border border-slate-50"
              >
                <BrandLogo size={140} />
              </motion.div>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">ሰለሞን ህንፃ መሳሪያዎች</h1>
              </motion.div>
           </div>

           <div className="w-full max-w-sm mx-auto">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="mb-10 hidden lg:block">
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight">እንኳን ደህና መጡ</h3>
                   <p className="text-slate-500 font-medium mt-2">ለመቀጠል እባክዎን ወደ መለያዎ ይግቡ።</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <AnimatePresence mode="wait">
                    {loginError && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 text-red-600 p-5 rounded-2xl text-sm flex items-start gap-4 border border-red-100 overflow-hidden"
                      >
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="font-bold leading-tight">{loginError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-5">
                    <div className="group space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-orange-500 transition-colors">የተጠቃሚ ስም</label>
                      <div className="relative">
                        <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors z-20" />
                        <input 
                          type="text"
                          required
                          autoComplete="username"
                          placeholder="ለምሳሌ admin"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-slate-900 text-lg placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="group space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-orange-500 transition-colors">የምስጢር ቃል</label>
                      <div className="relative">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors z-20" />
                        <input 
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-16 pr-14 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-slate-900 text-lg placeholder:text-slate-300"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-20"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs py-6 rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 group relative overflow-hidden"
                  >
                    <div className="relative z-10 flex items-center gap-3">
                      {isAuthenticating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <> ይግቡ <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> </>
                      )}
                    </div>
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity"
                    />
                  </button>
                </form>

                <div className="mt-12 text-center">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     © {new Date().getFullYear()} ሰለሞን የህንፃ መሳሪያዎች። መብቱ በህግ የተጠበቀ ነው።
                   </p>
                </div>
              </motion.div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
