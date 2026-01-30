AFRAME.registerComponent('menu-button', {
  schema: {
    color: { default: '#1a1a4e' },
    hoverColor: { default: '#2a2a6e' },
    activeColor: { default: '#00d4ff' },
    selected: { default: false },
    group: { default: '' },
    value: { default: '' }
  },

  init() {
    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onClick = this._onClick.bind(this);
    this._bound = false;

    // Defer setup — child elements may not exist yet in init()
    setTimeout(() => this._setupEvents(), 0);
  },

  _setupEvents() {
    if (this._bound) return;
    const bg = this.el.querySelector('.btn-bg');
    const target = bg || this.el;
    target.classList.add('menu-btn');
    target.addEventListener('mouseenter', this._onMouseEnter);
    target.addEventListener('mouseleave', this._onMouseLeave);
    target.addEventListener('click', this._onClick);
    this._target = target;
    this._bound = true;
    this._updateColor();
  },

  update(oldData) {
    if (oldData.selected !== this.data.selected) {
      this._updateColor();
    }
  },

  _updateColor() {
    const bg = this.el.querySelector('.btn-bg') || this.el;
    const color = this.data.selected ? this.data.activeColor : this.data.color;
    bg.setAttribute('material', 'color', color);
  },

  _onMouseEnter() {
    if (this.data.selected) return;
    const bg = this.el.querySelector('.btn-bg') || this.el;
    bg.setAttribute('material', 'color', this.data.hoverColor);
  },

  _onMouseLeave() {
    this._updateColor();
  },

  _onClick() {
    this.el.emit('menuclick', { value: this.data.value, group: this.data.group });
  },

  remove() {
    if (this._target) {
      this._target.removeEventListener('mouseenter', this._onMouseEnter);
      this._target.removeEventListener('mouseleave', this._onMouseLeave);
      this._target.removeEventListener('click', this._onClick);
    }
  }
});
