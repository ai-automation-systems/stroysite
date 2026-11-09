// A lightweight, manually controlled slideshow. No scroll capture or automatic motion.
(()=>{const slides=[...document.querySelectorAll('.hero-slide')],dots=[...document.querySelectorAll('[data-slide]')];let current=0;
function show(index){current=(index+slides.length)%slides.length;slides.forEach((s,i)=>{s.classList.toggle('is-active',i===current);s.setAttribute('aria-hidden',String(i!==current))});dots.forEach((d,i)=>d.setAttribute('aria-pressed',String(i===current)))}
dots.forEach(d=>d.addEventListener('click',()=>show(Number(d.dataset.slide))));document.querySelector('[data-slide-prev]').addEventListener('click',()=>show(current-1));document.querySelector('[data-slide-next]').addEventListener('click',()=>show(current+1));
})();
