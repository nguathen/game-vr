const DEFAULT_SETTINGS = {
  volume: 80,
  sfx: true,
  vibration: 50,
  crosshairSize: 'medium',
  crosshairColor: '#00ff88',
  highContrast: false,
  reducedMotion: false,
  autoSubmitScore: true,
  showCombo: true,
  bloom: true,
  screenShake: 'medium',
};

function getSettings() {
  try {
    const raw = localStorage.getItem('vr_quest_player_v2');
    if (raw) {
      const profile = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...(profile.settings || {}) };
    }
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

export { DEFAULT_SETTINGS, getSettings };
export default getSettings;
