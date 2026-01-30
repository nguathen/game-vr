function buildSummary(gameResult, profile, mode, targetSystem) {
  const score = gameResult.score;
  const targetsHit = targetSystem.targetsHit;
  const bestCombo = targetSystem.bestCombo;
  const shotsFired = gameResult.shotsFired || 0;
  const accuracy = shotsFired > 0 ? Math.round((targetsHit / shotsFired) * 100) : 0;

  const highScore = profile?.highScores?.[mode.id] || 0;
  const isNewHigh = score > highScore && score > 0;
  const vsBest = score - highScore;

  const baseXp = Math.floor(score / 5);
  const xpEarned = Math.floor(baseXp * mode.xpMultiplier);

  return {
    score,
    targetsHit,
    bestCombo,
    shotsFired,
    accuracy,
    isNewHigh,
    vsBest,
    xpEarned,
    modeName: mode.name,
    modeIcon: mode.icon,
  };
}

function formatShareText(summary) {
  const lines = [
    `VR Quest | ${summary.modeName}`,
    `Score: ${summary.score.toLocaleString()} | Combo: x${summary.bestCombo}`,
    `Accuracy: ${summary.accuracy}%`,
  ];
  if (summary.isNewHigh) lines.push('New High Score!');
  lines.push('Can you beat my score?');
  return lines.join('\n');
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}

export { buildSummary, formatShareText, copyToClipboard };
