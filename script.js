const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function updateHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  nav.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}

menuButton.addEventListener('click', () => {
  const opening = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
  nav.classList.toggle('is-open', opening);
  document.body.classList.toggle('menu-open', opening);
});

nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 680) closeMenu();
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reducedMotion) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const serviceImage = document.querySelector('#service-image');
document.querySelectorAll('.service-item').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.service-item').forEach((button) => {
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed', 'false');
    });
    item.classList.add('is-active');
    item.setAttribute('aria-pressed', 'true');
    serviceImage.style.opacity = '0';
    window.setTimeout(() => {
      serviceImage.onload = () => { serviceImage.style.opacity = '1'; };
      serviceImage.onerror = () => { serviceImage.style.opacity = '1'; };
      serviceImage.src = item.dataset.image;
      serviceImage.alt = item.dataset.alt;
    }, 140);
  });
});

const year = document.querySelector('#year');
year.textContent = new Date().getFullYear();

document.querySelector('#inquiry-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const message = document.querySelector('#form-message');
  message.textContent = 'Thanks for sharing the details. This form still needs a booking-system connection before it can send.';
  message.classList.add('is-submitted');
});
