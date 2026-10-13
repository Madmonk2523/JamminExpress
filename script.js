// Jammin' Express — focused interactions, no animation dependencies.
const $ = (selector, scope=document) => scope.querySelector(selector);
const $$ = (selector, scope=document) => [...scope.querySelectorAll(selector)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Compact header
const header = $('.header');
let scrollFrame = null;
function updateHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 16);
  scrollFrame = null;
}
updateHeader();
window.addEventListener('scroll', () => {
  if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(updateHeader);
}, {passive:true});

// Accessible mobile menu
const toggle = $('.menu-toggle');
const nav = $('#primary-nav');
function closeMenu() {
  nav.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open menu');
  document.body.classList.remove('menu-open');
}
toggle.addEventListener('click', () => {
  const next = toggle.getAttribute('aria-expanded') !== 'true';
  nav.classList.toggle('is-open', next);
  toggle.setAttribute('aria-expanded', String(next));
  toggle.setAttribute('aria-label', next ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('menu-open', next);
});
$$('#primary-nav a').forEach(link => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => {
  if (window.innerWidth > 960) closeMenu();
});

// A single gentle scroll reveal; the page remains readable without it.
if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    }
  }, {threshold:0.05, rootMargin:'0px 0px -16px 0px'});
  $$('.reveal').forEach(item => observer.observe(item));
  document.documentElement.classList.add('motion-ready');
}

const occasion = $('#occasion');
$$('[data-occasion]').forEach(link => link.addEventListener('click', () => {
  const choice = [...occasion.options].find(option => option.value === link.dataset.occasion);
  if (choice) occasion.value = choice.value;
}));

// Simple accessible photo gallery
const gallery = $$('.gallery-shot img').map(img => ({src:img.getAttribute('src'),alt:img.alt}));
const lightbox = $('#lightbox');
const lightboxImage = $('#lightbox-image');
const lightboxCounter = $('#lightbox-count');
const lightboxClose = $('#lightbox-close');
const lightboxPrev = $('#lightbox-prev');
const lightboxNext = $('#lightbox-next');
let galleryIndex = 0;
let lastFocus = null;
function renderGallery() {
  const photo = gallery[galleryIndex];
  lightboxImage.src = photo.src;
  lightboxImage.alt = photo.alt;
  lightboxCounter.textContent = String(galleryIndex+1).padStart(2,'0')+' / '+String(gallery.length).padStart(2,'0');
}
function openGallery(index) {
  galleryIndex=index;
  lastFocus=document.activeElement;
  renderGallery();
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden','false');
  document.body.classList.add('lightbox-open');
  lightboxClose.focus();
}
function closeGallery() {
  if (!lightbox.classList.contains('is-open')) return;
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden','true');
  document.body.classList.remove('lightbox-open');
  if (lastFocus && lastFocus.isConnected) lastFocus.focus();
}
function changeGallery(step) {
  galleryIndex=(galleryIndex+step+gallery.length)%gallery.length;
  renderGallery();
}
$$('.gallery-shot').forEach((button,index) => button.addEventListener('click', () => openGallery(index)));
lightboxClose.addEventListener('click',closeGallery);
lightboxPrev.addEventListener('click',()=>changeGallery(-1));
lightboxNext.addEventListener('click',()=>changeGallery(1));
lightbox.addEventListener('click',event=>{if(event.target===lightbox)closeGallery();});
document.addEventListener('keydown',event=>{
  if (event.key==='Escape') {
    if (lightbox.classList.contains('is-open')) closeGallery();
    else if (nav.classList.contains('is-open')) {closeMenu();toggle.focus();}
    return;
  }
  if (!lightbox.classList.contains('is-open')) return;
  if (event.key==='ArrowLeft') {changeGallery(-1);event.preventDefault();}
  if (event.key==='ArrowRight') {changeGallery(1);event.preventDefault();}
  if (event.key==='Tab') {
    const buttons=[lightboxClose,lightboxPrev,lightboxNext];
    const index=buttons.indexOf(document.activeElement);
    if (event.shiftKey && index<=0) {buttons[buttons.length-1].focus();event.preventDefault();}
    else if (!event.shiftKey && index===buttons.length-1) {buttons[0].focus();event.preventDefault();}
    else if (index===-1) {lightboxClose.focus();event.preventDefault();}
  }
});

// Keep the existing no-backend inquiry behavior until the client selects an inbox integration.
const form = $('#contact-form');
const dateInput = $('#date');
function todayLocal() {
  const now=new Date();
  return [
    now.getFullYear(),
    String(now.getMonth()+1).padStart(2,'0'),
    String(now.getDate()).padStart(2,'0')
  ].join('-');
}
function setMinDate() {dateInput.min=todayLocal();}
setMinDate();
dateInput.addEventListener('focus',setMinDate);
form.addEventListener('submit',event=>{
  event.preventDefault();
  setMinDate();
  if (!form.reportValidity()) return;
  const data=new FormData(form);
  const value=name=>String(data.get(name)||'').trim();
  const lines=[
    'Hello Jammin Express,','',
    "I'm interested in entertainment for my event.",'',
    'Name: '+value('name'),
    'Email: '+value('email'),
    'Phone: '+(value('phone')||'Not provided'),
    'Occasion: '+value('occasion'),
    'Event date: '+(value('date')||'Not decided'),
    'Details: '+(value('message')||'I would love to talk through some ideas.'),'',
    'Thank you!'
  ];
  const subject='Event inquiry: '+value('occasion')+' — '+value('name');
  const url='mailto:jason@jamminexpress.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(lines.join('\n'));
  $('#form-status').textContent='Your email app should open with your details. Review the message and press Send to submit it. Nothing has been sent automatically.';
  window.location.href=url;
});

$('#year').textContent=String(new Date().getFullYear());
