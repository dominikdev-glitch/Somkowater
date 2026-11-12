(() => {
  const video = document.getElementById('productVideo');
  const track = document.getElementById('scrollTrack');
  const panels = [...document.querySelectorAll('.story-panel')];
  const progressBar = document.getElementById('progressBar');
  const progressNumber = document.getElementById('progressNumber');
  const loader = document.getElementById('loader');
  const scrollHint = document.getElementById('scrollHint');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');

  let targetTime = 0;
  let currentTime = 0;
  let duration = 0;
  let rafPending = false;
  let ready = false;

  // Scroll progress is normalized to the complete 500vh experience section.
  function getProgress() {
    const rect = track.getBoundingClientRect();
    const scrollable = track.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / scrollable));
  }

  function updateFromScroll() {
    const progress = getProgress();
    targetTime = progress * duration;
    progressBar.style.width = `${progress * 100}%`;
    progressNumber.textContent = String(Math.round(progress * 100)).padStart(2, '0');

    let activePanel = panels[0];
    for (const panel of panels) {
      const start = Number(panel.dataset.start);
      const end = Number(panel.dataset.end);
      if (progress >= start && progress <= end) {
        activePanel = panel;
        break;
      }
    }
    panels.forEach(panel => panel.classList.toggle('is-active', panel === activePanel));
    scrollHint.classList.toggle('is-hidden', progress > 0.025);
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(scrubFrame);
    }
  }

  // Lerp the playhead toward the scroll target for smooth, reversible scrubbing.
  function scrubFrame() {
    rafPending = false;
    if (!ready || !Number.isFinite(duration) || duration <= 0) return;
    currentTime += (targetTime - currentTime) * 0.12;
    if (Math.abs(targetTime - currentTime) < 0.015) currentTime = targetTime;
    try {
      if (Math.abs(video.currentTime - currentTime) > 0.012) {
        video.currentTime = Math.max(0, Math.min(duration, currentTime));
      }
    } catch (_) { /* Some browsers wait for a seekable range before accepting a seek. */ }
    if (Math.abs(targetTime - currentTime) >= 0.015) {
      rafPending = true;
      requestAnimationFrame(scrubFrame);
    }
  }

  function reveal() {
    if (ready) return;
    ready = true;
    loader.classList.add('is-hidden');
    updateFromScroll();
  }

  video.addEventListener('loadedmetadata', () => {
    duration = Number.isFinite(video.duration) ? video.duration : 0;
    if (duration > 0) {
      video.currentTime = 0;
      currentTime = targetTime = 0;
      reveal();
    }
  }, { once: true });

  video.addEventListener('loadeddata', reveal, { once: true });
  video.addEventListener('error', () => {
    loader.querySelector('p').textContent = 'Video could not be loaded — check somko-hero.mp4';
    loader.classList.add('has-error');
  }, { once: true });

  window.addEventListener('scroll', updateFromScroll, { passive: true });
  window.addEventListener('resize', updateFromScroll);
  window.addEventListener('pageshow', updateFromScroll);
  video.load();

  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));
  document.getElementById('year').textContent = new Date().getFullYear();

  // Fallback for browsers that never dispatch loadeddata but do expose metadata.
  window.setTimeout(() => {
    if (!ready && video.readyState >= 1 && video.duration > 0) {
      duration = video.duration;
      reveal();
    }
  }, 4500);
})(); 