import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck } from 'lucide-react';
import * as motion from 'motion/react-client';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-12 text-center"
      >
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Welcome to TransitPay
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            The secure, fast, and reliable digital ticketing platform for modern public transportation.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-lg mx-auto w-full">
          <button
            onClick={() => navigate('/login/passenger')}
            className="flex flex-col items-center gap-4 p-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded-xl transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <User className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Passenger</h3>
              <p className="text-sm text-slate-400">Manage wallet & digital card</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/login/staff')}
            className="flex flex-col items-center gap-4 p-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded-xl transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Staff Portal</h3>
              <p className="text-sm text-slate-400">Issue tickets & scan cards</p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
