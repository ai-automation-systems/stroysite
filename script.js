// ============================================================
//  ОБЩАЯ ЛОГИКА САЙТА
//  Меню, год, появление секций, карточки проектов, фильтры,
//  и — главное — приём заявок в Telegram через воркер (config.js).
// ============================================================

// ===== Мобильное меню =====
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
if (burger && nav) {
  burger.setAttribute('aria-controls', 'nav');
  burger.setAttribute('aria-expanded', 'false');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
}

// ===== Год в подвале =====
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// ===== Аналитика (события; при подключённой Метрике сработают цели) =====
function track(goal) {
  try { if (typeof ym === 'function' && window.YM_COUNTER) ym(window.YM_COUNTER, 'reachGoal', goal); } catch (e) {}
}
window.track = track;

// ===== MAX-контакт: показываем только при реальной ссылке (иначе прячем заглушку) =====
(function () {
  const S = window.SITE || {};
  const ok = S.max && !/REPLACE_WITH_MAX/.test(S.max);
  document.querySelectorAll('[data-max-row]').forEach((el) => {
    if (ok) { const a = el.querySelector('a[data-max-link]'); if (a) a.href = S.max; }
    else { el.remove(); }
  });
})();

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

// ===== Фильтры «Наши работы» и «Отзывы» =====
document.querySelectorAll('[data-filter]').forEach((chip) => {
  chip.addEventListener('click', () => {
    const group = chip.closest('.filters');
    if (group) group.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    const val = chip.getAttribute('data-filter');
    document.querySelectorAll('[data-case]').forEach((card) => {
      card.style.display = val === 'all' || card.getAttribute('data-case') === val ? '' : 'none';
    });
    // Пустое состояние: если после фильтра в сетке ничего не осталось —
    // показываем подпись, чтобы вкладка не выглядела пустой/сломанной.
    document.querySelectorAll('.reviews, .projects').forEach((grid) => {
      const hasVisible = Array.prototype.some.call(
        grid.querySelectorAll('[data-case]'),
        (c) => c.style.display !== 'none'
      );
      let empty = grid.nextElementSibling;
      if (!empty || !empty.classList.contains('filter-empty')) {
        empty = document.createElement('p');
        empty.className = 'filter-empty note-var';
        grid.parentNode.insertBefore(empty, grid.nextSibling);
      }
      empty.textContent = 'В этом направлении пока нет опубликованных примеров — добавим по мере накопления, только реальные.';
      empty.style.display = hasVisible ? 'none' : '';
    });
  });
});

// ============================================================
//  ОТПРАВКА ЗАЯВОК В TELEGRAM
// ============================================================
const INTENT_LABELS = {
  construction: 'Контроль стройки',
  ready: 'Купить готовый дом',
  expertise: 'Проверить дом или квартиру',
  choose: 'Пока сравниваю варианты',
};

