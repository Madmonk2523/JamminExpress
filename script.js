const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const header = $('.header');
const updateHeader = () => header.classList.toggle('is-scrolled', scrollY > 30);
updateHeader();
addEventListener('scroll', updateHeader, {passive:true});

const menuBtn = $('.menu-btn');
const navLinks = $('#nav-links');
function closeMenu(){
  navLinks.classList.remove('is-open');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-label', 'Open menu');
  document.body.classList.remove('menu-open');
}
menuBtn.addEventListener('click', () => {
  const isOpen = !navLinks.classList.contains('is-open');
  navLinks.classList.toggle('is-open',isOpen);
  menuBtn.setAttribute('aria-expanded', String(isOpen));
  menuBtn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('menu-open',isOpen);
});
$$('#nav-links a').forEach(a=>a.addEventListener('click',closeMenu));
addEventListener('resize',()=>{if(innerWidth>860)closeMenu();});

if(!reducedMotion && 'IntersectionObserver' in window){
  const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
  }),{threshold:.06,rootMargin:'0px 0px -25px 0px'});
  $$('.reveal').forEach(el=>observer.observe(el));
} else $$('.reveal').forEach(el=>el.classList.add('is-visible'));

const cursor = $('.cursor-glow');
if(!reducedMotion && matchMedia('(pointer:fine)').matches){
  let x=-500,y=-500,px=-500,py=-500;
  addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;cursor.style.opacity='1';},{passive:true});
  function track(){px+=(x-px)*.13;py+=(y-py)*.13;cursor.style.transform='translate3d('+(px-280)+'px,'+(py-280)+'px,0)';requestAnimationFrame(track);}
  track();
}

