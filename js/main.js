// Praxis Consulting — interactions

// Scroll-triggered reveals
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal, .trendline-panel').forEach((el) => observer.observe(el));

// Count-up stats
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countObserver.unobserve(entry.target);
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      if (reduceMotion) { el.textContent = target; return; }
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  },
  { threshold: 0.6 }
);

document.querySelectorAll('.count').forEach((el) => countObserver.observe(el));

// Header state + scroll progress
const header = document.querySelector('.site-header');
const progressBar = document.querySelector('.progress-bar');

const onScroll = () => {
  header.classList.toggle('is-scrolled', window.scrollY > 40);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
};

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Hero landmark cycle — in production, the first slide would be chosen by visitor region
const slides = [...document.querySelectorAll('.hero-media-frame img')];
const placeEl = document.querySelector('.media-place');

if (slides.length > 1 && !reduceMotion) {
  let current = 0;
  setInterval(() => {
    const next = (current + 1) % slides.length;
    slides[current].classList.remove('is-active');
    slides[next].classList.add('is-active');
    placeEl.innerHTML = slides[next].dataset.caption;
    current = next;
  }, 6000);
}

// Mobile nav
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('.nav-menu');

toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
});

menu.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  })
);
