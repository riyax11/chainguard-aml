import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, AlertTriangle, Lock, Unlock } from 'lucide-react';

const API = 'http://localhost:3001';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [newReason, setNewReason] = useState('');
  const [error, setError] = useState('');

  const fetchWatchlist = () => {
    fetch(`${API}/api/blacklist`).then(r => r.json()).then(setWatchlist).catch(console.error);
  };

  useEffect(() => { fetchWatchlist(); }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    setError('');
    fetch(`${API}/api/blacklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: newAddress, reason: newReason })
    })
    .then(r => {
      if (!r.ok) return r.json().then(d => { throw new Error(d.error); });
      return r.json();
    })
    .then(() => {
      setNewAddress('');
      setNewReason('');
      fetchWatchlist();
    })
    .catch(err => setError(err.message));
  };

  const handleRemove = (address) => {
    fetch(`${API}/api/blacklist/${encodeURIComponent(address)}`, { method: 'DELETE' })
      .then(() => fetchWatchlist());
  };

  const handleFreeze = (address) => {
    fetch(`${API}/api/freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    }).then(r => r.json()).then(data => alert(data.message || data.error)).catch(console.error);
  };

  const handleUnfreeze = (address) => {
    fetch(`${API}/api/unfreeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    }).then(r => r.json()).then(data => alert(data.message || data.error)).catch(console.error);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <Shield className="text-red-400" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Watchlist Management</h1>
          <p className="text-gray-500">Manage blacklisted and sanctioned wallet addresses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Form */}
        <div className="col-span-1">
          <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-white/5 sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <Plus className="text-[#c9ff00]" size={20} />
              <h2 className="text-xl font-bold text-white">Add Address</h2>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Wallet Address</label>
                <input type="text" placeholder="0x..." className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors" value={newAddress} onChange={e => setNewAddress(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Reason</label>
                <input type="text" placeholder="e.g., Sanctioned entity" className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors" value={newReason} onChange={e => setNewReason(e.target.value)} />
              </div>
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle size={16} /> {error}
                </div>
              )}
              <button type="submit" className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2">
                <Shield size={18} /> Add to Watchlist
              </button>
            </form>
          </div>
        </div>

        {/* Watchlist Table */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Active Watchlist</h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                {watchlist.length} addresses
              </span>
            </div>
            <div className="space-y-3">
              {watchlist.map((entry, index) => (
                <div key={index} className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5 hover:border-red-500/20 transition-colors group flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      <p className="text-white font-mono text-sm truncate">{entry.address}</p>
                    </div>
                    <div className="flex items-center gap-4 ml-5">
                      <p className="text-gray-500 text-xs">{entry.reason}</p>
                      <p className="text-gray-600 text-xs">Added: {new Date(entry.addedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleFreeze(entry.address)} className="text-gray-600 hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-blue-500/10 opacity-0 group-hover:opacity-100" title="Freeze Account">
                      <Lock size={18} />
                    </button>
                    <button onClick={() => handleUnfreeze(entry.address)} className="text-gray-600 hover:text-green-400 transition-colors p-2 rounded-xl hover:bg-green-500/10 opacity-0 group-hover:opacity-100" title="Unfreeze Account">
                      <Unlock size={18} />
                    </button>
                    <button onClick={() => handleRemove(entry.address)} className="text-gray-600 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-red-500/10 opacity-0 group-hover:opacity-100" title="Remove from Watchlist">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {watchlist.length === 0 && (
                <div className="py-12 text-center text-gray-600">
                  <Shield className="mx-auto mb-3 opacity-20" size={32} />
                  No addresses in watchlist
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