if(!reducedMotion && matchMedia('(hover:hover) and (pointer:fine)').matches){
  $$('.tilt-card').forEach(card=>{
    card.addEventListener('pointermove',e=>{
      const r=card.getBoundingClientRect(), px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
      card.style.setProperty('--rx',((.5-py)*4)+'deg');
      card.style.setProperty('--ry',((px-.5)*4)+'deg');
      card.style.setProperty('--mx',(px*100)+'%');
      card.style.setProperty('--my',(py*100)+'%');
    });
    card.addEventListener('pointerleave',()=>{card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg');});
  });
  $$('.magnetic').forEach(btn=>{
    btn.addEventListener('pointermove',e=>{
      const r=btn.getBoundingClientRect();
      btn.style.setProperty('--tx',((e.clientX-(r.left+r.width/2))*.09)+'px');
      btn.style.setProperty('--ty',((e.clientY-(r.top+r.height/2))*.14)+'px');
    });
    btn.addEventListener('pointerleave',()=>{btn.style.setProperty('--tx','0px');btn.style.setProperty('--ty','0px');});
  });
}

const serviceImage = $('#service-image'), serviceNumber=$('#service-number'), serviceTitle=$('#service-detail-title'), serviceText=$('#service-detail-text');
let imageSequence=0;
$$('.service-tab').forEach((button,index)=>{
  button.addEventListener('click',()=>{
    if(button.classList.contains('is-active'))return;
    $$('.service-tab').forEach(b=>{b.classList.toggle('is-active',b===button);b.setAttribute('aria-pressed',String(b===button));});
    serviceTitle.textContent=button.dataset.title;
    serviceText.textContent=button.dataset.text;
    serviceNumber.textContent=String(index+1).padStart(2,'0')+' / 04';
    const sequence=++imageSequence;
    const img=new Image();
    img.onload=()=>{
      if(sequence!==imageSequence)return;
      serviceImage.style.opacity='0';
      setTimeout(()=>{
        if(sequence!==imageSequence)return;
        serviceImage.src=img.src;
        serviceImage.alt=button.dataset.alt;
        serviceImage.style.opacity='1';
      },reducedMotion?0:130);
    };
    img.src=button.dataset.image;
  });
});

const reviews=[
  {quote:'The dance floor was never empty.',name:'JANET GUTARRA',type:'WEDDING • OCTOBER 2021'},
  {quote:'A+ entertainment! Jason and Zack were an amazing team for our daughters B’Not Mitzvah celebration.',name:'SHAKARA ROSENBAUM',type:'BAT MITZVAH • SEPTEMBER 2021'},
  {quote:'Hiring you was one of the best decisions we made.',name:'CINDY & DAVID SELTZER',type:'BAT MITZVAH • SEPTEMBER 2019'}
];
let reviewIndex=0;
function renderReview(){
 const r=reviews[reviewIndex];
 $('#review-quote').textContent=r.quote;
 $('#review-name').textContent=r.name;
 $('#review-type').textContent=r.type;
 $('#review-count').textContent=String(reviewIndex+1).padStart(2,'0')+' / 03';
 $('#review-progress').style.width=((reviewIndex+1)/reviews.length*100)+'%';
}
$('#review-prev').addEventListener('click',()=>{reviewIndex=(reviewIndex+reviews.length-1)%reviews.length;renderReview();});
$('#review-next').addEventListener('click',()=>{reviewIndex=(reviewIndex+1)%reviews.length;renderReview();});
renderReview();

const gallery=$$('.gallery-shot img').map(img=>({src:img.getAttribute('src'),alt:img.alt}));
let galleryIndex=0, returnFocus=null;
const lightbox=$('#lightbox');
function renderGallery(){
 const item=gallery[galleryIndex];
 $('#lightbox-image').src=item.src;$('#lightbox-image').alt=item.alt;
 $('#lightbox-count').textContent=String(galleryIndex+1).padStart(2,'0')+' / '+String(gallery.length).padStart(2,'0');
}
function openGallery(index){
 galleryIndex=index;returnFocus=document.activeElement;renderGallery();
 lightbox.classList.add('is-open');lightbox.setAttribute('aria-hidden','false');
 document.body.classList.add('lightbox-open');$('#lightbox-close').focus();
}
function closeGallery(){
 lightbox.classList.remove('is-open');lightbox.setAttribute('aria-hidden','true');
 document.body.classList.remove('lightbox-open');if(returnFocus)returnFocus.focus();
}
$$('.gallery-shot').forEach((btn,i)=>btn.addEventListener('click',()=>openGallery(i)));
$('#lightbox-close').addEventListener('click',closeGallery);
$('#lightbox-prev').addEventListener('click',()=>{galleryIndex=(galleryIndex+gallery.length-1)%gallery.length;renderGallery();});
$('#lightbox-next').addEventListener('click',()=>{galleryIndex=(galleryIndex+1)%gallery.length;renderGallery();});
lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeGallery();});
addEventListener('keydown',e=>{
 if(e.key==='Escape'){if(lightbox.classList.contains('is-open'))closeGallery();else closeMenu();}
 if(!lightbox.classList.contains('is-open'))return;
 if(e.key==='ArrowRight'){$('#lightbox-next').click();e.preventDefault();}
 if(e.key==='ArrowLeft'){$('#lightbox-prev').click();e.preventDefault();}
 if(e.key==='Tab'){
  const focusables=[$('#lightbox-close'),$('#lightbox-prev'),$('#lightbox-next')],i=focusables.indexOf(document.activeElement);
  if(e.shiftKey && i<=0){focusables.at(-1).focus();e.preventDefault();}
  else if(!e.shiftKey && i===focusables.length-1){focusables[0].focus();e.preventDefault();}
 }
});

const occasion=$('#occasion');
$$('[data-occasion]').forEach(link=>link.addEventListener('click',()=>{
 const name=link.dataset.occasion;
 const match=[...occasion.options].find(opt=>opt.textContent===name);
 if(match)occasion.value=match.value;
}));
const dateInput=$('#date');
function setMinimumDate(){
 const now=new Date();
 dateInput.min=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
}
setMinimumDate();
dateInput.addEventListener('focus',setMinimumDate);

$('#contact-form').addEventListener('submit',e=>{
 e.preventDefault();
 const form=e.currentTarget;
 setMinimumDate();
 if(!form.reportValidity())return;
 const data=new FormData(form);
 const val=k=>String(data.get(k)||'').trim();
 const body=[
   'Hello Jammin Express,','',
   "I'd like to learn more about entertainment for my event.",'',
   'Name: '+val('name'),
   'Email: '+val('email'),
   'Phone: '+(val('phone')||'Not provided'),
   'Occasion: '+val('occasion'),
   'Event date: '+(val('date')||'Not decided'),
   'My vision: '+(val('message')||'Would love to discuss!'),'',
   'Looking forward to hearing from you!'
 ].join('\n');
 const subject='Event inquiry: '+val('occasion')+' — '+val('name');
 const mailto='mailto:jason@jamminexpress.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
 $('#form-status').textContent='Your email app should open with your event details. Review the message and press Send to deliver it. Nothing has been sent automatically.';
 window.location.href=mailto;
});
$('#year').textContent=new Date().getFullYear();
