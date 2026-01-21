export const RISK_PROFILES = {
  conservative: {
    name: 'Conservative',
    kellyMultiplier: 0.25,
    minEdge: 4,
    description: 'Safe bets only, 4%+ edge required'
  },
  balanced: {
    name: 'Balanced',
    kellyMultiplier: 0.5,
    minEdge: 2,
    description: 'Moderate risk, 2%+ edge required'
  },
  aggressive: {
    name: 'Aggressive',
    kellyMultiplier: 1.0,
    minEdge: 1,
    description: 'Maximum growth, 1%+ edge accepted'
  }
};

export function filterByRiskProfile(opportunities, profileKey) {
  const profile = RISK_PROFILES[profileKey] || RISK_PROFILES.balanced;
  return opportunities.filter(opp => opp.edge >= profile.minEdge);
}

export function calculateKellyBet(edge, winProbability, profileKey, bankroll = 1000) {
  const profile = RISK_PROFILES[profileKey] || RISK_PROFILES.balanced;
  
  // Kelly formula: f = (bp - q) / b
  // where b = odds, p = win prob, q = lose prob
  const p = winProbability;
  const q = 1 - p;
  const b = (100 / (100 - edge)) - 1;
  
  let kellyFraction = (b * p - q) / b;
  kellyFraction = Math.max(0, Math.min(kellyFraction, 0.25));
  
  // Apply risk profile multiplier
  const adjustedKelly = kellyFraction * profile.kellyMultiplier;
  const recommendedBet = Math.round(bankroll * adjustedKelly);
  
  return {
    kellyFraction: Math.round(kellyFraction * 1000) / 10,
    adjustedKelly: Math.round(adjustedKelly * 1000) / 10,
    recommendedBet,
    profileUsed: profile.name
  };
}

export function getTrafficLight(edge) {
  if (edge >= 3) return { color: 'green', label: 'Strong' };
  if (edge >= 2) return { color: 'yellow', label: 'Moderate' };
  return { color: 'red', label: 'Weak' };
}
