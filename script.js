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
let imageRequest = 0;
document.querySelectorAll('.service-item').forEach((item) => {
  item.addEventListener('click', () => {
    if (item.classList.contains('is-active')) return;
    document.querySelectorAll('.service-item').forEach((button) => {
      const active = button === item;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    const request = ++imageRequest;
    const nextImage = new Image();
    nextImage.onload = () => {
      if (request !== imageRequest) return;
      serviceImage.style.opacity = '0';
      const commitImage = () => {
        if (request !== imageRequest) return;
        serviceImage.src = nextImage.src;
        serviceImage.alt = item.dataset.alt;
        serviceImage.style.opacity = '1';
      };
      if (reducedMotion) commitImage();
      else window.setTimeout(commitImage, 140);
    };
    nextImage.onerror = () => {
      if (request === imageRequest) serviceImage.style.opacity = '1';
    };
    nextImage.src = item.dataset.image;
  });
});

const year = document.querySelector('#year');
year.textContent = new Date().getFullYear();

const inquiryForm = document.querySelector('#inquiry-form');
const eventDate = document.querySelector('#date');
const formMessage = document.querySelector('#form-message');

// Keep the date constraint current without accidentally excluding today.
function updateMinimumDate() {
  const now = new Date();
  const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);
  eventDate.min = localToday;
}
updateMinimumDate();
eventDate.addEventListener('focus', updateMinimumDate);

inquiryForm.addEventListener('input', () => {
  formMessage.classList.remove('is-submitted');
  formMessage.textContent = 'This is a preview form. Inquiries are not being sent yet.';
});

inquiryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  updateMinimumDate();
  if (!inquiryForm.reportValidity()) return;
  formMessage.textContent = 'This form is not connected yet, so your details have NOT been sent. Please contact Jammin Express directly to inquire.';
  formMessage.classList.add('is-submitted');
});
