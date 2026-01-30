const TOAST_TYPES = {
  success: { bg: '#00cc66', color: '#fff' },
  info: { bg: '#0088cc', color: '#fff' },
  warning: { bg: '#ff8800', color: '#fff' },
  achievement: { bg: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#000' },
  error: { bg: '#ff4444', color: '#fff' },
};

let container = null;

function getContainer() {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function showToast(message, type = 'info', duration = 3000) {
  const c = getContainer();
  const style = TOAST_TYPES[type] || TOAST_TYPES.info;

  const toast = document.createElement('div');
  toast.className = 'toast toast-enter';
  toast.style.background = style.bg;
  toast.style.color = style.color;

  const text = document.createElement('span');
  text.className = 'toast-text';
  text.textContent = message;
  toast.appendChild(text);

  const progress = document.createElement('div');
  progress.className = 'toast-progress';
  progress.style.animationDuration = `${duration}ms`;
  toast.appendChild(progress);

  toast.addEventListener('click', () => dismissToast(toast));
  c.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => toast.classList.remove('toast-enter'));

  const timer = setTimeout(() => dismissToast(toast), duration);
  toast._timer = timer;

  return toast;
}

function dismissToast(toast) {
  if (toast._dismissed) return;
  toast._dismissed = true;
  if (toast._timer) clearTimeout(toast._timer);
  toast.classList.add('toast-exit');
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}

export { showToast, dismissToast };
