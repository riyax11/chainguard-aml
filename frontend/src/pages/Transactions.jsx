import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Search, Activity } from 'lucide-react';

const API = 'http://localhost:3001';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({ from: '', to: '', amount: '' });
  const [lastResult, setLastResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const fetchTransactions = () => {
    fetch(`${API}/api/transactions`).then(r => r.json()).then(setTransactions).catch(console.error);
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: formData.from, to: formData.to, amount: Number(formData.amount) })
    })
    .then(r => r.json())
    .then(data => {
      setLastResult(data);
      fetchTransactions();
      setFormData({ from: '', to: '', amount: '' });
      // Auto-clear result after 8 seconds
      setTimeout(() => setLastResult(null), 8000);
    });
  };

  const filtered = transactions.filter(tx =>
    tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.to.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form */}
      <div className="col-span-1">
        <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-white/5 sticky top-24 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[100px] bg-[#c9ff00]/5 blur-3xl rounded-full"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <span className="text-[#c9ff00] font-bold">01.</span>
              </div>
              <h2 className="text-2xl font-bold text-white">New Scan</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Sender Address</label>
                <input type="text" placeholder="0x..." className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#c9ff00] transition-colors" value={formData.from} onChange={e => setFormData({...formData, from: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Receiver Address</label>
                <input type="text" placeholder="0x..." className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#c9ff00] transition-colors" value={formData.to} onChange={e => setFormData({...formData, to: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Amount (USD)</label>
                <input type="number" placeholder="0.00" className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#c9ff00] transition-colors" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
              </div>
              <button type="submit" className="w-full bg-white hover:bg-[#c9ff00] text-black font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 mt-4">
                Analyze Transaction <ArrowRightLeft size={18} />
              </button>
            </form>

            {/* Quick Demos */}
            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Quick Demo Tests (Auto-fill)</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setFormData({ from: '0x1111111111111111111111111111111111111111', to: '0x2222222222222222222222222222222222222222', amount: '2450' })} 
                  className="flex-1 bg-white/5 hover:bg-white/10 text-[#c9ff00] text-xs font-bold py-2 rounded-xl transition-colors border border-white/5 hover:border-[#c9ff00]/30"
                >
                  Low Risk
                </button>
                <button 
                  onClick={() => setFormData({ from: '0x3333333333333333333333333333333333333333', to: '0x4444444444444444444444444444444444444444', amount: '15000' })} 
                  className="flex-1 bg-white/5 hover:bg-white/10 text-orange-400 text-xs font-bold py-2 rounded-xl transition-colors border border-white/5 hover:border-orange-400/30"
                >
                  Med Risk
                </button>
                <button 
                  onClick={() => setFormData({ from: '0xbad0000000000000000000000000000000000000', to: '0x5555555555555555555555555555555555555555', amount: '125000' })} 
                  className="flex-1 bg-white/5 hover:bg-white/10 text-red-400 text-xs font-bold py-2 rounded-xl transition-colors border border-white/5 hover:border-red-400/30"
                >
                  High Risk
                </button>
              </div>
            </div>

            {/* Result Toast */}
            {lastResult && (
              <div className={`mt-6 p-4 rounded-2xl border animate-fade-in ${
                lastResult.level === 'HIGH' ? 'bg-red-500/10 border-red-500/30' :
                lastResult.level === 'MEDIUM' ? 'bg-orange-500/10 border-orange-500/30' :
                'bg-[#c9ff00]/10 border-[#c9ff00]/30'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-bold">Risk Analysis</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    lastResult.level === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                    lastResult.level === 'MEDIUM' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-[#c9ff00]/20 text-[#c9ff00]'
                  }`}>{lastResult.level} — Score: {lastResult.score}</span>
                </div>
                {lastResult.reasons?.map((r, i) => (
                  <p key={i} className="text-sm text-gray-400">• {r}</p>
                ))}
                {lastResult.txHash && (
                  <p className="text-xs text-gray-600 mt-2 font-mono truncate">On-chain: {lastResult.txHash}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="col-span-1 lg:col-span-2">
        <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-white/5">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <span className="text-[#c9ff00] font-bold">02.</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Live Monitor</h2>
            </div>
            <div className="flex items-center gap-2">
              {showSearch && (
                <input type="text" placeholder="Search address..." className="bg-[#1a1a1a] border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9ff00] transition-all w-48" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
              )}
              <button onClick={() => setShowSearch(!showSearch)} className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5">
                <Search size={20} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="pb-4 font-semibold">Tx ID</th>
                  <th className="pb-4 font-semibold">Route</th>
                  <th className="pb-4 font-semibold">Volume</th>
                  <th className="pb-4 font-semibold">Status</th>
                  <th className="pb-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 text-gray-400 font-mono text-sm">#{tx.id.toString().padStart(4, '0')}</td>
                    <td className="py-4">
                      <div className="flex flex-col gap-1 text-sm font-mono">
                        <span className="text-white truncate max-w-[120px]">{tx.from.substring(0, 6)}...{tx.from.substring(tx.from.length - 4)}</span>
                        <span className="text-gray-600">to</span>
                        <span className="text-gray-400 truncate max-w-[120px]">{tx.to.substring(0, 6)}...{tx.to.substring(tx.to.length - 4)}</span>
                      </div>
                    </td>
                    <td className="py-4 text-white font-medium">${tx.amount.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        tx.level === 'HIGH' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        tx.level === 'MEDIUM' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        'bg-[#c9ff00]/10 text-[#c9ff00] border-[#c9ff00]/20'
                      }`}>{tx.level} RISK</span>
                    </td>
                    <td className="py-4 text-xs text-gray-500 max-w-[200px]">
                      {tx.reasons?.length > 0 ? (
                        <span className={tx.level === 'HIGH' ? 'text-red-400/80' : 'text-gray-400'}>{tx.reasons.join(', ')}</span>
                      ) : <span>Clear pattern</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="5" className="py-12 text-center text-gray-600">
                    <Activity className="mx-auto mb-3 opacity-20" size={32} />
                    {searchTerm ? 'No matching transactions' : 'Monitoring network for transactions...'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