async function sendLead(payload, statusEl, btnEl) {
  const endpoint = (window.SITE && window.SITE.leadEndpoint) || '';
  const phone = (window.SITE && window.SITE.phone) || '';
  const configured = endpoint && !/REPLACE_WITH_YANDEX_FUNCTION|REPLACE_WITH_YOUR_WORKER/.test(endpoint);

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
  let returnFocus = null;

  backdrop.setAttribute('aria-hidden', 'true');

  const open = (intent) => {
    returnFocus = document.activeElement;
    if (intent) selectIntent(intent);
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const first = modal.querySelector('input[name=name]');
    setTimeout(() => first && first.focus(), 60);
  };
  const close = () => {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
  };

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

// ============================================================
//  ПЛАВАЮЩАЯ КНОПКА СВЯЗИ (мессенджеры)
//  Ссылки берём из config.js (window.SITE). Ключей нет — только
//  публичные ссылки. Telegram показываем, только когда ник задан.
// ============================================================
(function () {
  const S = window.SITE || {};
  const ICON = {
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 0 1 7 12.5l-.3.5.6 2.2-2.2-.6-.5.3A8.2 8.2 0 1 1 12 3.8zM8.9 7.5c-.2 0-.5 0-.7.4-.3.4-.9 1-.9 2.3s.9 2.6 1 2.8c.2.2 1.9 3 4.6 4.1 2.3.9 2.7.8 3.2.7.6-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.5-.3l-1.6-.8c-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1-.3-.1-1.1-.4-2-1.3-.8-.7-1.3-1.5-1.4-1.7-.1-.3 0-.4.1-.5l.4-.5.3-.5v-.4l-.8-1.9c-.2-.4-.4-.4-.5-.4z"/></svg>',
    tg: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.9 4.4 2.9 11.7c-.9.3-.9 1.6.1 1.9l4.8 1.5 1.8 5.7c.2.6 1 .8 1.4.3l2.7-2.5 4.7 3.4c.6.4 1.4.1 1.5-.6l3-15c.2-.9-.6-1.6-1.5-1.3zM9.8 14.4l8.4-6.6-6.9 7.3-.2 3.1z"/></svg>',
    ph: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.3 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.4 21 3 13.6 3 4.9c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.2 2.3z"/></svg>',
    max: '<svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M50.7571 0.261719C78.2929 0.261719 99.8857 22.5974 99.8857 50.1474C99.8857 77.6974 77.6071 99.4903 51.0214 99.4903C41.5857 99.4903 37.0143 98.1617 29.65 92.9474C29.1429 92.5903 28.45 92.6831 28.0214 93.1403C22.3571 99.1831 7.85 103.426 7.18571 95.176C7.18571 80.7903 0 71.4474 0 49.876C0 21.5546 23.2214 0.261719 50.7571 0.261719ZM51.5286 24.8117C38.4643 24.126 28.2643 33.1974 26.0143 47.3831C24.15 59.1332 27.45 73.4546 30.2786 74.176C31.4786 74.4832 34.3571 72.276 36.4571 70.2974C36.85 69.926 37.45 69.8617 37.9071 70.1474C41.1786 72.1474 44.8786 73.6474 48.9571 73.8617C62.3714 74.5617 74.2571 64.0617 74.9643 50.6474C75.6643 37.2331 64.9429 25.5046 51.5286 24.8046V24.8117Z"/></svg>',
  };
  const items = [];
  if (S.whatsapp) items.push(['wa', 'WhatsApp', S.whatsapp, 'messenger_click', true]);
  if (S.telegram && !/REPLACE_WITH_YOUR_NICK/.test(S.telegram)) items.push(['tg', 'Telegram', S.telegram, 'messenger_click', true]);
  if (S.max && !/REPLACE_WITH_MAX/.test(S.max)) items.push(['max', 'MAX', S.max, 'messenger_click', true]);
  if (S.phoneHref) items.push(['ph', 'Позвонить', S.phoneHref, 'phone_click', false]);
  if (!items.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'chat-fab';
  let html = '<div class="chat-fab-menu">';
  items.forEach((it) => {
    const ext = it[4] ? ' target="_blank" rel="noopener"' : '';
    html += '<a class="chat-fab-item" href="' + it[2] + '"' + ext + ' data-goal="' + it[3] + '">' + ICON[it[0]] + '<span>' + it[1] + '</span></a>';
  });
  html += '</div>' +
    '<button class="chat-fab-toggle" type="button" aria-label="Связаться" aria-expanded="false">' +
    '<svg class="ic-chat" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2z"/></svg>' +
    '<svg class="ic-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
    '</button>';
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  const toggle = wrap.querySelector('.chat-fab-toggle');
  const setOpen = (open) => { wrap.classList.toggle('open', open); toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); };
  toggle.addEventListener('click', () => setOpen(!wrap.classList.contains('open')));
  wrap.querySelectorAll('.chat-fab-item').forEach((a) => a.addEventListener('click', () => track(a.getAttribute('data-goal'))));
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
})();

// ============================================================
//  COOKIE-СОГЛАСИЕ + ЯНДЕКС.МЕТРИКА
//  Метрика грузится ТОЛЬКО после согласия и только если задан
//  metrikaId в config.js. Иначе — ничего не загружается.
// ============================================================
(function () {
  const S = window.SITE || {};
  const KEY = 'cookie_consent_vsk';
  let granted = false;
  try { granted = localStorage.getItem(KEY) === 'yes'; } catch (e) {}

  function loadMetrika() {
    const id = S.metrikaId;
    if (!id || window.__ymLoaded) return;
    window.__ymLoaded = true;
    window.YM_COUNTER = id;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(id, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }

  if (granted) { loadMetrika(); return; }

  const bar = document.createElement('div');
  bar.className = 'cookie-bar';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Согласие на использование cookie');
  bar.innerHTML =
    '<p>Мы используем файлы cookie и сервис Яндекс.Метрика, чтобы сайт работал и был удобнее. ' +
    'Оставаясь на сайте, вы соглашаетесь с этим. Подробнее — в ' +
    '<a href="privacy.html">политике конфиденциальности</a>.</p>' +
    '<button class="btn btn-primary cookie-accept" type="button">Принять</button>';
  document.body.appendChild(bar);
  requestAnimationFrame(() => bar.classList.add('show'));
  bar.querySelector('.cookie-accept').addEventListener('click', () => {
    try { localStorage.setItem(KEY, 'yes'); } catch (e) {}
    bar.classList.remove('show');
    setTimeout(() => bar.remove(), 300);
    loadMetrika();
  });
})();
