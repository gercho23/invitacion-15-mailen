/* =============================================
   FIXES MÓVIL
   ============================================= */
// Fuerza scroll al tope al cargar (evita que el browser restaure posición anterior)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// Variable --vh real para iOS Safari (evita que la barra del browser corte el hero)
// Solo se recalcula al cargar y al cambiar orientación — nunca en resize,
// porque en iOS el resize se dispara al ocultar/mostrar la barra del browser.
function setVh() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
setVh();
window.addEventListener('orientationchange', () => setTimeout(setVh, 150));

/* =============================================
   PARTÍCULAS — ESTRELLAS FLOTANDO EN EL HERO
   ============================================= */
(function () {
  const INTERVAL = 1000 / 30; // 30 fps
  let lastFrame  = 0;

  // Un registro por sección: canvas + elemento host
  const layers = [
    { id: 'particles',          hostId: 'hero',      maxCount: 45 },
    { id: 'particles-intro',    hostSel: '.intro-msg', maxCount: 25 },
    { id: 'particles-countdown',hostId: 'countdown',  maxCount: 25 },
  ].map(cfg => {
    const canvas = document.getElementById(cfg.id);
    const host   = cfg.hostId ? document.getElementById(cfg.hostId)
                              : document.querySelector(cfg.hostSel);
    return { canvas, ctx: canvas.getContext('2d'), host, particles: [], maxCount: cfg.maxCount };
  });

  function makeParticle(w, h, randomY) {
    return {
      x:          Math.random() * w,
      y:          randomY ? Math.random() * h : h + 12,
      size:       Math.random() * 2.2 + 0.5,
      vy:         -(Math.random() * 0.35 + 0.08),
      vx:         (Math.random() - 0.5) * 0.12,
      alpha:      Math.random() * 0.45 + 0.05,
      alphaSpeed: Math.random() * 0.004 + 0.001,
      alphaDir:   Math.random() > 0.5 ? 1 : -1,
    };
  }

  function drawStar(ctx, x, y, size, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = '#d8d8d8';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const r     = i % 2 === 0 ? size : size * 0.28;
      if (i === 0) ctx.moveTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
      else         ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
  }

  function init() {
    layers.forEach(l => {
      l.canvas.width  = l.host.offsetWidth;
      l.canvas.height = l.host.offsetHeight;
      const count = Math.min(l.maxCount, Math.floor((l.canvas.width * l.canvas.height) / 16000));
      l.particles = Array.from({ length: count }, () => makeParticle(l.canvas.width, l.canvas.height, true));
    });
  }

  function draw(ts) {
    requestAnimationFrame(draw);
    if (ts - lastFrame < INTERVAL) return;
    lastFrame = ts;

    layers.forEach(l => {
      const { ctx, canvas, particles } = l;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx;  p.y += p.vy;
        p.alpha += p.alphaSpeed * p.alphaDir;
        if (p.alpha > 0.6 || p.alpha < 0.03) p.alphaDir *= -1;
        if (p.y < -12) l.particles[i] = makeParticle(canvas.width, canvas.height, false);
        drawStar(ctx, p.x, p.y, p.size, p.alpha);
      });
      ctx.globalAlpha = 1;
    });
  }

  init();
  requestAnimationFrame(draw);
  window.addEventListener('resize', init);
})();


/* =============================================
   CONFETTI PLATEADO (se dispara en el RSVP)
   ============================================= */
function launchConfetti() {
  const cv  = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;inset:0;z-index:998;pointer-events:none;';
  cv.width  = window.innerWidth;
  cv.height = window.innerHeight;
  document.body.appendChild(cv);

  const ctx    = cv.getContext('2d');
  const colors = ['#ffffff', '#d0d0d0', '#b0b0b0', '#e8e8e8', '#a8a8a8'];
  const pieces = [];

  for (let i = 0; i < 180; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 9 + 4;
    pieces.push({
      x:    cv.width / 2 + (Math.random() - 0.5) * 100,
      y:    cv.height * 0.55,
      vx:   Math.cos(angle) * speed,
      vy:   Math.sin(angle) * speed - 6,
      grav: 0.35,
      rot:  Math.random() * Math.PI * 2,
      rs:   (Math.random() - 0.5) * 0.25,
      w:    Math.random() * 9 + 4,
      h:    Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
    });
  }

  let frame = 0;
  const MAX  = 200;

  (function tick() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    pieces.forEach(p => {
      p.x  += p.vx;  p.vx *= 0.985;
      p.y  += p.vy;  p.vy += p.grav;
      p.rot += p.rs;
      p.alpha = Math.max(0, 1 - frame / MAX);
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < MAX) requestAnimationFrame(tick);
    else cv.remove();
  })();
}

