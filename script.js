/* Shared UI and lead delivery. No external credentials in the browser. */
const S=window.SITE||{};
function track(goal){if(typeof window.ym==='function'&&window.YM_COUNTER)window.ym(window.YM_COUNTER,'reachGoal',goal)}
window.track=track;
const nav=document.getElementById('nav'),burger=document.getElementById('burger');
function menu(open){nav.classList.toggle('open',open);burger.setAttribute('aria-expanded',String(open));burger.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню')}
burger.addEventListener('click',()=>menu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape')menu(false)});
document.addEventListener('click',e=>{if(!e.target.closest('header'))menu(false)});
document.getElementById('year').textContent=new Date().getFullYear();
const privacy=document.getElementById('privacy');
function openPrivacy(){if(location.hash==='#privacy')privacy.open=true}
window.addEventListener('hashchange',openPrivacy);openPrivacy();
document.querySelectorAll('a[href="#privacy"]').forEach(a=>a.addEventListener('click',()=>privacy.open=true));
document.querySelectorAll('.project-media').forEach(b=>b.addEventListener('click',()=>{const show=b.classList.toggle('show-plan');b.setAttribute('aria-pressed',String(show));b.querySelector('.media-hint').textContent=show?'Фасад':'Планировка'}));
const calc=document.querySelector('#calc form');
function selectHouse(name){const select=calc.elements.project;select.value=Array.from(select.options).find(o=>o.text.startsWith(name))?.value||'Помогите выбрать';location.hash='calc';calc.elements.name.focus({preventScroll:true});track('project_select')}
document.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>selectHouse(b.dataset.project)));
document.querySelectorAll('[data-material]').forEach(a=>a.addEventListener('click',()=>{calc.elements.material.value=a.dataset.material}));
// Preview only: validate fields, but do not transmit or store visitor data.
const form=calc,status=form.querySelector('.form-status');
form.elements.phone.addEventListener('input',()=>form.elements.phone.setCustomValidity(''));
form.addEventListener('submit',e=>{
 e.preventDefault();
 if(form.elements.company.value)return;
 if(form.elements.phone.value.replace(/\D/g,'').length<10){form.elements.phone.setCustomValidity('Введите номер телефона: не менее 10 цифр.');form.elements.phone.reportValidity();return}
 status.className='form-status info';
 status.textContent='Это предварительный просмотр сайта. Заявка не отправлена.';
});
// Preserve the supplied counter; load it only after the consent described in the policy.
(function(){
 if(!S.metrikaId||/^(localhost|127\.0\.0\.1)$/.test(location.hostname)||location.protocol==='file:')return;
 const key='vsk_analytics_consent_v2';let choice=null;try{choice=localStorage.getItem(key)}catch{}
 function load(){if(window.__ymLoaded)return;window.__ymLoaded=true;window.YM_COUNTER=S.metrikaId;window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments)};window.ym.l=Date.now();const script=document.createElement('script');script.src='https://mc.yandex.ru/metrika/tag.js';script.async=true;document.head.append(script);window.ym(S.metrikaId,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true})}
 if(choice==='yes'){load();return}if(choice==='no')return;
 const bar=document.createElement('div');bar.className='cookie-bar show';bar.setAttribute('role','region');bar.setAttribute('aria-label','Настройки аналитики');bar.innerHTML='<p>Разрешить Яндекс.Метрику для анализа посещаемости? <a href="#privacy">Политика конфиденциальности</a>.</p><div class="cookie-actions"><button class="btn btn-outline" type="button" data-consent="no">Без аналитики</button><button class="btn btn-primary" type="button" data-consent="yes">Разрешить</button></div>';document.body.append(bar);bar.querySelector('a').addEventListener('click',()=>privacy.open=true);bar.querySelectorAll('[data-consent]').forEach(b=>b.addEventListener('click',()=>{try{localStorage.setItem(key,b.dataset.consent)}catch{}if(b.dataset.consent==='yes')load();bar.remove()}));
})();
