import authManager from '../core/auth-manager.js';

const CHALLENGES = [
  { id: 'score500_ta', description: 'Score 500+ in Time Attack', type: 'score', mode: 'timeAttack', target: 500, rewardXp: 100, rewardCoins: 20 },
  { id: 'hit50', description: 'Hit 50 targets in one session', type: 'targetsHit', target: 50, rewardXp: 75, rewardCoins: 15 },
  { id: 'combo5', description: 'Get a x5 combo', type: 'combo', target: 5, rewardXp: 80, rewardCoins: 15 },
  { id: 'play3', description: 'Play 3 games today', type: 'gamesPlayed', target: 3, rewardXp: 50, rewardCoins: 10 },
  { id: 'score200_sniper', description: 'Score 200+ with Sniper', type: 'scoreWeapon', weapon: 'sniper', target: 200, rewardXp: 120, rewardCoins: 25 },
  { id: 'survive300', description: 'Score 300+ in Survival', type: 'score', mode: 'survival', target: 300, rewardXp: 150, rewardCoins: 30 },
  { id: 'hit100_total', description: 'Hit 100 targets today', type: 'totalHitsToday', target: 100, rewardXp: 100, rewardCoins: 20 },
  { id: 'combo8', description: 'Get a x8 combo', type: 'combo', target: 8, rewardXp: 120, rewardCoins: 25 },
  { id: 'play5', description: 'Play 5 games today', type: 'gamesPlayed', target: 5, rewardXp: 80, rewardCoins: 15 },
  { id: 'score1000_ta', description: 'Score 1000+ in Time Attack', type: 'score', mode: 'timeAttack', target: 1000, rewardXp: 200, rewardCoins: 50 },
];

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDailyIndex() {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return seed % CHALLENGES.length;
}

function getDailyChallenge() {
  return CHALLENGES[getDailyIndex()];
}

function getCurrentProgress() {
  const profile = authManager.profile;
  const dc = profile?.dailyChallenge;
  const today = getTodayKey();
  if (dc && dc.date === today) return dc;
  return { id: getDailyChallenge().id, date: today, progress: 0, completed: false, hitsToday: 0, gamesPlayedToday: 0 };
}

async function checkProgress(gameResult) {
  const challenge = getDailyChallenge();
  const state = getCurrentProgress();
  if (state.completed) return { challenge, state, justCompleted: false };

  state.hitsToday = (state.hitsToday || 0) + (gameResult.targetsHit || 0);
  state.gamesPlayedToday = (state.gamesPlayedToday || 0) + 1;

  let current = 0;
  switch (challenge.type) {
    case 'score':
      current = (!challenge.mode || gameResult.mode === challenge.mode) ? gameResult.score : 0;
      state.progress = Math.max(state.progress, current);
      break;
    case 'scoreWeapon':
      current = (gameResult.weapon === challenge.weapon) ? gameResult.score : 0;
      state.progress = Math.max(state.progress, current);
      break;
    case 'targetsHit':
      current = gameResult.targetsHit || 0;
      state.progress = Math.max(state.progress, current);
      break;
    case 'combo':
      current = gameResult.bestCombo || 0;
      state.progress = Math.max(state.progress, current);
      break;
    case 'gamesPlayed':
      state.progress = state.gamesPlayedToday;
      break;
    case 'totalHitsToday':
      state.progress = state.hitsToday;
      break;
  }

  const justCompleted = !state.completed && state.progress >= challenge.target;
  if (justCompleted) {
    state.completed = true;
    await authManager.addXp(challenge.rewardXp);
    const profile = authManager.profile;
    await authManager.saveProfile({ coins: (profile.coins || 0) + challenge.rewardCoins });
  }

  await authManager.saveProfile({ dailyChallenge: state });
  return { challenge, state, justCompleted };
}

export { getDailyChallenge, getCurrentProgress, checkProgress };
export default { getDailyChallenge, getCurrentProgress, checkProgress };
