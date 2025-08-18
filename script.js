// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

/* THEME: auto + toggle + persistence */
const root = document.documentElement;
const toggleBtn = document.getElementById('themeToggle');

function setTheme(theme){
  root.setAttribute('data-theme', theme);
  // Update icon
  toggleBtn.innerHTML = theme === 'dark'
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.64 13a9 9 0 01-10.63-10.6A1 1 0 009 1a11 11 0 1014 14 1 1 0 00-1.36-2z"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm9-10v-2h-3v2h3zm-3.76 6.16l1.79 1.79 1.79-1.79-1.79-1.79-1.79 1.79zM12 5a7 7 0 100 14 7 7 0 000-14zm0-5h-2v3h2V0zm7.07 5.93l1.79-1.79-1.79-1.79-1.79 1.79 1.79 1.79z"/></svg>`;
  localStorage.setItem('theme', theme);
}

// Init theme: localStorage -> system preference -> default light
const saved = localStorage.getItem('theme');
if (saved) {
  setTheme(saved);
} else {
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(prefersDark ? 'dark' : 'light');
}

toggleBtn.addEventListener('click', ()=>{
  const current = root.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

// Contact form validation + AJAX (Formspree)
const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

const fields = {
  name: {
    el: document.getElementById('name'),
    err: document.getElementById('nameError'),
    test: v => v.trim().length >= 2
  },
  email: {
    el: document.getElementById('email'),
    err: document.getElementById('emailError'),
    test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  },
  message: {
    el: document.getElementById('message'),
    err: document.getElementById('messageError'),
    test: v => v.trim().length >= 10
  }
};

function showError(key, show){
  fields[key].err.style.display = show ? 'block' : 'none';
  fields[key].el.setAttribute('aria-invalid', show ? 'true' : 'false');
}

Object.keys(fields).forEach(key=>{
  fields[key].el.addEventListener('input', ()=>{
    showError(key, !fields[key].test(fields[key].el.value));
  });
  fields[key].el.addEventListener('blur', ()=>{
    showError(key, !fields[key].test(fields[key].el.value));
  });
});

form.addEventListener('submit', async (e)=>{
  e.preventDefault();

  // Validate
  let ok = true;
  for (const key of Object.keys(fields)){
    const valid = fields[key].test(fields[key].el.value);
    showError(key, !valid);
    if(!valid) ok = false;
  }
  if(!ok) return;

  // Submit via fetch to avoid redirect
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';
  statusEl.style.display = 'none';
  statusEl.className = 'form-status';

  try{
    const formData = new FormData(form);
    const resp = await fetch(form.action, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: formData
    });

    if (resp.ok){
      form.reset();
      Object.keys(fields).forEach(k=>showError(k,false));
      statusEl.textContent = 'Thank you! Your message has been sent.';
      statusEl.classList.add('ok');
      statusEl.style.display = 'block';
    } else {
      const data = await resp.json().catch(()=>({}));
      const msg = data && data.errors ? data.errors.map(e=>e.message).join(', ') : 'Something went wrong. Please try again.';
      statusEl.textContent = msg;
      statusEl.classList.add('bad');
      statusEl.style.display = 'block';
    }
  } catch(err){
    statusEl.textContent = 'Network error. Please check your connection and try again.';
    statusEl.classList.add('bad');
    statusEl.style.display = 'block';
  } finally{
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send message';
  }
});

/* Staggered reveal on scroll */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('show');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ===== HERO BACKGROUND FX — minimal, robust particles ===== */
(function(){
  const canvas = document.getElementById('heroFx');
  if (!canvas) { console.warn('[FX] #heroFx not found'); return; }

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) { console.warn('[FX] 2D context unavailable'); return; }

  let w = 0, h = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let pts = [], raf = 0;

  function sizeCanvas(){
    const rect = canvas.getBoundingClientRect();
    const newW = Math.max(320, Math.floor(rect.width));
    const newH = Math.max(260, Math.floor(rect.height));
    if (newW === w && newH === h) return;

    w = newW; h = newH;
    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);

    // Rebuild particles scaled to size
    const count = Math.min(160, Math.floor((w*h)/16000));
    pts = new Array(count).fill(0).map(()=>({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-0.5)*0.35, vy: (Math.random()-0.5)*0.35,
      r: Math.random()*1.6+0.6
    }));
  }

  // Palette based on theme
  function getTheme(){
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return dark
      ? { ink:'rgba(120,155,255,0.35)', glow:'rgba(202,164,90,0.55)' }
      : { ink:'rgba(60,90,180,0.22)',  glow:'rgba(202,164,90,0.55)' };
  }
  let PAL = getTheme();
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', ()=>{ PAL = getTheme(); });

  // Resize handling (observer + window fallback)
  try {
    new ResizeObserver(sizeCanvas).observe(canvas);
  } catch(_) {
    window.addEventListener('resize', sizeCanvas);
    setInterval(sizeCanvas, 500); // safety net
  }
  // Initial sizing after DOM paints
  requestAnimationFrame(sizeCanvas);

  function render(){
    ctx.clearRect(0,0,w,h);

    // soft backdrop wash
    const bg = ctx.createRadialGradient(w*0.35,h*0.3,10, w*0.5,h*0.6, Math.max(w,h)*0.9);
    bg.addColorStop(0, 'rgba(0,0,0,0)');
    bg.addColorStop(1, PAL.ink);
    ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);

    // update + draw points
    ctx.fillStyle = PAL.glow;
    for (const p of pts){
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = w+10; if (p.x > w+10) p.x = -10;
      if (p.y < -10) p.y = h+10; if (p.y > h+10) p.y = -10;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    }

    // link lines
    ctx.lineWidth = 1;
    for (let i=0;i<pts.length;i++){
      for (let j=i+1;j<pts.length;j++){
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d2 = dx*dx + dy*dy;
        if (d2 < 120*120){
          const a = 1 - (Math.sqrt(d2)/120);
          ctx.strokeStyle = `rgba(180,190,220,${a*0.25})`;
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        }
      }
    }

    raf = requestAnimationFrame(render);
  }

  // Start loop
  raf = requestAnimationFrame(render);

  // Visibility pause/resume (saves battery)
  document.addEventListener('visibilitychange', ()=>{
    if (document.hidden){ cancelAnimationFrame(raf); raf = 0; }
    else if (!raf){ raf = requestAnimationFrame(render); }
  });

  // Debug log if nothing visible after 1s
  setTimeout(()=>{
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0){
      console.warn('[FX] Canvas has zero size. Check that #heroFx is inside a visible .hero with content/padding.');
    }
  }, 1000);
})();

/* ===== Modals: Terms & Privacy (accessible) ===== */
(function(){
  let lastFocus = null;

  function getFocusable(root){
    return root.querySelectorAll(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), ' +
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  }

  function openModal(id){
    const overlay = document.querySelector(`.modal-overlay[data-modal="${id}"]`);
    if(!overlay) return;
    lastFocus = document.activeElement;

    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');

    const focusables = getFocusable(overlay);
    (focusables[0] || overlay).focus();

    // Close on click outside
    overlay.addEventListener('mousedown', (e)=>{
      if(e.target === overlay) closeModal(overlay);
    });

    // Trap focus + ESC to close
    overlay.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape'){ e.preventDefault(); closeModal(overlay); }
      if(e.key === 'Tab' && focusables.length){
        const first = focusables[0], last = focusables[focusables.length-1];
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    });

    // Close buttons
    overlay.querySelectorAll('[data-modal-close]').forEach(btn=>{
      btn.addEventListener('click', ()=> closeModal(overlay), { once:true });
    });
  }

  function closeModal(overlay){
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('no-scroll');
    if(lastFocus) lastFocus.focus();
  }

  // Wire up open buttons
  document.querySelectorAll('[data-modal-open]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-modal-open');
      openModal(id);
    });
  });
})();

/* ===== Mobile menu open/close ===== */
(function(){
  const btn = document.getElementById('mobileToggle');
  const menu = document.getElementById('mobileMenu');
  const header = document.querySelector('header.nav');
  if (!btn || !menu || !header) return;

  // Set CSS var for accurate drawer top (header height may vary)
  function setHeaderH(){
    const h = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--header-h', Math.round(h) + 'px');
  }
  setHeaderH();
  window.addEventListener('resize', setHeaderH);

  function open(){
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll'); // you already have .no-scroll from modals
  }
  function close(){
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  }
  function toggle(){ (menu.hidden ? open : close)(); }

  btn.addEventListener('click', toggle);

  // Close when clicking a link
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  // Close on Escape
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && !menu.hidden) close();
  });

  // Optional: close when user scrolls
  window.addEventListener('scroll', ()=>{
    if (!menu.hidden) close();
  }, { passive: true });
})();

// Auto-close if we cross back to desktop width
const mq = window.matchMedia('(min-width: 901px)');
mq.addEventListener('change', e => { if (e.matches) close(); });
