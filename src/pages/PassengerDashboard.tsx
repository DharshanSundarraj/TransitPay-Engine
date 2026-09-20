import { useState, useEffect, useRef, type FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Plus, History, Loader2, IndianRupee, Copy, Check } from 'lucide-react';
import { api } from '../lib/api';
import type { PassengerProfile } from '../types';
import * as motion from 'motion/react-client';
import { toPng } from 'html-to-image';

export function PassengerDashboard() {
  const [profile, setProfile] = useState<PassengerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchProfile = async () => {
    try {
      const data = await api.get('/api/passenger/profile');
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleDeposit = async (e: FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setIsDepositing(true);
    try {
      await api.post('/api/passenger/deposit', { amount });
      setDepositAmount('');
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const downloadLink = document.createElement('a');
      const cleanId = profile?.cardId.replace('CARD-', '') || 'ID';
      downloadLink.download = `TransitPay-${cleanId}.png`;
      downloadLink.href = dataUrl;
      downloadLink.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!profile) return <div>Failed to load profile.</div>;

  const displayId = profile.cardId.replace('CARD-', '');

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Digital ID Card Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl"
        >
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-white">Digital ID Card</h2>
            <button
              onClick={handleDownloadCard}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Download Full Card"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>

          <div
            ref={cardRef}
            className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-xl p-6 shadow-inner text-white flex flex-col items-center text-center space-y-4"
          >
            <div className="bg-white p-4 rounded-xl shadow-md">
              <QRCodeSVG
                value={profile.cardId}
                size={160}
                level="H"
                className="rounded-md"
              />
            </div>
            <div>
              <p className="text-blue-200 text-sm font-medium uppercase tracking-wider">Passenger Name</p>
              <h3 className="text-2xl font-bold">{profile.name}</h3>
            </div>
            <div className="w-full h-px bg-blue-400/30 my-2" />
            <div className="flex justify-between w-full items-end text-left">
              <div>
                <p className="text-blue-200 text-xs uppercase tracking-wider">Card ID</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="font-mono text-base sm:text-lg font-bold tracking-wide">{profile.cardId}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(profile.cardId);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1 hover:bg-blue-800/60 rounded text-blue-200 hover:text-white transition-colors cursor-pointer"
                    title="Copy Card ID"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-xs uppercase tracking-wider">Balance</p>
                <p className="text-lg font-bold">₹{profile.walletBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Deposit Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-green-400" />
              Add Funds
            </h2>
            <form onSubmit={handleDeposit} className="flex gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400">₹</span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-8 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                  placeholder="Enter amount to deposit"
                />
              </div>
              <button
                type="submit"
                disabled={isDepositing || !depositAmount}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isDepositing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Deposit
              </button>
            </form>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex-1 max-h-[350px] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {profile.transactions.length === 0 ? (
                <p className="text-slate-400 text-sm">No recent transactions.</p>
              ) : (
                profile.transactions.sort((a, b) => b.timestamp - a.timestamp).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {tx.type === 'DEPOSIT' ? 'Wallet Deposit' : 'Ticket Purchase'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className={`font-mono font-medium ${tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-slate-300'}`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
