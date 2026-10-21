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
// Subtle motion without hidden/blank elements or external libraries.
if(!reduce && "IntersectionObserver" in window){
 const observer=new IntersectionObserver(items=>{for(const item of items){if(!item.isIntersecting)continue;observer.unobserve(item.target);if(item.target.animate)item.target.animate([{transform:"translateY(14px)"},{transform:"translateY(0)"}],{duration:580,easing:"cubic-bezier(.2,.65,.2,1)"})}},{threshold:.08,rootMargin:"0px 0px -18px 0px"});
 $$("[data-enter]").forEach(el=>observer.observe(el));
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