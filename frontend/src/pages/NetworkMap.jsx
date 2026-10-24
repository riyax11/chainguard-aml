import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

function NetworkMap() {
  const [data, setData] = useState({ nodes: [], links: [] });
  const fgRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes, blRes] = await Promise.all([
          fetch('http://localhost:3001/api/transactions'),
          fetch('http://localhost:3001/api/blacklist')
        ]);
        
        const transactions = await txRes.json();
        const blacklist = await blRes.json();
        const badAddresses = blacklist.map(b => b.address.toLowerCase());

        const nodeMap = new Map();
        const links = [];

        transactions.forEach(tx => {
          // Track volume for size
          const amount = parseFloat(tx.amount);
          
          if (!nodeMap.has(tx.from.toLowerCase())) {
            const isBad = badAddresses.includes(tx.from.toLowerCase());
            nodeMap.set(tx.from.toLowerCase(), {
              id: tx.from.toLowerCase(),
              label: `${tx.from.substring(0,6)}...${isBad ? ' (High Risk)' : ''}`,
              color: isBad ? '#ff3333' : '#c9ff00',
              val: 10
            });
          } else {
             nodeMap.get(tx.from.toLowerCase()).val += amount / 1000;
          }
          
          if (!nodeMap.has(tx.to.toLowerCase())) {
            const isBad = badAddresses.includes(tx.to.toLowerCase());
            nodeMap.set(tx.to.toLowerCase(), {
              id: tx.to.toLowerCase(),
              label: `${tx.to.substring(0,6)}...${isBad ? ' (High Risk)' : ''}`,
              color: isBad ? '#ff3333' : '#ffffff',
              val: 5
            });
          } else {
             nodeMap.get(tx.to.toLowerCase()).val += amount / 1000;
          }
          
          links.push({
            source: tx.from.toLowerCase(),
            target: tx.to.toLowerCase(),
          });
        });

        // Fallback to dummy if no data yet (for demonstration)
        if (transactions.length === 0) {
          const defaultNodes = [
            { id: 'wallet1', val: 10, color: '#c9ff00', label: '0x123...abc' },
            { id: 'wallet2', val: 5, color: '#ffffff', label: '0x456...def' },
            { id: 'wallet3', val: 15, color: '#ff3333', label: '0x789...ghi (High Risk)' },
            { id: 'wallet4', val: 5, color: '#ffffff', label: '0xabc...jkl' }
          ];
          const defaultLinks = [
            { source: 'wallet1', target: 'wallet2' },
            { source: 'wallet2', target: 'wallet3' },
            { source: 'wallet3', target: 'wallet4' }
          ];
          setData({ nodes: defaultNodes, links: defaultLinks });
        } else {
          setData({ nodes: Array.from(nodeMap.values()), links });
        }
      } catch (err) {
        console.error("Failed to fetch network data", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl overflow-hidden relative">
      <div className="flex justify-between items-center mb-6 z-10 relative">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">Network Map</h2>
        <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs">Visualizing Flows</span>
      </div>
      
      <div className="h-[600px] w-full rounded-xl overflow-hidden border border-white/5 bg-[#050505]">
        <ForceGraph2D
          ref={fgRef}
          graphData={data}
          linkColor={() => 'rgba(255,255,255,0.2)'}
          width={1200}
          height={600}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.01}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.label;
            const fontSize = 14 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            
            // Draw Node Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, Math.min(Math.max(node.val, 4), 20), 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color;
            ctx.fill();
            
            // Draw Text Label
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText(label, node.x, node.y + Math.min(Math.max(node.val, 4), 20) + (10 / globalScale));
          }}
        />
      </div>
    </div>
  );
}

export default NetworkMap;
