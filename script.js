// ============================================================
//  ОБЩАЯ ЛОГИКА САЙТА
//  Меню, год, появление секций, карточки проектов, фильтры,
//  и — главное — приём заявок в Telegram через воркер (config.js).
// ============================================================

// ===== Мобильное меню =====
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
if (burger && nav) burger.addEventListener('click', () => nav.classList.toggle('open'));

// ===== Год в подвале =====
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// ===== Аналитика (события; при подключённой Метрике сработают цели) =====
function track(goal) {
  try { if (typeof ym === 'function' && window.YM_COUNTER) ym(window.YM_COUNTER, 'reachGoal', goal); } catch (e) {}
}
window.track = track;

// ===== Плавное появление секций =====
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
}

// ===== Карточки проектов: фасад ↔ планировка по тапу =====
document.querySelectorAll('.project-media').forEach((m) => m.addEventListener('click', () => m.classList.toggle('show-plan')));

// ===== Фильтры «Наши работы» =====
document.querySelectorAll('[data-filter]').forEach((chip) => {
  chip.addEventListener('click', () => {
    const group = chip.closest('.filters');
    if (group) group.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    const val = chip.getAttribute('data-filter');
    document.querySelectorAll('[data-case]').forEach((card) => {
      card.style.display = val === 'all' || card.getAttribute('data-case') === val ? '' : 'none';
    });
  });
});

// ============================================================
//  ОТПРАВКА ЗАЯВОК В TELEGRAM
// ============================================================
const INTENT_LABELS = {
  construction: 'Построить дом',
  ready: 'Купить готовый дом',
  expertise: 'Проверить дом',
  choose: 'Пока сравниваю варианты',
};

async function sendLead(payload, statusEl, btnEl) {
  const endpoint = (window.SITE && window.SITE.leadEndpoint) || '';
  const phone = (window.SITE && window.SITE.phone) || '';
  const configured = endpoint && !/REPLACE_WITH_YOUR_WORKER/.test(endpoint);

  const setStatus = (cls, msg) => { if (statusEl) { statusEl.className = 'form-status ' + cls; statusEl.textContent = msg; } };

  if (!configured) {
    // Воркер ещё не подключён — не делаем вид, что заявка ушла.
    setStatus('err', 'Форма пока настраивается. Позвоните нам: ' + phone);
    return false;
  }

  const oldText = btnEl ? btnEl.textContent : '';
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Отправляем…'; }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, page: location.pathname + location.hash }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      setStatus('ok', 'Спасибо! Заявку получили. Специалист свяжется с вами в рабочее время и предложит следующий шаг.');
      track('lead_submit');
      return true;
    }
    throw new Error();
  } catch {
    setStatus('err', 'Не удалось отправить. Позвоните нам: ' + phone);
    return false;
  } finally {
    if (btnEl) { btnEl.disabled = false; btnEl.textContent = oldText; }
  }
}

// ---- Обычные формы на страницах (диагностическая, контактная) ----
document.querySelectorAll('form[data-lead]').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const intentRaw = fd.get('intent') || form.getAttribute('data-intent') || 'choose';
    const ok = await sendLead(
      {
        name: fd.get('name') || '',
        phone: fd.get('phone') || '',
        intent: INTENT_LABELS[intentRaw] || intentRaw,
        comment: fd.get('comment') || '',
        company: fd.get('company') || '', // honeypot
      },
      form.querySelector('.form-status'),
      form.querySelector('button[type=submit]')
    );
    if (ok) form.reset();
  });
});

// ============================================================
//  МОДАЛКА «С ЧЕМ ВАМ ПОМОЧЬ?»
// ============================================================
const modal = document.getElementById('leadModal');
if (modal) {
  const backdrop = modal;
  const form = modal.querySelector('form');
  const intentInput = modal.querySelector('input[name=intent]');
  let selectedIntent = 'choose';

  const open = (intent) => {
    if (intent) selectIntent(intent);
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    const first = modal.querySelector('input[name=name]');
    setTimeout(() => first && first.focus(), 60);
  };
  const close = () => { backdrop.classList.remove('open'); document.body.style.overflow = ''; };

  function selectIntent(val) {
    selectedIntent = val;
    if (intentInput) intentInput.value = val;
    modal.querySelectorAll('.intent-btn').forEach((b) => b.classList.toggle('active', b.getAttribute('data-intent') === val));
    track('scenario_select');
  }

  modal.querySelectorAll('.intent-btn').forEach((b) => b.addEventListener('click', () => selectIntent(b.getAttribute('data-intent'))));
  modal.querySelector('.modal-close').addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && backdrop.classList.contains('open')) close(); });

  // Любой элемент с data-open-modal[="intent"] открывает окно
  document.querySelectorAll('[data-open-modal]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      open(el.getAttribute('data-open-modal') || null);
      track('open_lead_modal');
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const ok = await sendLead(
      {
        name: fd.get('name') || '',
        phone: fd.get('phone') || '',
        intent: INTENT_LABELS[selectedIntent] || selectedIntent,
        comment: fd.get('comment') || '',
        company: fd.get('company') || '',
      },
      form.querySelector('.form-status'),
      form.querySelector('button[type=submit]')
    );
    if (ok) { form.reset(); selectIntent(selectedIntent); setTimeout(close, 2200); }
  });
}
