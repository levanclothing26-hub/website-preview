const video = document.querySelector('#shirt-video');
const canvas = document.querySelector('#human-model-canvas');
const stage = document.querySelector('.portrait-stage');
const section = document.querySelector('#experience');
const leadForm = document.querySelector('#lead-form');
const leadStatus = document.querySelector('#lead-status');
const rangeFilters = [...document.querySelectorAll('.range-filter')];
const rangeCards = [...document.querySelectorAll('.range-card')];
const themeToggle = document.querySelector('#theme-toggle');
const themeIcon = themeToggle?.querySelector('.theme-toggle-icon');
const themeLabel = themeToggle?.querySelector('.theme-toggle-label');

function applyTheme(theme, persist = true) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  themeToggle?.setAttribute('aria-pressed', String(isDark));
  themeToggle?.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  themeToggle?.setAttribute('title', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  if (themeIcon) themeIcon.textContent = isDark ? '☼' : '☾';
  if (themeLabel) themeLabel.textContent = isDark ? 'LIGHT' : 'DARK';
  if (persist) {
    try { localStorage.setItem('levan-theme', isDark ? 'dark' : 'light'); } catch {}
  }
}

let savedTheme = 'light';
try { savedTheme = localStorage.getItem('levan-theme') === 'dark' ? 'dark' : 'light'; } catch {}
applyTheme(savedTheme, false);
themeToggle?.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

const motionTargets = document.querySelectorAll(
  '.about-copy, .about-visual, .manifesto-left, .portrait-stage, .system-head, .diagram-wrap, .range-head, .range-visual, .range-card-copy, .details-copy, .detail-photo, .location-intro, .lead-form, .finale-copy',
);
const hero = document.querySelector('.hero');
const heroImage = document.querySelector('.hero-image');
const topbar = document.querySelector('.topbar');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function updatePageProgress() {
  if (!topbar) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  topbar.style.setProperty('--page-progress', String(Math.max(0, Math.min(progress, 1))));
}

if (!reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  hero?.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    hero.style.setProperty('--pointer-x', `${(x * 100).toFixed(1)}%`);
    hero.style.setProperty('--pointer-y', `${(y * 100).toFixed(1)}%`);
    heroImage?.style.setProperty('--hero-shift-x', `${((0.5 - x) * 15).toFixed(1)}px`);
    heroImage?.style.setProperty('--hero-shift-y', `${((0.5 - y) * 10).toFixed(1)}px`);
  });

  hero?.addEventListener('pointerleave', () => {
    hero.style.setProperty('--pointer-x', '70%');
    hero.style.setProperty('--pointer-y', '45%');
    heroImage?.style.setProperty('--hero-shift-x', '0px');
    heroImage?.style.setProperty('--hero-shift-y', '0px');
  });

  rangeCards.forEach((card) => {
    card.classList.add('is-interactive');
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      const visualBounds = card.querySelector('.range-visual').getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty('--tilt-x', `${((x - 0.5) * 4).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${((0.5 - y) * 4).toFixed(2)}deg`);
      const lightX = Math.max(0, Math.min(1, (event.clientX - visualBounds.left) / visualBounds.width));
      const lightY = Math.max(0, Math.min(1, (event.clientY - visualBounds.top) / visualBounds.height));
      card.style.setProperty('--card-x', `${(lightX * 100).toFixed(1)}%`);
      card.style.setProperty('--card-y', `${(lightY * 100).toFixed(1)}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('motion-enhanced');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in-view');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  motionTargets.forEach((target, index) => {
    target.classList.add('motion-reveal');
    target.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 75}ms`);
    revealObserver.observe(target);
  });
}

rangeFilters.forEach((filter) => filter.addEventListener('click', () => {
  const category = filter.dataset.rangeFilter;
  rangeFilters.forEach((item) => {
    const selected = item === filter;
    item.classList.toggle('is-active', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  rangeCards.forEach((card) => {
    card.hidden = category !== 'all' && card.dataset.category !== category;
  });
}));

leadForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = leadForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  leadStatus.textContent = 'Sending your request…';
  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(leadForm))),
    });
    if (!response.ok) throw new Error('Unable to send request');
    leadForm.reset();
    leadStatus.textContent = 'Thank you. We will notify you about the nearest LEVAN location.';
  } catch {
    leadStatus.textContent = 'We could not send your request right now. Please try again shortly.';
  } finally {
    submit.disabled = false;
  }
});
const slider = document.querySelector('#rotation-slider');
const playButton = document.querySelector('#motion-toggle');
const status = document.querySelector('#model-status');
const frameCount = document.querySelector('#frame-count');
const stageLabel = document.querySelector('#stage-label');
const progressFill = document.querySelector('#stage-progress-fill');
const features = [...document.querySelectorAll('.feature')];
const diagramHotspots = [...document.querySelectorAll('.diagram-hotspot')];
const humanModelUrl = './assets/levan-human-shirt.glb';

