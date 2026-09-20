import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Search, History, Ticket as TicketIcon, Loader2, CheckCircle2, XCircle, Camera, MapPin, BusFront, ChevronDown, Users, Plus, Minus, Upload, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import type { Ticket } from '../types';
import * as motion from 'motion/react-client';
import { AnimatePresence } from 'motion/react';

const STAGES = [
  { name: 'Chidambaram', baseFare: 0 },
  { name: 'Vadalur', baseFare: 25 },
  { name: 'Neyveli', baseFare: 40 },
  { name: 'Vriddhachalam', baseFare: 60 },
  { name: 'Veppur Cross', baseFare: 90 },
  { name: 'Thalaivasal', baseFare: 125 },
  { name: 'Attur', baseFare: 145 },
  { name: 'Valapady', baseFare: 170 },
  { name: 'Salem', baseFare: 195 },
];

function CustomDropdown({ value, onChange, options, withFare = false }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedOption = options.find((o: any) => o.name === value) || options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all flex justify-between items-center cursor-pointer outline-none"
      >
        <span>
          {selectedOption.name} {withFare && selectedOption.baseFare > 0 ? `(₹${selectedOption.baseFare})` : ''}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden origin-top"
          >
            <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
              {options.map((opt: any) => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => {
                    onChange(opt.name);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors flex justify-between items-center ${value === opt.name ? 'bg-slate-700/50 text-blue-400 font-medium' : 'text-white'}`}
                >
                  <span>{opt.name}</span>
                  {withFare && opt.baseFare > 0 && (
                    <span className="text-slate-400 text-sm">₹{opt.baseFare}</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StaffDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Entry & Quick Select State
  const [searchCardId, setSearchCardId] = useState('');
  const [walletInfo, setWalletInfo] = useState<{ name: string; cardId: string; walletBalance: number } | null>(null);
  const [searchError, setSearchError] = useState('');
  const [commuters, setCommuters] = useState<Array<{ name: string; cardId: string; walletBalance: number }>>([]);
  
  // Ticket Issuance State
  const [boardingStage, setBoardingStage] = useState(STAGES[0].name);
  const [alightingStage, setAlightingStage] = useState(STAGES[STAGES.length - 1].name);
  const [busNumber, setBusNumber] = useState('');
  const [ticketCount, setTicketCount] = useState(1);
  
  const [issuing, setIssuing] = useState(false);
  const [issueResult, setIssueResult] = useState<{ success: boolean; message: string } | null>(null);

  // Auto-calculate fare based on stages
  const baseFare = (() => {
    const start = STAGES.find(s => s.name === boardingStage)?.baseFare || 0;
    const end = STAGES.find(s => s.name === alightingStage)?.baseFare || 0;
    return Math.abs(end - start);
  })();
  
  const totalFare = baseFare * ticketCount;

  const fetchTickets = async () => {
    try {
      const data = await api.get('/api/staff/tickets');
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommuters = async () => {
    try {
      const data = await api.get('/api/staff/commuters');
      if (Array.isArray(data)) {
        setCommuters(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchCommuters();
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setScanError('');
    setIsScanning(true);
    
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
          verbose: false,
        });
      }
      
      const qrboxSize = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const size = Math.max(180, Math.floor(minEdge * 0.85));
        return { width: size, height: size };
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: qrboxSize,
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Success callback
          stopScanner();
          const clean = decodedText.trim();
          setSearchCardId(clean);
          handleSearch(clean);
        },
        () => {
          // Ignore periodic frame check misses
        }
      );
    } catch (err: any) {
      setIsScanning(false);
      setScanError("Failed to start camera. Please verify camera permissions.");
      console.error(err);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        setIsScanning(false);
      }).catch(console.error);
    } else {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setScanError('');
    try {
      const html5Qr = new Html5Qrcode("reader-hidden-file");
      const decodedText = await html5Qr.scanFile(file, true);
      const clean = decodedText.trim();
      setSearchCardId(clean);
      handleSearch(clean);
    } catch (err: any) {
      setScanError("Could not read a QR code from that image. Please try another image or enter ID manually.");
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSearch = async (cardIdToSearch: string) => {
    setSearchError('');
    setWalletInfo(null);
    setIssueResult(null);
    
    const cleanId = cardIdToSearch.trim();
    if (!cleanId) return;

    try {
      const data = await api.get(`/api/staff/wallet/${encodeURIComponent(cleanId)}`);
      setWalletInfo(data);
    } catch (err: any) {
      setSearchError(err.message || `No passenger found for '${cleanId}'. Check ID or username.`);
    }
  };

  const handleIssueTicket = async (e: FormEvent) => {
    e.preventDefault();
    if (!walletInfo || totalFare <= 0) return;

    setIssuing(true);
    setIssueResult(null);

    try {
      await api.post('/api/staff/ticket', {
        cardId: walletInfo.cardId,
        route: `${ticketCount > 1 ? ticketCount + 'x ' : ''}${boardingStage} to ${alightingStage}`,
        busNumber,
        amount: totalFare,
      });
      
      setIssueResult({ success: true, message: 'Ticket issued successfully!' });
      setTicketCount(1);
      
      // Refresh wallet info, tickets, and commuter list
      handleSearch(walletInfo.cardId);
      fetchTickets();
      fetchCommuters();
    } catch (err: any) {
      setIssueResult({ success: false, message: err.message || 'Failed to issue ticket.' });
    } finally {
      setIssuing(false);
    }
  };

  const resetScanner = () => {
    setSearchCardId('');
    setWalletInfo(null);
    setIssueResult(null);
    setSearchError('');
    startScanner();
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 max-w-7xl mx-auto w-full">
      {/* Left Column: Scanner & Issuance */}
      <div id="input-section" className="lg:col-span-7 space-y-6">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Scan Passenger Card</h2>
          </div>
          
          {/* Hidden element for file decoding */}
          <div id="reader-hidden-file" className="hidden" />

          <div className="relative bg-black w-full aspect-square sm:aspect-video flex items-center justify-center overflow-hidden">
            <div id="reader" className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
            
            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/85 backdrop-blur-sm p-6 text-center z-10">
                <button
                  onClick={startScanner}
                  className="flex flex-col items-center gap-3 group cursor-pointer"
                >
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-500 transition-all shadow-[0_0_25px_rgba(37,99,235,0.5)]">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">Tap to Start Camera</span>
                  <span className="text-sm text-slate-400">Position passenger's digital card inside frame</span>
                </button>
                {scanError && (
                  <div className="mt-4 text-red-400 text-sm max-w-sm bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                    {scanError}
                  </div>
                )}
              </div>
            )}
            
            {isScanning && (
              <>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 text-slate-300 text-xs px-4 py-1.5 rounded-full border border-slate-700 pointer-events-none z-10 text-center shadow-lg">
                  Hold phone 15-20cm away
                </div>
                <button 
                  onClick={stopScanner}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/95 hover:bg-slate-700 text-white px-6 py-2 rounded-full text-sm font-medium backdrop-blur-md transition-colors border border-slate-600 cursor-pointer z-10 shadow-xl"
                >
                  Stop Scanning
                </button>
              </>
            )}
          </div>
          
          <div className="p-4 sm:p-6 bg-slate-800/50 border-t border-slate-700 mt-auto">
            <p className="text-sm font-medium text-slate-400 mb-2.5">Or enter ID / Username manually</p>
            <div className="flex gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchCardId}
                  onChange={(e) => setSearchCardId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch(searchCardId);
                    }
                  }}
                  placeholder="Enter Card ID or Username"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSearch(searchCardId)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 sm:px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer shrink-0 shadow-md"
              >
                Search
              </button>
            </div>
            
            {searchError && (
              <div className="text-red-400 text-sm mt-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                {searchError}
              </div>
            )}
          </div>
        </div>

        {walletInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-700 shadow-xl"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Card Verified
                </span>
                <h3 className="text-xl font-bold text-white mt-1.5">{walletInfo.name}</h3>
                <p className="text-sm font-mono text-slate-300 tracking-wide mt-0.5">{walletInfo.cardId}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Wallet Balance</p>
                <p className="text-2xl font-bold text-white">₹{walletInfo.walletBalance.toFixed(2)}</p>
                <button
                  type="button"
                  onClick={() => {
                    setWalletInfo(null);
                    setSearchCardId('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline mt-1 cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Route Details Box - Always Visible */}
        <form onSubmit={handleIssueTicket} className="bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-700 shadow-xl space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
            <BusFront className="w-5 h-5 text-blue-400" />
            Route Details
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" /> Boarding Stage
              </label>
              <CustomDropdown
                value={boardingStage}
                onChange={setBoardingStage}
                options={STAGES}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-400" /> Alighting Stage
              </label>
              <CustomDropdown
                value={alightingStage}
                onChange={setAlightingStage}
                options={STAGES}
                withFare={true}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 items-end bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                Bus No.
              </label>
              <input
                type="text"
                required
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                placeholder="Enter Bus No."
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 h-[46px] focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" /> Passengers
              </label>
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1 h-[46px]">
                <button 
                  type="button" 
                  onClick={() => setTicketCount(p => p > 1 ? p - 1 : 1)} 
                  disabled={ticketCount <= 1} 
                  className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center font-bold text-white">{ticketCount}</span>
                <button 
                  type="button" 
                  onClick={() => setTicketCount(p => p + 1)} 
                  className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-400">Total Fare</label>
              <div className="w-full bg-blue-900/20 border border-blue-500/30 text-blue-400 rounded-lg px-4 h-[46px] font-bold text-lg flex items-center justify-between">
                <span>₹</span>
                <span>{totalFare.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {issueResult && (
            <div className={`p-4 rounded-lg flex items-center gap-3 mt-4 ${issueResult.success ? 'bg-green-500/10 border border-green-500/50 text-green-400' : 'bg-red-500/10 border border-red-500/50 text-red-400'}`}>
              {issueResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
              <p className="text-sm font-medium">{issueResult.message}</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-700/50 mt-4">
            {walletInfo ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={resetScanner}
                  className="w-full sm:flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Clear & Scan Next
                </button>
                <button
                  type="submit"
                  disabled={issuing || totalFare <= 0}
                  className="w-full sm:flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(22,163,74,0.2)]"
                >
                  {issuing ? <Loader2 className="w-5 h-5 animate-spin" /> : <TicketIcon className="w-5 h-5" />}
                  PROCESS PAYMENT
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('input-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                  if (!isScanning) startScanner();
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition-colors cursor-pointer shadow-[0_0_20px_rgba(37,99,235,0.2)] flex items-center justify-center gap-3"
              >
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center border-2 border-blue-600 z-10">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center border-2 border-blue-600">
                    <Search className="w-4 h-4" />
                  </div>
                </div>
                SCAN OR ENTER ID TO PROCESS PAYMENT
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right Column: Ticket History */}
      <div className="lg:col-span-5 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl flex flex-col h-[500px] lg:h-[700px]">
        <div className="p-4 sm:p-6 border-b border-slate-700 bg-slate-800/50 rounded-t-2xl shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Global Ticket History
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No tickets issued yet.</p>
          ) : (
            tickets.sort((a, b) => b.timestamp - a.timestamp).map((ticket) => (
              <div key={ticket.id} className="bg-slate-900 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{ticket.id}</span>
                    <p className="text-sm font-medium text-white mt-0.5">{ticket.route} (Bus {ticket.busNumber})</p>
                  </div>
                  <span className="text-lg font-bold text-slate-200">₹{ticket.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800 mt-2">
                  <span className="font-mono">{ticket.cardId.replace('CARD-', '')}</span>
                  <span>{new Date(ticket.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
