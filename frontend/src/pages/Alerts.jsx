import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, ExternalLink, X, FileText, Cpu, Download, Lock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ethers } from 'ethers';
import contractData from '../../../backend/config/contract.json';

const API = 'http://localhost:3001';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/alerts`).then(r => r.json()).then(setAlerts).catch(console.error);
  }, []);

  const handleSelectAlert = (alert) => {
    setSelectedAlert(alert);
    setAiExplanation('');
  };

  const generateExplanation = (alert) => {
    setIsGeneratingAI(true);
    setAiExplanation('');
    setTimeout(() => {
      let explanation = "AI Analysis Complete: ";
      if (alert.amount > 50000) explanation += "The transaction amount significantly exceeds typical baseline thresholds for retail accounts, a strong indicator of potential structuring or bulk cash smuggling. ";
      if (alert.reasons?.some(r => r.includes('Sanctioned') || r.includes('blacklisted') || r.includes('watchlist'))) {
        explanation += "CRITICAL: Involves an address matching a known sanctioned or watchlisted entity. Immediate asset freeze is mandated by compliance policy. ";
      }
      explanation += "The algorithmic risk engine flagged the combination of these factors, indicating a high probability of money laundering or illicit financial movement. A manual review by a compliance officer is strongly advised.";
      setAiExplanation(explanation);
      setIsGeneratingAI(false);
    }, 1500);
  };

  const downloadSAR = (alert) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(200, 0, 0);
    doc.text('Suspicious Activity Report (SAR)', 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
    doc.text(`Financial Crimes Enforcement Network (FinCEN) Format`, 20, 38);
    
    autoTable(doc, {
      startY: 45,
      head: [['Field', 'Details']],
      body: [
        ['Transaction ID', `#${alert.id.toString().padStart(4, '0')}`],
        ['Timestamp', new Date(alert.timestamp).toLocaleString()],
        ['Sender Address', alert.from],
        ['Receiver Address', alert.to],
        ['Amount', `$${alert.amount.toLocaleString()}`],
        ['Risk Score', `${alert.score}/100 (HIGH RISK)`],
        ['Triggered Rules', alert.reasons?.join('\n') || 'N/A'],
        ['On-Chain Hash', alert.txHash || 'Pending']
      ],
      theme: 'grid',
      headStyles: { fillColor: [200, 0, 0] },
      styles: { fontSize: 10, cellPadding: 5 }
    });
    
    doc.save(`SAR_Report_Tx_${alert.id}.pdf`);
  };

  const handleMetaMaskFreeze = async (address) => {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }
    try {
      setIsFreezing(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractData.address, contractData.abi, signer);
      
      const tx = await contract.freezeAccount(address);
      await tx.wait();
      
      alert(`Successfully froze account ${address} on the blockchain!`);
    } catch (err) {
      console.error(err);
      
      // Try to extract a readable error message
      let errorMessage = "Transaction failed or was rejected.";
      if (err.reason) errorMessage = err.reason;
      else if (err.info && err.info.error && err.info.error.message) errorMessage = err.info.error.message;
      else if (err.message) errorMessage = err.message;
      
      alert(`Error: ${errorMessage}\n\n(Check console for full details)`);
    } finally {
      setIsFreezing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center relative">
          <ShieldAlert className="text-red-400" size={24} />
          {alerts.length > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">{alerts.length}</div>}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Security Alerts</h1>
          <p className="text-gray-500">High-risk transactions flagged by the AML engine</p>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        {alerts.map(alert => (
          <div key={alert.id} onClick={() => handleSelectAlert(alert)} className="bg-[#0f0f0f] p-6 rounded-3xl border border-red-500/10 hover:border-red-500/30 transition-all cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="text-red-400" size={18} />
                  <span className="text-red-400 font-bold text-sm uppercase tracking-wider">Critical Alert — Score: {alert.score}/100</span>
                  <span className="text-gray-600 text-xs">{new Date(alert.timestamp).toLocaleString()}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-6 mb-3">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">From</p>
                    <p className="text-white font-mono text-sm">{alert.from}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">To</p>
                    <p className="text-white font-mono text-sm">{alert.to}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Amount</p>
                    <p className="text-white font-bold text-lg">${alert.amount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {alert.reasons?.map((reason, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
              
              <button className="text-gray-600 group-hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5">
                <ExternalLink size={18} />
              </button>
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="bg-[#0f0f0f] p-16 rounded-3xl border border-white/5 text-center">
            <ShieldAlert className="mx-auto mb-4 text-gray-700" size={48} />
            <h3 className="text-white font-bold text-xl mb-2">All Clear</h3>
            <p className="text-gray-500">No high-risk transactions have been flagged yet.</p>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedAlert(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-lg bg-[#0a0a0a] border-l border-white/10 h-full overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">Alert Details</h2>
              <button onClick={() => setSelectedAlert(null)} className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-red-400 font-bold">HIGH RISK</span>
                  <span className="text-white font-bold text-2xl">{selectedAlert.score}/100</span>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Transaction ID</p>
                <p className="text-white font-mono">#{selectedAlert.id.toString().padStart(4, '0')}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Sender</p>
                <p className="text-white font-mono text-sm break-all">{selectedAlert.from}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Receiver</p>
                <p className="text-white font-mono text-sm break-all">{selectedAlert.to}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Amount</p>
                <p className="text-white font-bold text-3xl">${selectedAlert.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Timestamp</p>
                <p className="text-white">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
              </div>
              {selectedAlert.txHash && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">On-Chain Hash</p>
                  <p className="text-[#c9ff00] font-mono text-xs break-all">{selectedAlert.txHash}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Triggered Rules</p>
                <div className="space-y-2">
                  {selectedAlert.reasons?.map((reason, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                      <AlertTriangle className="text-red-400 shrink-0" size={16} />
                      <span className="text-gray-300 text-sm">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* AI & PDF Action Area */}
              <div className="pt-6 mt-6 border-t border-white/10 space-y-4">
                <div className="flex gap-4">
                  <button 
                    onClick={() => generateExplanation(selectedAlert)}
                    disabled={isGeneratingAI}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isGeneratingAI ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Cpu size={18} />}
                    {isGeneratingAI ? 'Analyzing...' : 'AI Risk Analysis'}
                  </button>
                  <button 
                    onClick={() => downloadSAR(selectedAlert)}
                    className="flex-1 bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Download size={18} />
                    Export SAR (PDF)
                  </button>
                </div>
                
                <button 
                  onClick={() => handleMetaMaskFreeze(selectedAlert.from)}
                  disabled={isFreezing}
                  className="w-full mt-2 bg-red-600 hover:bg-red-500 text-white font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50"
                >
                  <Lock size={20} />
                  {isFreezing ? "AWAITING METAMASK SIGNATURE..." : "FREEZE ASSETS VIA SMART CONTRACT"}
                </button>

                {aiExplanation && (
                  <div className="mt-4 p-5 rounded-2xl bg-blue-900/20 border border-blue-500/30 text-blue-100 text-sm leading-relaxed relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex items-start gap-3">
                      <Cpu className="text-blue-400 mt-1 shrink-0" size={18} />
                      <p>{aiExplanation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
