const evaluateRisk = (transaction, history, watchlist) => {
  let score = 0;
  const reasons = [];

  // 1. Large transaction over threshold
  if (transaction.amount > 10000) {
    score += 30;
    reasons.push("Large transaction amount");
  }

  // 2. Structuring/smurfing
  const recentTx = history.filter(tx => tx.from === transaction.from && (Date.now() - tx.timestamp) < 86400000);
  if (recentTx.length > 5) {
    score += 40;
    reasons.push("Structuring pattern detected (many recent transactions)");
  }

  // 3. High velocity
  if (recentTx.length > 15) {
    score += 50;
    reasons.push("Extremely high velocity");
  }

  // 4. Blacklisted address interaction (case-insensitive for Ethereum addresses)
  const fromLower = transaction.from.toLowerCase();
  const toLower = transaction.to.toLowerCase();
  const watchlistLower = watchlist.map(addr => addr.toLowerCase());
  if (watchlistLower.includes(fromLower) || watchlistLower.includes(toLower)) {
    score += 80;
    reasons.push("Interaction with watchlisted address");
  }

  // 5. Round amounts
  if (transaction.amount % 100 === 0 && transaction.amount > 500) {
    score += 10;
    reasons.push("Suspicious round amount");
  }

  score = Math.min(score, 100);
  
  let level = "LOW";
  if (score >= 40 && score < 75) level = "MEDIUM";
  if (score >= 75) level = "HIGH";

  return { score, level, reasons };
};

module.exports = { evaluateRisk };
