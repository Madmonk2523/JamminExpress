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
  const desktop = matchMedia('(min-width: 761px)');
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
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }));

  // Close mobile menu without stealing Escape when an image viewer is active.
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && !viewer?.classList.contains('is-open') && menu?.getAttribute('aria-expanded') === 'true') {
      closeMenu(); menu.focus();
    }
  });

  // Native fallback if GSAP is blocked, absent or motion reduction is requested.
  function fallbackReveal() {
    if (reduced || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('motion-fallback');
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    }), {rootMargin:'0px 0px -28px 0px', threshold:0.05});
    $$('[data-reveal]').forEach(el => io.observe(el));
  }
  if (reduced || !window.gsap || !window.ScrollTrigger) {
    fallbackReveal(); return;
  }
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  // Short, staggered content entrances; keep all text in the DOM and accessible.
  $$('[data-reveal]').forEach(el => {
    gsap.from(el, {
      autoAlpha:0, y:36, duration:1.0, ease:'power3.out',
      scrollTrigger:{trigger:el,start:'top 91%',once:true}
    });
  });

  // Hero and subpage photography moves subtly at a different rate to the scroll.
  const heroPhoto = $('.hero-picture img');
  if (heroPhoto) gsap.fromTo(heroPhoto,{scale:1.12},{scale:1,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
  $$('.page-hero-visual img, .cinema-picture img, .feature-media img').forEach(img => {
    gsap.fromTo(img,{scale:1.12},{scale:1,ease:'none',scrollTrigger:{trigger:img.parentElement,start:'top bottom',end:'bottom top',scrub:1.2}});
  });

  // Desktop editorial horizontal storytelling, pinned while the user scrolls.
  const showcase = $('.scroll-showcase');
  const viewport = $('.showcase-viewport');
  const track = $('.showcase-track');
  if (showcase && viewport && track) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 761px)', () => {
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      if (distance() < 40) return;
      const move = gsap.to(track, {
        x:() => -distance(), ease:'none',
        scrollTrigger:{
          trigger:showcase,start:'top top',pin:true,
          end:() => '+=' + (distance() + 260),scrub:1.15,
          invalidateOnRefresh:true,anticipatePin:1
        }
      });
      const line = $('.showcase-line i');
      if (line) gsap.fromTo(line,{width:'0%'},{
        width:'100%',ease:'none',scrollTrigger:{
          trigger:showcase,start:'top top',
          end:() => '+=' + (distance() + 260),scrub:true
        }
      });
      return () => {move.kill();gsap.set(track,{clearProps:'transform'});};
    });
  }

  // Stagger photo cards on dedicated pages rather than pinning everything.
  $$('.related-card, .detail-card, .option-card, .gallery-item').forEach((el, i) => {
    gsap.from(el, {
      opacity:0,y:38,duration:.9,delay:(i%3)*.055,ease:'power2.out',
      scrollTrigger:{trigger:el,start:'top 95%',once:true}
    });
  });

  // Service sections have subtle photographic reveal, without hiding content on slow networks.
  $$('.feature-media, .page-hero-visual, .expertise-photo').forEach(frame => {
    gsap.fromTo(frame,{clipPath:'inset(0 0 8% 0)'},{
      clipPath:'inset(0 0 0% 0)',ease:'power2.out',duration:1.25,
      scrollTrigger:{trigger:frame,start:'top 88%',once:true}
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh(), {once:true});
  if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();