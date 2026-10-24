import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Activity, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

const API = 'http://localhost:3001';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTransactions: 0, flagged: 0, highRiskPercentage: 0, totalVolume: 0,
    riskDistribution: [], volumeOverTime: [], alertsPerDay: []
  });

  useEffect(() => {
    fetch(`${API}/api/stats`).then(r => r.json()).then(setStats).catch(console.error);
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-sm">
          <p className="text-white font-semibold">{label}</p>
          <p className="text-[#c9ff00]">${payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Tx</h3>
            <Activity className="text-gray-600 group-hover:text-white transition-colors" size={20} />
          </div>
          <p className="text-4xl font-bold text-white">{stats.totalTransactions}</p>
        </div>
        <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 hover:border-red-500/20 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">High Risk</h3>
            <ShieldAlert className="text-red-500/50 group-hover:text-red-400 transition-colors" size={20} />
          </div>
          <p className="text-4xl font-bold text-white relative z-10">{stats.flagged}</p>
        </div>
        <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 hover:border-[#c9ff00]/30 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9ff00]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Risk Level</h3>
            <span className="text-[#c9ff00] font-mono text-sm group-hover:animate-pulse">Live</span>
          </div>
          <p className="text-4xl font-bold text-white relative z-10">{stats.highRiskPercentage.toFixed(1)}%</p>
        </div>
        <div className="bg-[#c9ff00] p-6 rounded-3xl text-black flex flex-col justify-between transform hover:-translate-y-2 transition-transform cursor-pointer shadow-[0_0_30px_rgba(201,255,0,0.15)]">
          <div>
            <h3 className="text-black/70 text-sm font-bold uppercase tracking-wider mb-1">Total Volume</h3>
            <p className="text-3xl font-bold">${stats.totalVolume.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 mt-4 font-semibold text-sm">
            <TrendingUp size={16} /> Live tracking
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Pie */}
        <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5">
          <h3 className="text-white font-bold text-lg mb-6">Risk Distribution</h3>
          {stats.riskDistribution.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.riskDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {stats.riskDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-600">No data yet</div>
          )}
          <div className="flex justify-center gap-6 mt-4">
            {stats.riskDistribution.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-gray-400">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Volume Over Time Line */}
        <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5">
          <h3 className="text-white font-bold text-lg mb-6">Volume Over Time</h3>
          {stats.volumeOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.volumeOverTime}>
                <XAxis dataKey="date" stroke="#555" fontSize={12} />
                <YAxis stroke="#555" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="volume" stroke="#c9ff00" strokeWidth={3} dot={{ fill: '#c9ff00', r: 4 }} activeDot={{ r: 6, fill: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-600">No data yet</div>
          )}
        </div>

        {/* Alerts Per Day Bar */}
        <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5">
          <h3 className="text-white font-bold text-lg mb-6">Alerts Per Day</h3>
          {stats.alertsPerDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.alertsPerDay}>
                <XAxis dataKey="date" stroke="#555" fontSize={12} />
                <YAxis stroke="#555" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="alerts" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-600">No alerts yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
