require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { ethers } = require('ethers');
const { evaluateRisk } = require('./services/amlEngine');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Load Smart Contract Config
const contractConfigPath = './config/contract.json';
let contract;
let wallet;
let provider;

if (fs.existsSync(contractConfigPath)) {
    const config = JSON.parse(fs.readFileSync(contractConfigPath, 'utf8'));
    provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
       wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    contract = new ethers.Contract(config.address, config.abi, wallet);
    console.log(`Connected to Smart Contract at ${config.address}`);
} else {
    console.log("Warning: Smart Contract config not found. Running in mock mode.");
}

// In-memory DB
const transactions = [];
const watchlist = [
    { address: '0xBAD0000000000000000000000000000000000000', reason: 'Known suspicious wallet', addedAt: Date.now() },
    { address: '0xDEAD000000000000000000000000000000000000', reason: 'Sanctioned entity', addedAt: Date.now() },
];

// Helper to get watchlist addresses as flat array
const getWatchlistAddresses = () => watchlist.map(w => w.address);

// ============ STATS ============
app.get('/api/stats', (req, res) => {
    const totalVolume = transactions.reduce((acc, tx) => acc + tx.amount, 0);
    const flagged = transactions.filter(tx => tx.level === 'HIGH').length;
    const lowCount = transactions.filter(tx => tx.level === 'LOW').length;
    const medCount = transactions.filter(tx => tx.level === 'MEDIUM').length;
    const highCount = transactions.filter(tx => tx.level === 'HIGH').length;

    // Volume over time (group by day)
    const volumeByDay = {};
    transactions.forEach(tx => {
        const day = new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        volumeByDay[day] = (volumeByDay[day] || 0) + tx.amount;
    });

    // Alerts per day
    const alertsByDay = {};
    transactions.filter(tx => tx.level === 'HIGH').forEach(tx => {
        const day = new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        alertsByDay[day] = (alertsByDay[day] || 0) + 1;
    });

    res.json({
        totalTransactions: transactions.length,
        flagged,
        highRiskPercentage: transactions.length ? (flagged / transactions.length) * 100 : 0,
        totalVolume,
        riskDistribution: [
            { name: 'Low', value: lowCount, color: '#c9ff00' },
            { name: 'Medium', value: medCount, color: '#f97316' },
            { name: 'High', value: highCount, color: '#ef4444' },
        ],
        volumeOverTime: Object.entries(volumeByDay).map(([date, vol]) => ({ date, volume: vol })),
        alertsPerDay: Object.entries(alertsByDay).map(([date, count]) => ({ date, alerts: count })),
    });
});

// ============ TRANSACTIONS ============
app.get('/api/transactions', (req, res) => {
    res.json(transactions);
});

app.get('/api/transactions/:id', (req, res) => {
    const tx = transactions.find(t => t.id === parseInt(req.params.id));
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json(tx);
});

app.post('/api/transactions', async (req, res) => {
    const tx = req.body;
    const { score, level, reasons } = evaluateRisk(tx, transactions, getWatchlistAddresses());
    
    const newTx = { 
        ...tx, 
        id: transactions.length + 1, 
        timestamp: Date.now(), 
        score, 
        level, 
        reasons, 
        txHash: null 
    };

    // Write to blockchain
    if (contract) {
        try {
            const txResponse = await contract.recordTransaction(
                tx.from, tx.to,
                ethers.parseEther(tx.amount.toString()),
                score
            );
            await txResponse.wait();
            newTx.txHash = txResponse.hash;
            console.log(`Blockchain Tx: ${txResponse.hash} | Risk: ${level}`);
        } catch (error) {
            console.error("Blockchain write error:", error.message);
        }
    }

    transactions.push(newTx);
    res.json(newTx);
});

// ============ ALERTS (flagged transactions) ============
app.get('/api/alerts', (req, res) => {
    const alerts = transactions
        .filter(tx => tx.level === 'HIGH')
        .map(tx => ({
            ...tx,
            alertType: 'HIGH_RISK_TRANSACTION',
            severity: 'critical',
        }));
    res.json(alerts);
});

// ============ WATCHLIST ============
app.get('/api/blacklist', (req, res) => {
    res.json(watchlist);
});

app.post('/api/blacklist', (req, res) => {
    const { address, reason } = req.body;
    if (!address) return res.status(400).json({ error: 'Address is required' });

    // Check if already exists
    const exists = watchlist.find(w => w.address.toLowerCase() === address.toLowerCase());
    if (exists) return res.status(409).json({ error: 'Address already in watchlist' });

    const entry = { address, reason: reason || 'Manual addition', addedAt: Date.now() };
    watchlist.push(entry);
    res.status(201).json(entry);
});

app.delete('/api/blacklist/:address', (req, res) => {
    const idx = watchlist.findIndex(w => w.address.toLowerCase() === req.params.address.toLowerCase());
    if (idx === -1) return res.status(404).json({ error: 'Address not found in watchlist' });
    watchlist.splice(idx, 1);
    res.json({ message: 'Address removed from watchlist' });
});

// ============ FREEZE ACCOUNTS ============
app.post('/api/freeze', async (req, res) => {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Address is required' });
    
    if (contract) {
        try {
            const txResponse = await contract.freezeAccount(address);
            await txResponse.wait();
            res.json({ message: 'Account frozen successfully', txHash: txResponse.hash });
        } catch (error) {
            console.error("Freeze error:", error.message);
            res.status(500).json({ error: 'Failed to freeze account on blockchain' });
        }
    } else {
        res.status(503).json({ error: 'Blockchain not connected' });
    }
});

app.post('/api/unfreeze', async (req, res) => {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Address is required' });
    
    if (contract) {
        try {
            const txResponse = await contract.unfreezeAccount(address);
            await txResponse.wait();
            res.json({ message: 'Account unfrozen successfully', txHash: txResponse.hash });
        } catch (error) {
            console.error("Unfreeze error:", error.message);
            res.status(500).json({ error: 'Failed to unfreeze account on blockchain' });
        }
    } else {
        res.status(503).json({ error: 'Blockchain not connected' });
    }
});

app.listen(port, () => {
    console.log(`Backend API running on http://localhost:${port}`);
});