/* =============================================
   PARALLAX + CENTRADO DE CARA EN HERO
   La cara de Mailen está en el cuarto superior del portrait.
   Usamos un offset base (28% del viewport) para bajar la imagen
   de modo que la cara quede centrada en el hero.
   ============================================= */
const heroImg = document.getElementById('heroImg');

/* Bucle sin pantallazo negro: reinicia el video 0.3s antes de que termine */
if (heroImg && heroImg.tagName === 'VIDEO') {
  heroImg.addEventListener('timeupdate', () => {
    if (heroImg.duration && heroImg.currentTime >= heroImg.duration - 0.3) {
      heroImg.currentTime = 0;
    }
  });
}

// Parallax desactivado (hero es video, no imagen estática)

/* =============================================
   CUENTA REGRESIVA
   ============================================= */
function updateCountdown() {
  // Evento: 3 de Julio 2026 a las 22:00 hs (hora Buenos Aires, UTC-3)
  const event = new Date('2026-07-03T22:00:00-03:00');
  const now   = new Date();
  const diff  = event - now;

  if (diff <= 0) {
    ['cd-days','cd-hours','cd-minutes','cd-seconds'].forEach(id => {
      document.getElementById(id).textContent = '00';
    });
    return;
  }

  const days    = Math.floor(diff / 86400000);
  const hours   = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000)  / 60000);
  const seconds = Math.floor((diff % 60000)    / 1000);

  document.getElementById('cd-days').textContent    = String(days).padStart(2, '0');
  document.getElementById('cd-hours').textContent   = String(hours).padStart(2, '0');
  document.getElementById('cd-minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('cd-seconds').textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* =============================================
   CARRUSEL DE GALERÍA
   ============================================= */
(function () {
  const carousel  = document.getElementById('galleryCarousel');
  const track     = carousel.querySelector('.carousel__slides');
  const slides    = Array.from(carousel.querySelectorAll('.carousel__slide'));
  const dotsWrap  = document.getElementById('carouselDots');
  const prevBtn   = document.getElementById('carouselPrev');
  const nextBtn   = document.getElementById('carouselNext');
  const GAP_DESK  = 14; // debe coincidir con el gap del CSS desktop
  let current = 0, timer;

  // Crear puntos
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'carousel__dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', `Foto ${i + 1}`);
    d.addEventListener('click', () => { goTo(i); resetAuto(); });
    dotsWrap.appendChild(d);
  });
  const dots = Array.from(dotsWrap.children);

  function isDesktop() { return window.innerWidth > 640; }
  function getVisible() { return isDesktop() ? 3 : 1; }
  function getMax()     { return Math.max(0, slides.length - getVisible()); }

  function updateTrack(animated = true) {
    if (!animated) track.style.transition = 'none';
    const slideW = slides[0].offsetWidth;
    const gap    = isDesktop() ? GAP_DESK : 0;
    track.style.transform = `translateX(-${current * (slideW + gap)}px)`;
    if (!animated) { track.offsetHeight; track.style.transition = ''; } // force reflow
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function goTo(idx) {
    const max = getMax();
    current   = ((idx % (max + 1)) + (max + 1)) % (max + 1);
    updateTrack();
  }

  function resetAuto() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 4500);
  }

  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(current - 1); resetAuto(); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(current + 1); resetAuto(); });

  carousel.addEventListener('mouseenter', () => clearInterval(timer));
  carousel.addEventListener('mouseleave', resetAuto);

  // Swipe
  let tx = 0;
  carousel.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', e => {
    const diff = tx - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { goTo(current + (diff > 0 ? 1 : -1)); resetAuto(); }
  });

  // Click → lightbox
  slides.forEach(slide => {
    slide.addEventListener('click', () => {
      lightboxImg.src = slide.dataset.src;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  // Recalcular en resize
  window.addEventListener('resize', () => {
    current = Math.min(current, getMax());
    updateTrack(false);
  });

  updateTrack(false);
  resetAuto();
}());

/* =============================================
   PARALLAX — SECCIÓN UBICACIÓN
   ============================================= */
(function () {
  const bg      = document.getElementById('ubicacionBg');
  const section = document.getElementById('ubicacion');

  function update() {
    if (window.innerWidth <= 640) return;
    const rect     = section.getBoundingClientRect();
    const progress = rect.top / window.innerHeight; // 1 = arriba del viewport, -1 = abajo
    bg.style.transform = `translateY(${progress * 60}px)`;
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}());

/* =============================================
   PROTECCIÓN DE IMÁGENES
   ============================================= */
document.addEventListener('contextmenu', (e) => {
  if (e.target.closest('.carousel, .lightbox')) {
    e.preventDefault();
  }
});

/* =============================================
   GALERÍA — LIGHTBOX
   ============================================= */
const lightbox     = document.getElementById('lightbox');
const lightboxImg  = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

// El lightbox ahora lo abre el carrusel directamente (ver arriba)

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  lightboxImg.src = '';
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

/* =============================================
   CALENDARIO — PICKER
   ============================================= */
const addToCalBtn = document.getElementById('addToCalBtn');
const calPicker   = document.getElementById('calPicker');

addToCalBtn.addEventListener('click', e => {
  e.stopPropagation();
  calPicker.classList.toggle('open');
});

document.addEventListener('click', () => {
  calPicker.classList.remove('open');
});

// Descargar archivo .ics (Apple Calendar / Outlook)
document.getElementById('downloadIcs').addEventListener('click', () => {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//XV Mailen Carmisciano//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'DTSTART;TZID=America/Argentina/Buenos_Aires:20260703T220000',
    'DTEND;TZID=America/Argentina/Buenos_Aires:20260704T020000',
    'SUMMARY:XV de Mailen Carmisciano',
    'DESCRIPTION:¡Fiesta de 15 años de Mailen Carmisciano! Los espero con mucha emoción.',
    'LOCATION:Álvarez Jonte 3876\\, Villa Devoto\\, Buenos Aires',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'XV-Mailen-Carmisciano.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  calPicker.classList.remove('open');
});

/* =============================================
   FORMULARIO DE RSVP
   Requiere cuenta en https://formspree.io
   Los datos se envían a Google Sheets via Apps Script.
   ============================================= */
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzqMp_ThgD9SJ4KRGZpquphx4zw7OcwpEh-iHs30d9yJRYbCQpT2R-RDH2DoEIkQg/exec';

const rsvpForm    = document.getElementById('rsvpForm');
const rsvpSuccess = document.getElementById('rsvpSuccess');

rsvpForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = rsvpForm.querySelector('[type="submit"]');
  const original  = submitBtn.textContent;
  submitBtn.textContent = 'Enviando…';
  submitBtn.disabled = true;

  const data = {
    nombre:    rsvpForm.querySelector('[name="nombre"]').value.trim(),
    apellido:  rsvpForm.querySelector('[name="apellido"]').value.trim(),
    cantidad:  rsvpForm.querySelector('[name="cantidad"]').value,
    restriccion: rsvpForm.querySelector('[name="restriccion"]').value.trim(),
  };

  try {
    await fetch(SHEETS_URL, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });

    rsvpForm.style.display    = 'none';
    rsvpSuccess.style.display = 'block';
    launchConfetti();
  } catch {
    submitBtn.textContent = original;
    submitBtn.disabled = false;
    alert('Hubo un error al enviar. Por favor intentá nuevamente.');
  }
});

