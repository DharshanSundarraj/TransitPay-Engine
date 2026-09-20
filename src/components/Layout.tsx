import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { removeAuthToken } from '../lib/api';
import * as motion from 'motion/react-client';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('cardId');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 text-slate-200 font-sans">
      {!(location.pathname === '/' || location.pathname.startsWith('/login')) && (
        <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-500 cursor-pointer" onClick={() => navigate(role === 'ROLE_PASSENGER' ? '/passenger' : role === 'ROLE_STAFF' ? '/staff' : '/')}>
              <span className="text-xl font-bold text-white tracking-tight">TransitPay</span>
            </div>
            {token && (
              <div className="flex items-center gap-4">
                {localStorage.getItem('name') && (
                  <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold uppercase shadow-sm">
                    {localStorage.getItem('name')?.charAt(0)}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-8 h-8 text-slate-300 hover:text-white bg-slate-700/80 hover:bg-slate-600 rounded-md transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </header>
      )}
      <motion.main 
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
