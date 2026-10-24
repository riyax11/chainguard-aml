import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { ShieldCheck, Wallet, LayoutDashboard, ArrowRightLeft, Shield, AlertTriangle } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Watchlist from './pages/Watchlist';
import Alerts from './pages/Alerts';
import NetworkMap from './pages/NetworkMap';
import KYC from './pages/KYC';
import { Network, Users } from 'lucide-react';

function Layout() {
  const [account, setAccount] = useState('');
  const [walletStatus, setWalletStatus] = useState('checking');
  const location = useLocation();

  const detectProvider = () => window.ethereum || (window.web3 && window.web3.currentProvider) || null;

  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(() => {
      const provider = detectProvider();
      if (provider) {
        clearInterval(interval);
        setWalletStatus('disconnected');
        provider.request({ method: 'eth_accounts' }).then(accounts => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setWalletStatus('connected');
          }
        });
      } else if (attempts >= 6) {
        clearInterval(interval);
        setWalletStatus('not_installed');
      }
      attempts++;
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const connectWallet = async () => {
    const provider = detectProvider();
    if (provider) {
      try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setWalletStatus('connected');
      } catch (err) {
        console.error("Wallet connection failed:", err);
      }
    } else {
      window.open('https://metamask.io/download/', '_blank');
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
    { path: '/watchlist', label: 'Watchlist', icon: Shield },
    { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
    { path: '/network', label: 'Network Map', icon: Network },
    { path: '/kyc', label: 'KYC Directory', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-[#c9ff00] selection:text-black">
      {/* Navigation */}
      <nav className="border-b border-white/5 py-4 px-8 flex justify-between items-center backdrop-blur-md sticky top-0 z-40">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#c9ff00] flex items-center justify-center text-black font-bold">
            <ShieldCheck size={20} />
          </div>
          <span className="text-xl font-bold text-white tracking-widest">CHAINGUARD<span className="text-[#c9ff00]">.</span></span>
        </NavLink>
        
        <div className="hidden md:flex gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </div>

        <button
          onClick={connectWallet}
          className={`font-semibold py-2 px-6 rounded-full transition-all flex items-center gap-2 text-sm ${
            walletStatus === 'connected'
              ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              : walletStatus === 'not_installed'
              ? 'bg-orange-500 text-white hover:bg-orange-400 hover:scale-105 active:scale-95'
              : 'bg-[#c9ff00] text-black hover:bg-[#b0df00] hover:scale-105 active:scale-95'
          }`}
        >
          {walletStatus === 'connected' ? (
            <>
              <div className="w-2 h-2 rounded-full bg-[#c9ff00] animate-pulse"></div>
              {account.substring(0, 6)}...{account.substring(account.length - 4)}
            </>
          ) : walletStatus === 'not_installed' ? (
            <><Wallet size={16} /> Install MetaMask</>
          ) : walletStatus === 'checking' ? (
            <><Wallet size={16} /> Detecting...</>
          ) : (
            <><Wallet size={16} /> Connect Wallet</>
          )}
        </button>
      </nav>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto p-8 pt-10">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/network" element={<NetworkMap />} />
          <Route path="/kyc" element={<KYC />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