/* =============================================
   SCROLL REVEAL (Intersection Observer)
   ============================================= */
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* =============================================
   NAVEGACIÓN LATERAL — PUNTO ACTIVO
   ============================================= */
const sections = document.querySelectorAll('section[id], footer');
const navDots  = document.querySelectorAll('.nav-dot');

const sectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navDots.forEach(dot => {
          dot.classList.toggle('active', dot.getAttribute('href') === `#${id}`);
        });
      }
    });
  },
  { threshold: 0.4 }
);

sections.forEach(s => sectionObserver.observe(s));

/* =============================================
   MUSIC PLAYER — HTML5 Audio
   Canción: Justin Bieber - Anyone
   ============================================= */
(function () {
  const audio            = document.getElementById('mpAudio');
  const mpBtn            = document.getElementById('mpBtn');
  const mpNotif          = document.getElementById('mpNotif');
  const mpNotifClose     = document.getElementById('mpNotifClose');
  const mpNotifBars      = document.getElementById('mpNotifBars');
  const mpNotifPlay      = document.getElementById('mpNotifPlay');
  const mpNotifIconPlay  = document.getElementById('mpNotifIconPlay');
  const mpNotifIconPause = document.getElementById('mpNotifIconPause');

  audio.volume = 0.6;

  /* ---- Mostrar / ocultar notificación ---- */
  function showNotif() {
    mpNotif.classList.remove('gone', 'out');
    mpBtn.classList.add('active');
  }

  function hideNotif() {
    if (mpNotif.classList.contains('gone')) return;
    mpNotif.classList.add('out');
    mpNotif.addEventListener('animationend', () => {
      mpNotif.classList.add('gone');
    }, { once: true });
    mpBtn.classList.remove('active');
  }

  mpNotifClose.addEventListener('click', hideNotif);

  /* ---- Botón principal: alterna la notificación ---- */
  mpBtn.addEventListener('click', () => {
    mpNotif.classList.contains('gone') ? showNotif() : hideNotif();
  });

  /* ---- Play / Pause ---- */
  mpNotifPlay.addEventListener('click', () => {
    audio.paused ? audio.play() : audio.pause();
  });

  /* ---- Sincronizar barras e íconos ---- */
  function setPlaying(state) {
    mpNotifIconPlay.style.display  = state ? 'none'   : 'inline';
    mpNotifIconPause.style.display = state ? 'inline' : 'none';
    mpNotifBars.classList.toggle('playing', state);
  }

  audio.addEventListener('play',  () => setPlaying(true));
  audio.addEventListener('pause', () => setPlaying(false));

  /* ---- Autoplay por gesto ---- */
  const gestureEvents = ['pointerdown', 'touchstart', 'keydown'];

  function startAudio() {
    audio.play()
      .then(() => gestureEvents.forEach(ev => document.removeEventListener(ev, startAudio)))
      .catch(() => {});
  }

  gestureEvents.forEach(ev =>
    document.addEventListener(ev, startAudio, { passive: true })
  );
}());

/* =============================================
   MODAL REGALOS
   ============================================= */
(function () {
  const modal     = document.getElementById('giftsModal');
  const openBtn   = document.getElementById('giftsBtn');
  const closeBtn  = document.getElementById('giftsClose');
  const copyBtn   = document.getElementById('giftsCopyAlias');
  const aliasEl   = document.getElementById('giftsAlias');

  function openModal()  { modal.classList.add('open');  document.body.style.overflow = 'hidden'; }
  function closeModal() { modal.classList.remove('open'); document.body.style.overflow = ''; }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  // Cerrar al tocar el fondo
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // Copiar alias
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(aliasEl.textContent).then(() => {
      copyBtn.textContent = '¡Copiado!';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = 'Copiar alias';
        copyBtn.classList.remove('copied');
      }, 2000);
    });
  });
}());

/* =============================================
   BOTÓN VOLVER ARRIBA
   ============================================= */
(function () {
  const btn  = document.getElementById('backTop');
  const hero = document.getElementById('hero');

  // Muestra el botón cuando el hero sale del viewport
  new IntersectionObserver(
    ([entry]) => btn.classList.toggle('visible', !entry.isIntersecting),
    { threshold: 0 }
  ).observe(hero);

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}());
