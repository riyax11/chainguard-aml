import React, { useState } from 'react';
import { Users, Search, Shield, ShieldAlert } from 'lucide-react';

export default function KYC() {
  const [searchTerm, setSearchTerm] = useState('');

  const kycDatabase = [
    { address: '0x1234567890abcdef1234567890abcdef12345678', entity: 'Binance Hot Wallet #4', risk: 'LOW', type: 'Exchange' },
    { address: '0xbad0000000000000000000000000000000000000', entity: 'Lazarus Group (DPRK)', risk: 'CRITICAL', type: 'Sanctioned Hacker Group' },
    { address: '0xdead000000000000000000000000000000000000', entity: 'Tornado Cash Router', risk: 'HIGH', type: 'Mixer' },
    { address: '0xabcdef1234567890abcdef1234567890abcdef12', entity: 'Coinbase Hot Wallet', risk: 'LOW', type: 'Exchange' },
  ];

  const filtered = kycDatabase.filter(k => 
    k.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
    k.entity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
          <Users className="text-blue-400" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">KYC Identity Resolution</h1>
          <p className="text-gray-500">Map on-chain addresses to Real World Entities</p>
        </div>
      </div>

      <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-white/5">
        <div className="flex items-center gap-4 mb-8 bg-[#1a1a1a] p-4 rounded-2xl border border-white/10">
          <Search className="text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search by 0x address or Entity Name..." 
            className="bg-transparent w-full text-white focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {filtered.map(entity => (
            <div key={entity.address} className="flex justify-between items-center bg-[#1a1a1a] p-6 rounded-2xl border border-white/5">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{entity.entity}</h3>
                <p className="text-gray-500 font-mono text-sm">{entity.address}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white">
                  {entity.type}
                </span>
                {entity.risk === 'LOW' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#c9ff00]/10 text-[#c9ff00] flex items-center gap-1">
                    <Shield size={14} /> LOW RISK
                  </span>
                )}
                {(entity.risk === 'HIGH' || entity.risk === 'CRITICAL') && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 flex items-center gap-1">
                    <ShieldAlert size={14} /> {entity.risk}
                  </span>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-gray-500 py-12">No entities found matching that search.</div>
          )}
        </div>
      </div>
    </div>
  );
}
