/**
 * Request immersive VR when WebXR is available (e.g. Quest).
 * @param {HTMLElement} scene - A-Frame scene element (a-scene)
 */
export function tryEnterVR(scene) {
  if (!navigator.xr || !scene || !scene.enterVR) return;
  navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
    if (supported) scene.enterVR();
  }).catch(() => {});
}
