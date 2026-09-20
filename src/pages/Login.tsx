import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { api, setAuthToken } from '../lib/api';
import { AnimatePresence } from 'motion/react';
import * as motion from 'motion/react-client';

export function Login() {
  const { type } = useParams<{ type: 'passenger' | 'staff' }>();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [fieldErrors, setFieldErrors] = useState<{username?: string, fullName?: string, password?: string, confirmPassword?: string}>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  const isStaff = type === 'staff';

  const validate = () => {
    const errors: {username?: string, fullName?: string, password?: string, confirmPassword?: string} = {};
    if (!username.trim()) errors.username = "Username is required.";
    if (!isLogin && !fullName.trim()) errors.fullName = "Full name is required.";
    if (!password.trim()) errors.password = "Password is required.";
    if (!isLogin) {
      if (!confirmPassword.trim()) errors.confirmPassword = "Confirm password is required.";
      else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    
    if (!validate()) return;
    
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin 
        ? { username: username.trim(), password }
        : { 
            username: username.trim(), 
            password, 
            name: fullName.trim(), 
            role: isStaff ? 'ROLE_STAFF' : 'ROLE_PASSENGER' 
          };

      const res = await api.post(endpoint, payload);
      
      const expectedRole = isStaff ? 'ROLE_STAFF' : 'ROLE_PASSENGER';
      if (res.role !== expectedRole) {
        throw new Error(`Please use the ${res.role === 'ROLE_STAFF' ? 'Staff' : 'Passenger'} portal.`);
      }

      setAuthToken(res.token);
      localStorage.setItem('role', res.role);
      localStorage.setItem('name', res.name || res.username);
      localStorage.setItem('cardId', res.cardId);

      navigate(isStaff ? '/staff' : '/passenger');
    } catch (err: any) {
      setGlobalError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setGlobalError('');
    setFieldErrors({});
    setFullName('');
    setConfirmPassword('');
  };

  const getInputClass = (fieldName: 'username' | 'fullName' | 'password' | 'confirmPassword', hasLeftPadding = false, hasRightPadding = false) => {
    const paddingClass = `${hasLeftPadding ? 'pl-4' : 'px-4'} ${hasRightPadding ? 'pr-11' : ''}`;
    const baseClass = `w-full bg-slate-900 border text-white rounded-lg py-2.5 focus:outline-none transition-all duration-300 ${paddingClass}`;
    
    if (fieldErrors[fieldName]) {
      return `${baseClass} border-red-500 ring-2 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]`;
    }
    return `${baseClass} border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]`;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8">
      <motion.div 
        layout
        className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 relative overflow-hidden"
      >
        <div className="absolute top-8 right-8 font-extrabold text-lg text-slate-600 select-none tracking-tight">
          TransitPay
        </div>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 text-sm font-medium text-slate-400 hover:text-white mb-8 transition-colors group cursor-pointer relative z-10"
        >
          <div className="p-1.5 bg-slate-700 rounded-full group-hover:bg-slate-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? 'login-form' : 'signup-form'}
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white pr-20">
                {isLogin 
                  ? (isStaff ? 'Staff Login' : 'Passenger Login')
                  : (isStaff ? 'Staff Registration' : 'Create Account')
                }
              </h2>
            </div>

            {globalError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-6 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300 block">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) setFieldErrors(prev => ({...prev, fullName: undefined}));
                    }}
                    className={getInputClass('fullName')}
                    placeholder="Enter your full name"
                  />
                  {fieldErrors.fullName && <span className="text-red-400 text-xs font-medium block mt-1">{fieldErrors.fullName}</span>}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 block">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (fieldErrors.username) setFieldErrors(prev => ({...prev, username: undefined}));
                  }}
                  className={getInputClass('username')}
                  placeholder="Enter your username"
                />
                {fieldErrors.username && <span className="text-red-400 text-xs font-medium block mt-1">{fieldErrors.username}</span>}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors(prev => ({...prev, password: undefined}));
                    }}
                    className={getInputClass('password', true, true)}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && <span className="text-red-400 text-xs font-medium block mt-1">{fieldErrors.password}</span>}
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300 block">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors(prev => ({...prev, confirmPassword: undefined}));
                      }}
                      className={getInputClass('confirmPassword', true, true)}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && <span className="text-red-400 text-xs font-medium block mt-1">{fieldErrors.confirmPassword}</span>}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 !mt-8 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                onClick={toggleMode}
                className="text-blue-400 hover:text-blue-300 font-medium focus:outline-none cursor-pointer"
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
