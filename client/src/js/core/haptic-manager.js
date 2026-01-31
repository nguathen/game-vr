import { getSettings } from '../game/settings-util.js';

class HapticManager {
  pulse(intensity, duration) {
    const settings = getSettings();
    const scale = (settings.vibration ?? 50) / 100;
    if (scale === 0) return;

    const scaledIntensity = Math.min(intensity * scale, 1.0);
    ['left-hand', 'right-hand'].forEach(id => {
      const el = document.getElementById(id);
      const tracked = el?.components?.['oculus-touch-controls']
        || el?.components?.['tracked-controls'];
      if (tracked?.controller?.gamepad?.hapticActuators?.[0]) {
        try {
          tracked.controller.gamepad.hapticActuators[0].pulse(scaledIntensity, duration);
        } catch { /* ignore */ }
      }
    });
  }

  hit()           { this.pulse(0.4, 40); }
  combo(n)        { this.pulse(Math.min(0.3 + n * 0.05, 1.0), 60); }
  powerUp()       { this._pattern([0.5, 80], [0.0, 50], [0.7, 80]); }
  slowMo()        { this.pulse(0.8, 200); }
  damageTaken()   { this._pattern([1.0, 100], [0.0, 50], [1.0, 100]); }
  bossKill()      { this._pattern([0.6, 60], [0.0, 40], [0.8, 80], [0.0, 40], [1.0, 120]); }

  // Weapon-specific fire patterns
  firePistol()    { this.pulse(0.3, 40); }
  fireShotgun()   { this._pattern([1.0, 60], [0.4, 80]); }
  fireSniper()    { this._pattern([0.2, 30], [0.8, 100]); }

  // Target-type hit confirmation
  hitStandard()   { this.pulse(0.4, 40); }
  hitHeavy()      { this._pattern([0.6, 60], [0.0, 30], [0.8, 80]); }
  hitBonus()      { this._pattern([0.5, 40], [0.0, 30], [0.5, 40], [0.0, 30], [0.5, 40]); }
  hitDecoy()      { this._pattern([1.0, 80], [0.0, 40], [1.0, 80]); }
  hitSpeed()      { this.pulse(0.5, 30); }
  hitBoss()       { this._pattern([0.7, 80], [0.0, 40], [1.0, 120]); }

  async _pattern(...steps) {
    for (const [intensity, duration] of steps) {
      if (intensity > 0) this.pulse(intensity, duration);
      await new Promise(r => setTimeout(r, duration));
    }
  }
}

const hapticManager = new HapticManager();
export default hapticManager;
