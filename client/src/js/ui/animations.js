function staggerIn(selector, delay = 50) {
  const reducedMotion = checkReducedMotion();
  const elements = document.querySelectorAll(selector);
  elements.forEach((el, i) => {
    if (reducedMotion) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, i * delay);
  });
}

function countUp(el, from, to, duration = 800) {
  if (checkReducedMotion()) {
    el.textContent = to.toLocaleString();
    return;
  }
  const start = performance.now();
  const diff = to - from;
  function frame(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const value = Math.round(from + diff * eased);
    el.textContent = value.toLocaleString();
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function pulseElement(el) {
  if (checkReducedMotion()) return;
  el.style.transition = 'transform 0.15s ease';
  el.style.transform = 'scale(1.08)';
  setTimeout(() => {
    el.style.transform = 'scale(1)';
  }, 150);
}

function checkReducedMotion() {
  try {
    const raw = localStorage.getItem('vr_quest_player_v2');
    if (raw) {
      const profile = JSON.parse(raw);
      return profile.settings?.reducedMotion === true;
    }
  } catch (e) { /* ignore */ }
  return false;
}

export { staggerIn, countUp, pulseElement };