let duration = 0;
let modelViewer = null;
let modelProgress = 0;
let pointerX = null;
let suppressScrollSyncUntil = 0;
let rafPending = false;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function paintProgress(progress) {
  const percent = clamp(progress, 0, 1);
  slider.value = String(Math.round(percent * 1000));
  progressFill.style.width = `${percent * 100}%`;
  if (modelViewer) {
    stageLabel.textContent = 'HUMAN-WORN MODEL · ROTATION';
    frameCount.textContent = `${String(Math.round(percent * 360)).padStart(3, '0')}° · DRAG TO TURN`;
    return;
  }
  const seconds = percent * duration;
  const views = [
    [1.15, 'FILMED MOTION REFERENCE'],
    [3.5, 'FORM & FIT · VIDEO STUDY'],
    [6.25, 'PREMIUM FINISHING · VIDEO STUDY'],
    [Infinity, 'COMFORT SYSTEM · VIDEO STUDY'],
  ];
  stageLabel.textContent = views.find(([end]) => seconds < end)?.[1] ?? 'COMFORT SYSTEM · VIDEO STUDY';
  frameCount.textContent = `${String(Math.round(percent * 360)).padStart(3, '0')}° · MOTION REFERENCE`;
}

function seek(progress, fromScroll = false) {
  const percent = clamp(progress, 0, 1);
  if (!fromScroll) suppressScrollSyncUntil = performance.now() + 1100;
  if (modelViewer) {
    modelProgress = percent;
    modelViewer.setProgress(percent);
    paintProgress(percent);
    return;
  }
  if (!duration) return;
  if (!fromScroll) video.pause();
  video.currentTime = percent * Math.max(0, duration - 0.035);
  paintProgress(video.currentTime / duration);
}

function syncFromScroll() {
  if ((!duration && !modelViewer) || performance.now() < suppressScrollSyncUntil) return;
  const rect = section.getBoundingClientRect();
  const travel = Math.max(1, section.offsetHeight - window.innerHeight);
  const progress = clamp(-rect.top / travel, 0, 1);
  if (modelViewer) {
    modelProgress = progress;
    modelViewer.setProgress(progress);
    paintProgress(progress);
    return;
  }
  if (!video.paused) video.pause();
  seek(progress, true);
}

function scheduleScrollSync() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    syncFromScroll();
    rafPending = false;
  });
}

video.addEventListener('loadedmetadata', () => {
  duration = Number.isFinite(video.duration) ? video.duration : 0;
  status.hidden = true;
  paintProgress(0);
  scheduleScrollSync();
});
video.addEventListener('error', () => {
  if (modelViewer) return;
  status.textContent = 'MOTION REFERENCE COULD NOT BE LOADED';
  status.classList.add('is-error');
  console.error('LEVAN motion reference failed to load', video.error);
});
video.addEventListener('timeupdate', () => {
  if (duration && !modelViewer) paintProgress(video.currentTime / duration);
});
video.addEventListener('play', () => {
  if (modelViewer) return;
  playButton.textContent = 'PAUSE';
  playButton.setAttribute('aria-pressed', 'true');
});
video.addEventListener('pause', () => {
  if (modelViewer) return;
  playButton.textContent = 'PLAY';
  playButton.setAttribute('aria-pressed', 'false');
});

slider.addEventListener('input', () => seek(Number(slider.value) / 1000));
playButton.addEventListener('click', async () => {
  if (modelViewer) {
    const playing = playButton.getAttribute('aria-pressed') !== 'true';
    modelViewer.setPlaying(playing);
    playButton.textContent = playing ? 'PAUSE' : 'PLAY';
    playButton.setAttribute('aria-pressed', String(playing));
    return;
  }
  if (video.paused) {
    if (video.currentTime >= duration - 0.1) seek(0);
    try { await video.play(); } catch (error) { console.error('LEVAN motion reference playback failed', error); }
  } else {
    video.pause();
  }
});

