// A lightweight, manually controlled slideshow. No scroll capture or automatic motion.
(()=>{const slides=[...document.querySelectorAll('.hero-slide')],dots=[...document.querySelectorAll('[data-slide]')],prev=document.querySelector('[data-slide-prev]'),next=document.querySelector('[data-slide-next]');if(slides.length<2||!prev||!next)return;let current=0;
function show(index){current=(index+slides.length)%slides.length;slides.forEach((s,i)=>{s.classList.toggle('is-active',i===current);s.setAttribute('aria-hidden',String(i!==current))});dots.forEach((d,i)=>d.setAttribute('aria-pressed',String(i===current)))}
dots.forEach(d=>d.addEventListener('click',()=>show(Number(d.dataset.slide))));prev.addEventListener('click',()=>show(current-1));next.addEventListener('click',()=>show(current+1));
})();
