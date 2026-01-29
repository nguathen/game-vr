/**
 * A-Frame component: handles target being hit.
 * Listens for 'hit' custom event dispatched by shoot-controls.
 * Also supports click (cursor/raycaster click) for non-VR.
 *
 * Usage: <a-entity target-hit>
 */
AFRAME.registerComponent('target-hit', {
  init() {
    this._onHit = this._onHit.bind(this);
    this._onClick = this._onClick.bind(this);

    this.el.addEventListener('hit', this._onHit);
    this.el.addEventListener('click', this._onClick);
    this._destroyed = false;
  },

  remove() {
    this.el.removeEventListener('hit', this._onHit);
    this.el.removeEventListener('click', this._onClick);
  },

  _onClick() {
    this._onHit();
  },

  _onHit() {
    if (this._destroyed) return;
    this._destroyed = true;

    // Explosion effect: scale up briefly then disappear
    this.el.removeAttribute('animation__float');
    this.el.setAttribute('material', 'color: #ffffff; shader: flat');
    this.el.setAttribute('animation__explode', {
      property: 'scale',
      to: '1.5 1.5 1.5',
      dur: 100,
      easing: 'easeOutQuad',
    });

    setTimeout(() => {
      this.el.setAttribute('animation__shrink', {
        property: 'scale',
        to: '0 0 0',
        dur: 150,
        easing: 'easeInBack',
      });
    }, 100);

    // Emit destroyed event for target-system
    setTimeout(() => {
      this.el.emit('destroyed');
      if (this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }
    }, 300);
  },
});