function attachDrag(surface, isModelSurface) {
  surface.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerX = event.clientX;
    if (isModelSurface) {
      modelViewer?.setPlaying(false);
      playButton.textContent = 'PLAY';
      playButton.setAttribute('aria-pressed', 'false');
    } else {
      video.pause();
    }
    surface.classList.add('is-grabbing');
    surface.setPointerCapture(event.pointerId);
  });
  surface.addEventListener('pointermove', (event) => {
    if (pointerX === null) return;
    const dx = event.clientX - pointerX;
    pointerX = event.clientX;
    const width = Math.max(1, stage.getBoundingClientRect().width);
    if (isModelSurface && modelViewer) {
      modelProgress = ((modelProgress + dx / width) % 1 + 1) % 1;
      modelViewer.drag(dx, width);
      paintProgress(modelProgress);
    } else if (duration) {
      seek(video.currentTime / duration + dx / width);
    }
  });
  function endDrag(event) {
    if (pointerX !== null) {
      const finalDelta = event.clientX - pointerX;
      const width = Math.max(1, stage.getBoundingClientRect().width);
      if (Math.abs(finalDelta) > 1) {
        if (isModelSurface && modelViewer) {
          modelProgress = ((modelProgress + finalDelta / width) % 1 + 1) % 1;
          modelViewer.drag(finalDelta, width);
          paintProgress(modelProgress);
        } else if (duration) {
          seek(video.currentTime / duration + finalDelta / width);
        }
      }
    }
    pointerX = null;
    surface.classList.remove('is-grabbing');
    if (surface.hasPointerCapture?.(event.pointerId)) surface.releasePointerCapture(event.pointerId);
  }
  surface.addEventListener('pointerup', endDrag);
  surface.addEventListener('pointercancel', endDrag);
}

attachDrag(video, false);

async function loadHumanWornModelIfAvailable() {
  try {
    const response = await fetch(humanModelUrl, { method: 'HEAD', cache: 'no-store' });
    if (!response.ok) return;
    const approvalResponse = await fetch('./assets/levan-human-shirt.approved.json', { cache: 'no-store' });
    if (!approvalResponse.ok) return;
    const approval = await approvalResponse.json();
    const requiredViews = ['front', 'left', 'right', 'back'];
    if (approval.status !== 'approved'
      || approval.asset !== 'levan-human-shirt.glb'
      || approval.humanWorn !== true
      || !requiredViews.every((view) => approval.verifiedViews?.includes(view))) return;
    status.hidden = false;
    status.classList.remove('is-error');
    status.textContent = 'LOADING MODEL-REVIEWED HUMAN-WORN MODEL';
    const { createHumanModelViewer } = await import('./human-model-viewer.js');
    modelViewer = await createHumanModelViewer({
      canvas,
      assetUrl: humanModelUrl,
      onProgress: (progress) => {
        modelProgress = progress;
        if (modelViewer) paintProgress(progress);
      },
    });
    video.hidden = true;
    canvas.hidden = false;
    status.hidden = true;
    playButton.textContent = 'PLAY';
    playButton.setAttribute('aria-pressed', 'false');
    attachDrag(canvas, true);
    scheduleScrollSync();
  } catch (error) {
    modelViewer?.dispose();
    modelViewer = null;
    canvas.hidden = true;
    video.hidden = false;
    status.hidden = true;
    stageLabel.textContent = 'FILMED MOTION REFERENCE';
    console.error('LEVAN human-worn GLB could not be loaded; keeping the motion reference visible.', error);
  }
}

loadHumanWornModelIfAvailable();
window.addEventListener('scroll', scheduleScrollSync, { passive: true });
window.addEventListener('scroll', updatePageProgress, { passive: true });
window.addEventListener('resize', () => {
  scheduleScrollSync();
  updatePageProgress();
});
updatePageProgress();

diagramHotspots.forEach((hotspot) => {
  hotspot.addEventListener('click', () => {
    const selected = Number(hotspot.dataset.feature);
    features.forEach((feature, index) => {
      const isSelected = index === selected;
      feature.classList.toggle('is-current', isSelected);
      feature.classList.add('is-visible');
    });
    diagramHotspots.forEach((item) => {
      const isSelected = item === hotspot;
      item.classList.toggle('is-current', isSelected);
      item.setAttribute('aria-pressed', String(isSelected));
    });
  });
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        features.forEach((feature) => feature.classList.toggle('is-current', feature === entry.target));
      }
    }
  }, { threshold: 0.6 });
  features.forEach((feature) => observer.observe(feature));
}
