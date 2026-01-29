const SKINS = {
  default: {
    id: 'default',
    name: 'Default',
    laserColor: null,
    laserOpacity: null,
    burstColor: null,
    unlockType: 'free',
    unlockValue: 0,
  },
  fire: {
    id: 'fire',
    name: 'Fire',
    laserColor: '#ff4400',
    laserOpacity: 0.8,
    burstColor: '#ff6600',
    unlockType: 'level',
    unlockValue: 5,
  },
  ice: {
    id: 'ice',
    name: 'Ice',
    laserColor: '#00ddff',
    laserOpacity: 0.85,
    burstColor: '#88eeff',
    unlockType: 'level',
    unlockValue: 8,
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    laserColor: '#ff00cc',
    laserOpacity: 0.9,
    burstColor: '#ff44dd',
    unlockType: 'coins',
    unlockValue: 100,
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    laserColor: '#ffd700',
    laserOpacity: 0.85,
    burstColor: '#ffee44',
    unlockType: 'achievement',
    unlockValue: 'centurion',
  },
  phantom: {
    id: 'phantom',
    name: 'Phantom',
    laserColor: '#8844ff',
    laserOpacity: 0.5,
    burstColor: '#9966ff',
    unlockType: 'level',
    unlockValue: 12,
  },
  electric: {
    id: 'electric',
    name: 'Electric',
    laserColor: '#4488ff',
    laserOpacity: 0.9,
    burstColor: '#66aaff',
    unlockType: 'coins',
    unlockValue: 150,
  },
  rainbow: {
    id: 'rainbow',
    name: 'Rainbow',
    laserColor: '#ff0000',
    laserOpacity: 0.8,
    burstColor: '#ffffff',
    unlockType: 'level',
    unlockValue: 15,
    rainbow: true,
  },
};

function isSkinUnlocked(skinId, profile) {
  const skin = SKINS[skinId];
  if (!skin) return false;
  if (skin.unlockType === 'free') return true;
  if (skin.unlockType === 'level') return profile.level >= skin.unlockValue;
  if (skin.unlockType === 'achievement') return (profile.achievements || []).includes(skin.unlockValue);
  if (skin.unlockType === 'coins') return (profile.purchasedSkins || []).includes(skinId);
  return false;
}

function getUnlockedSkins(profile) {
  return Object.values(SKINS).filter(s => isSkinUnlocked(s.id, profile));
}

function getSkinOverrides(skinId, baseWeapon) {
  const skin = SKINS[skinId];
  if (!skin || skinId === 'default') return {};
  return {
    laserColor: skin.laserColor || baseWeapon.laserColor,
    laserOpacity: skin.laserOpacity || baseWeapon.laserOpacity,
    burstColor: skin.burstColor,
  };
}

function purchaseSkin(skinId, profile, saveProfile) {
  const skin = SKINS[skinId];
  if (!skin || skin.unlockType !== 'coins') return false;
  if ((profile.purchasedSkins || []).includes(skinId)) return false;
  if ((profile.coins || 0) < skin.unlockValue) return false;

  const purchased = [...(profile.purchasedSkins || []), skinId];
  const coins = profile.coins - skin.unlockValue;
  saveProfile({ purchasedSkins: purchased, coins });
  return true;
}

export { SKINS, isSkinUnlocked, getUnlockedSkins, getSkinOverrides, purchaseSkin };
export default { SKINS, isSkinUnlocked, getUnlockedSkins, getSkinOverrides, purchaseSkin };
