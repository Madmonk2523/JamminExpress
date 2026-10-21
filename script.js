/* Jammin' Express — small, dependency-free interactions */
(()=>{
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const menu=$("#menu-toggle"),nav=$("#main-nav");
const closeMenu=()=>{if(!menu||!nav)return;menu.setAttribute("aria-expanded","false");menu.setAttribute("aria-label","Open menu");nav.classList.remove("open");document.body.classList.remove("menu-open")};
if(menu&&nav){
 menu.addEventListener("click",()=>{const open=menu.getAttribute("aria-expanded")!=="true";menu.setAttribute("aria-expanded",String(open));menu.setAttribute("aria-label",open?"Close menu":"Open menu");nav.classList.toggle("open",open);document.body.classList.toggle("menu-open",open)});
 $$("a",nav).forEach(a=>a.addEventListener("click",closeMenu));
 addEventListener("resize",()=>{if(innerWidth>860)closeMenu()},{passive:true});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&menu.getAttribute("aria-expanded")==="true"){closeMenu();menu.focus()}});
 document.addEventListener("pointerdown",e=>{if(menu.getAttribute("aria-expanded")==="true"&&!nav.contains(e.target)&&!menu.contains(e.target))closeMenu()});
}
const filename=location.pathname.split("/").pop()||"index.html";
$$(".main-nav a").forEach(a=>{if(a.getAttribute("href")===filename)a.setAttribute("aria-current","page")});
const head=$(".header"),progress=$(".progress span");
let ticking=false;
const scrollUpdate=()=>{head?.classList.toggle("scrolled",scrollY>20);if(progress){const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);progress.style.transform="scaleX("+Math.min(1,Math.max(0,scrollY/max))+")"}ticking=false};
addEventListener("scroll",()=>{if(!ticking){ticking=true;requestAnimationFrame(scrollUpdate)}},{passive:true});
addEventListener("resize",scrollUpdate,{passive:true});scrollUpdate();
const year=$("#year");if(year)year.textContent=new Date().getFullYear();
// Scroll cinematography, native browser APIs only. No pinned sections,
// third-party animation code, or invisible content.
if(!reduce){
 const enter=[...new Set($$("[data-enter], .event-row figure, .service-row figure, .gallery-tile, .film-preview-visual, .video-feature-photo, .moments-grid li"))];
 const photoFrames="figure, .gallery-tile";
 if("IntersectionObserver" in window){
  const io=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)continue;
    const el=entry.target;io.unobserve(el);
    if(!el.animate)continue;
    const isPhoto=el.matches(photoFrames);
    const stagger=el.matches(".moments-grid li")?(Array.from(el.parentElement.children).indexOf(el)%4)*65:0;
    el.animate(isPhoto?[
      {clipPath:"inset(5% 3% 5% 3%)",filter:"saturate(.75)"},
      {clipPath:"inset(0% 0% 0% 0%)",filter:"saturate(1)"}
    ]:[
      {transform:"translate3d(0,27px,0)",filter:"blur(3px)"},
      {transform:"translate3d(0,0,0)",filter:"blur(0)"}
    ],{duration:isPhoto?950:780,delay:stagger,easing:"cubic-bezier(.18,.68,.18,1)",fill:"none"});
   }
  },{threshold:.06,rootMargin:"0px 0px -16px 0px"});
  enter.forEach(el=>io.observe(el));
 }
 // Animation depth is applied to clipped photo frames, never to the layout.
 // This also works without scroll-timeline browser support.
 if(matchMedia("(min-width: 900px) and (min-height: 620px)").matches){
  const targets=[
   ...$$(".hero, .photo-break").map(el=>({el,max:23})),
   ...$$(".event-row figure, .service-row figure, .film-preview-visual, .video-feature-photo").map(el=>({el,max:8}))
  ];
  let scheduled=false;
  const depthUpdate=()=>{
    scheduled=false;
    const vh=innerHeight||800;
    for(const item of targets){
     const rect=item.el.getBoundingClientRect();
     if(rect.bottom<0||rect.top>vh)continue;
     const delta=(vh/2-(rect.top+rect.height/2))/(vh/2+rect.height/2);
     item.el.style.setProperty("--depth",(Math.max(-1,Math.min(1,delta))*item.max).toFixed(1)+"px");
    }
  };
  const queue=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(depthUpdate)}};
  addEventListener("scroll",queue,{passive:true});
  addEventListener("resize",queue,{passive:true});
  queue();
 }
 if(matchMedia("(hover: hover) and (pointer: fine)").matches){
  $$(".event-link-grid>a, .extra-grid article").forEach(card=>{
   card.addEventListener("pointermove",e=>{
    const rect=card.getBoundingClientRect();
    card.style.setProperty("--pointer-x",((e.clientX-rect.left)/rect.width*100).toFixed(1)+"%");
    card.style.setProperty("--pointer-y",((e.clientY-rect.top)/rect.height*100).toFixed(1)+"%");
   },{passive:true});
  });
 }
}
// Photo viewer; only on the gallery page.
const tiles=$$(".gallery-tile"),viewer=$("#lightbox");
if(viewer&&tiles.length){
 const display=$(".lightbox-image",viewer),count=$(".lightbox-count",viewer);
 const close=$(".lightbox-close",viewer),prev=$(".lightbox-prev",viewer),next=$(".lightbox-next",viewer);
 let selected=0,origin=null;
 const show=()=>{selected=(selected+tiles.length)%tiles.length;const img=$("img",tiles[selected]);display.src=img.getAttribute("src");display.alt=img.alt;count.textContent=String(selected+1).padStart(2,"0")+" / "+String(tiles.length).padStart(2,"0")};
 const dismiss=()=>{viewer.classList.remove("open");viewer.setAttribute("aria-hidden","true");document.body.classList.remove("viewer-open");display.removeAttribute("src");origin?.focus()};
 tiles.forEach((tile,i)=>tile.addEventListener("click",()=>{origin=document.activeElement;selected=i;show();viewer.classList.add("open");viewer.setAttribute("aria-hidden","false");document.body.classList.add("viewer-open");close.focus()}));
 close.addEventListener("click",dismiss);
 prev.addEventListener("click",()=>{selected--;show()});
 next.addEventListener("click",()=>{selected++;show()});
 viewer.addEventListener("pointerdown",e=>{if(e.target===viewer)dismiss()});
 document.addEventListener("keydown",e=>{
  if(!viewer.classList.contains("open"))return;
  if(e.key==="Escape"){dismiss();e.preventDefault()}
  if(e.key==="ArrowLeft"){selected--;show();e.preventDefault()}
  if(e.key==="ArrowRight"){selected++;show();e.preventDefault()}
  if(e.key==="Tab"){
   const controls=[close,prev,next],idx=controls.indexOf(document.activeElement);
   if(idx<0){close.focus();e.preventDefault()}
   else if(e.shiftKey&&idx===0){next.focus();e.preventDefault()}
   else if(!e.shiftKey&&idx===controls.length-1){close.focus();e.preventDefault()}
  }
 });
}
// Mail-compose form: do not claim to send anything from the website.
const form=$("#contact-form"),date=$("#date");
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
if(date){date.min=today();date.addEventListener("focus",()=>date.min=today())}
if(form){
 const q=new URLSearchParams(location.search),occasion=$("#occasion");
 if(occasion){const target=q.get("occasion");if(target){const opt=Array.from(occasion.options).find(o=>o.value.toLowerCase()===target.toLowerCase());if(opt)occasion.value=opt.value}}
 form.addEventListener("submit",e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const data=new FormData(form),val=k=>String(data.get(k)||"").trim();
  const subject="Event inquiry — "+val("occasion")+" — "+val("name");
  const lines=["Hello Jammin Express,","","I'd like to inquire about entertainment for an event.","","Name: "+val("name"),"Email: "+val("email"),"Phone: "+(val("phone")||"Not provided"),"Event: "+val("occasion"),"Date: "+(val("date")||"Not selected"),"Location: "+(val("location")||"Not yet decided"),"Details: "+(val("message")||"Please contact me to discuss."),"","Thank you."];
  const status=$("#form-status");if(status)status.textContent="Your email app should open now. Review the prepared message and press Send to complete your inquiry.";
  location.href="mailto:jason@jamminexpress.com?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(lines.join("\n"));
 });
}
})();