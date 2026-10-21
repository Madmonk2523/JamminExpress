/* Jammin' Express / motion & interaction framework */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menu = $('#menu-toggle');
  const nav = $('#main-nav');
  const header = $('.site-header');
  const progress = $('.scroll-meter > span');
    let framePending = false;

  // Shared navigation and active-page state.
  function closeMenu() {
    if (!menu || !nav) return;
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation');
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  }
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const opening = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(opening));
      menu.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
      nav.classList.toggle('is-open', opening);
      document.body.classList.toggle('menu-open', opening);
    });
    $$('a', nav).forEach(a => a.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => { if (innerWidth > 980) closeMenu(); });
  }
  const fileName = location.pathname.split('/').pop() || 'index.html';
  $$('.nav-links a').forEach(a => {
    const target = (a.getAttribute('href') || '').split('#')[0];
    if (target && target === fileName) a.setAttribute('aria-current', 'page');
  });

  // Avoid a full scroll event worth of DOM writes on every scroll.
  function updateScroll() {
    header?.classList.toggle('scrolled', scrollY > 20);
    if (progress) {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      progress.style.transform = 'scaleX(' + Math.max(0, Math.min(1, scrollY / max)) + ')';
    }
    framePending = false;
  }
  updateScroll();
  window.addEventListener('scroll', () => {
    if (!framePending) { framePending = true; requestAnimationFrame(updateScroll); }
  }, {passive:true});
  window.addEventListener('resize', updateScroll, {passive:true});
  $$('.current-year').forEach(el => el.textContent = new Date().getFullYear());

  // Contact remains an email-compose interaction until the backend is commissioned.
  const form = $('#contact-form');
  const eventDate = $('#event-date');
  function today() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }
  if (eventDate) {
    eventDate.min = today();
    eventDate.addEventListener('focus', () => eventDate.min = today());
  }
  if (form) {
    const qp = new URLSearchParams(location.search);
    const occasion = $('#event-type');
    const wanted = qp.get('occasion');
    if (wanted && occasion) {
      const found = [...occasion.options].find(option => option.value.toLowerCase() === wanted.toLowerCase());
      if (found) occasion.value = found.value;
    }
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      const val = n => String(fd.get(n) || '').trim();
      const message = [
        'Hello Jammin Express,', '',
        'I would like information about entertainment for my event.', '',
        'Name: ' + val('name'),
        'Email: ' + val('email'),
        'Phone: ' + (val('phone') || 'Not provided'),
        'Type of event: ' + val('occasion'),
        'Event date: ' + (val('date') || 'Not yet selected'),
        'Location: ' + (val('location') || 'Not yet decided'),
        'Additional details: ' + (val('message') || 'Please contact me to discuss.'), '',
        'Thank you.'
      ].join('\n');
      const subject = 'Event inquiry — ' + val('occasion') + ' — ' + val('name');
      const status = $('#form-status');
      if (status) status.textContent = 'Your email application should open now. Review your message and press Send. This page has not sent your inquiry automatically.';
      location.href = 'mailto:jason@jamminexpress.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message);
    });
  }

  // Image viewer shared by the full gallery page.
  const gallery = $$('.gallery-item').filter(el => el.querySelector('img'));
  const viewer = $('#lightbox');
  if (viewer && gallery.length) {
    const image = $('#lightbox-image'), count = $('#lightbox-count');
    let index = 0, focusFrom = null;
    const activeGallery = () => gallery.filter(el => !el.hidden);
    function show() {
      const visible = activeGallery();
      if (!visible.length) return;
      index = (index + visible.length) % visible.length;
      const img = $('img', visible[index]);
      image.src = img.getAttribute('src');
      image.alt = img.alt;
      count.textContent = String(index+1).padStart(2, '0') + ' / ' + String(visible.length).padStart(2, '0');
    }
    function close() {
      if (!viewer.classList.contains('is-open')) return;
      viewer.classList.remove('is-open');
      viewer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('viewer-open');
      image.removeAttribute('src');
      focusFrom?.focus();
    }
    gallery.forEach(el => el.addEventListener('click', () => {
      focusFrom = document.activeElement;
      index = activeGallery().indexOf(el);
      show();
      viewer.classList.add('is-open');
      viewer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('viewer-open');
      $('#lightbox-close')?.focus();
    }));
    $('#lightbox-close')?.addEventListener('click', close);
    $('#lightbox-prev')?.addEventListener('click', () => { index--; show(); });
    $('#lightbox-next')?.addEventListener('click', () => { index++; show(); });
    viewer.addEventListener('click', e => { if (e.target === viewer) close(); });
    document.addEventListener('keydown', ev => {
      if (!viewer.classList.contains('is-open')) return;
      if (ev.key === 'Escape') { close(); ev.preventDefault(); }
      if (ev.key === 'ArrowLeft') { index--; show(); ev.preventDefault(); }
      if (ev.key === 'ArrowRight') { index++; show(); ev.preventDefault(); }
      if (ev.key === 'Tab') {
        const buttons = ['#lightbox-close', '#lightbox-prev', '#lightbox-next'].map($);
        const current = buttons.indexOf(document.activeElement);
        if (current === -1) { buttons[0].focus(); ev.preventDefault(); }
        else if (ev.shiftKey && current === 0) { buttons.at(-1).focus(); ev.preventDefault(); }
        else if (!ev.shiftKey && current === buttons.length-1) { buttons[0].focus(); ev.preventDefault(); }
      }
    });
  }
  // Event slider: native horizontal scrolling that never pins or clips the page.
  // Pointer swipes, trackpads, keyboard arrows and explicit buttons all work.
  const eventViewport = $('#event-carousel');
  const eventCards = eventViewport ? $('.showcase-card', eventViewport) : [];
  if (eventViewport && eventCards.length) {
    const previous = $('#showcase-prev');
    const next = $('#showcase-next');
    const counter = $('#showcase-counter');
    const fill = $('.showcase-line i');
    let updatePending = false;
    function currentEvent() {
      const position = eventViewport.scrollLeft;
      let closest = 0, distance = Infinity;
      eventCards.forEach((card,i) => {
        const delta = Math.abs(card.offsetLeft - eventCards[0].offsetLeft - position);
        if(delta < distance) {distance=delta;closest=i;}
      });
      return closest;
    }
    function updateSlider() {
      const current = currentEvent();
      if(counter) counter.textContent = String(current+1).padStart(2,'0') + ' / ' + String(eventCards.length).padStart(2,'0');
      if(previous) previous.disabled = current === 0;
      if(next) next.disabled = current === eventCards.length-1;
      const max = Math.max(1, eventViewport.scrollWidth - eventViewport.clientWidth);
      const completion = Math.min(1, Math.max(0, (eventViewport.scrollLeft + eventViewport.clientWidth*0.25) / max));
      if(fill) fill.style.transform = 'scaleX(' + Math.min(1,Math.max(.18,completion)) + ')';
      updatePending = false;
    }
    function moveSlider(delta) {
      const nextIndex = Math.max(0,Math.min(eventCards.length-1,currentEvent()+delta));
      const target = Math.max(0,eventCards[nextIndex].offsetLeft-eventCards[0].offsetLeft);
      eventViewport.scrollTo({left:target,behavior:reduced?'auto':'smooth'});
    }
    previous?.addEventListener('click', () => moveSlider(-1));
    next?.addEventListener('click', () => moveSlider(1));
    eventViewport.addEventListener('keydown',ev=>{
      if(ev.target !== eventViewport) return;
      if(ev.key === 'ArrowRight'){ev.preventDefault();moveSlider(1);}
      if(ev.key === 'ArrowLeft'){ev.preventDefault();moveSlider(-1);}
    });
    eventViewport.addEventListener('scroll',()=>{
      if(!updatePending){updatePending=true;requestAnimationFrame(updateSlider);}
    },{passive:true});
    window.addEventListener('resize',updateSlider,{passive:true});
    updateSlider();
  }

  // Gallery filters: categories correspond to actual existing photos.
  const filters = $$('.gallery-filter');
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(el => {
      const active = el === button;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-pressed', String(active));
    });
    const category = button.dataset.filter;
    gallery.forEach(el => {
      el.hidden = category !== 'all' && el.dataset.category !== category;
    });
    // Grid filters do not need a pinned-scroll refresh.
  }));

  // Close mobile menu without stealing Escape when an image viewer is active.
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && !viewer?.classList.contains('is-open') && menu?.getAttribute('aria-expanded') === 'true') {
      closeMenu(); menu.focus();
    }
  });

  // Progressive-enhancement motion: content is ALWAYS visible, even if the
  // animation library fails, a user scrolls quickly, or the page is restored.
  // Enter animations never set visibility:hidden or opacity:0 on page content.
  if (reduced) return;

  const fadeElements = $$('[data-reveal], .detail-card, .option-card, .related-card, .gallery-item');
  if ('IntersectionObserver' in window) {
    const seen = new WeakSet();
    const entryObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        entryObserver.unobserve(entry.target);
        // Translate & a tiny blur instead of hiding elements in blank sections.
        if (entry.target.animate) entry.target.animate([
          { transform:'translate3d(0, 18px, 0)', filter:'blur(1.5px)' },
          { transform:'translate3d(0, 0, 0)', filter:'blur(0)' }
        ], {duration:650,easing:'cubic-bezier(.2,.65,.2,1)',fill:'none'});
      });
    }, {rootMargin:'0px 0px -24px 0px',threshold:.07});
    fadeElements.forEach(el => entryObserver.observe(el));
  }

  // Opening motion remains lightweight; never hides the hero on slow networks.
  const heroHeading = $('.hero h1, .page-hero h1');
  if (heroHeading?.animate) {
    heroHeading.animate(
      [{transform:'translate3d(0, 16px, 0)'},{transform:'translate3d(0,0,0)'}],
      {duration:850,easing:'cubic-bezier(.18,.7,.2,1)'}
    );
  }

  // Only photography gets scroll-tied movement. Text, cards, galleries and
  // section containers keep their natural layout positions and visibility.
  if (!window.gsap || !window.ScrollTrigger) return;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  const motion = gsap.matchMedia();
  motion.add('(min-width: 980px) and (min-height: 690px)', () => {
    const tweens = [];
    const addPhotoMotion = (selector, startScale=1.04, endScale=1.09) => {
      $$(selector).forEach(img => {
        const frame = img.parentElement;
        if (!frame) return;
        // Transform only the image so its frame never shifts or opens gaps.
        const tween = gsap.fromTo(img, {scale:startScale}, {
          scale:endScale, ease:'none',
          scrollTrigger:{trigger:frame,start:'top bottom',end:'bottom top',scrub:1.15}
        });
        tweens.push(tween);
      });
    };
    addPhotoMotion('.hero-picture img',1.05,1.11);
    addPhotoMotion('.page-hero-visual img',1.03,1.08);
    addPhotoMotion('.cinema-picture img',1.04,1.10);
    addPhotoMotion('.feature-media img',1.02,1.075);
    addPhotoMotion('.editorial-photo img',1.02,1.08);
    addPhotoMotion('.event-photo-band img',1.02,1.075);
    return () => {
      tweens.forEach(tween => tween.kill());
      ScrollTrigger.refresh();
    };
  });

  // Refresh only after image dimensions are stable; geometry doesn't depend
  // on successful external font or motion library downloads.
  window.addEventListener('load', () => ScrollTrigger.refresh(), {once:true});
  if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();