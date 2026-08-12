// ===== Мобильное меню =====
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
if (burger && nav) {
  burger.addEventListener('click', () => nav.classList.toggle('open'));
}

// ===== Год в подвале =====
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// ===== Цели Яндекс.Метрики =====
// Замените 00000000 на номер вашего счётчика после его создания
const YM_COUNTER = 00000000;
function ymGoal(goal) {
  if (typeof ym === 'function' && YM_COUNTER) {
    ym(YM_COUNTER, 'reachGoal', goal);
  }
}

// ===== Отправка форм (Formspree) =====
// Зарегистрируйтесь на formspree.io (бесплатно до 50 заявок/мес),
// создайте форму и замените ВАШ_ID в action каждой формы.
document.querySelectorAll('form[action*="formspree"]').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = form.querySelector('.form-status');
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Отправляем…';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        form.reset();
        if (status) {
          status.className = 'form-status ok';
          status.textContent = 'Заявка отправлена! Перезвоним в течение рабочего дня.';
        }
        ymGoal('form_submit');
      } else {
        throw new Error();
      }
    } catch {
      if (status) {
        status.className = 'form-status err';
        status.textContent = 'Не удалось отправить. Позвоните нам: +7 (900) 000-00-00';
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Получить расчёт';
    }
  });
});

// ===== Карточки проектов: фасад ↔ планировка по тапу (моб.) =====
document.querySelectorAll('.project-media').forEach((m) => {
  m.addEventListener('click', () => m.classList.toggle('show-plan'));
});

// ===== Плавное появление секций =====
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
}
