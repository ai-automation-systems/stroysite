/* ============================================================
   ФОТО-ИСТОРИЯ НА СКРОЛЛЕ (5 кадров)
   Полноэкранные фотографии плавно сменяют друг друга по мере
   прокрутки; поверх — H1 и 4 смысловых блока, привязанных к кадрам.
   Двигаем только opacity/transform (дёшево для GPU). Нативный скролл
   + rAF-батчинг. reduced-motion → статичный первый кадр (см. CSS).
   ============================================================ */
(function () {
  var section = document.querySelector('.enter-house');
  if (!section) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var frames = Array.prototype.slice.call(section.querySelectorAll('.eh-frame'));
  var title = section.querySelector('.eh-title');
  var hint = section.querySelector('.eh-hint');
  var bar = section.querySelector('.eh-progress');
  var beats = Array.prototype.slice.call(section.querySelectorAll('.eh-beat'));
  var N = frames.length; // 5
  if (!N) return;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // --- отрисовка по прогрессу p (0..1) ---
  function render(p) {
    if (bar) bar.style.width = (p * 100).toFixed(2) + '%';
    document.body.classList.toggle('eh-immersed', p > 0.02 && p < 0.98);

    var pos = p * (N - 1); // «камера» скользит по кадрам: 0..N-1

    // Кадры: линейный кроссфейд между соседними + мягкий ken-burns
    for (var k = 0; k < N; k++) {
      frames[k].style.opacity = clamp(1 - Math.abs(pos - k), 0, 1).toFixed(3);
      var life = clamp((pos - (k - 1)) / 2, 0, 1);          // 0..1 за время жизни кадра
      var img = frames[k].firstElementChild;
      if (img) img.style.transform = 'scale(' + (1.04 + life * 0.10).toFixed(4) + ')';
    }

    // H1 — держится на первом кадре, мягко уходит вверх при прокрутке
    if (title) {
      title.style.opacity = clamp(1 - pos / 0.75, 0, 1).toFixed(3);
      title.style.transform = 'translateY(' + (-pos * 26).toFixed(1) + 'px)';
    }
    if (hint) hint.style.opacity = clamp(1 - pos / 0.5, 0, 1).toFixed(3);

    // Смысловые блоки привязаны к кадрам 2..5 (pos = i+1)
    for (var i = 0; i < beats.length; i++) {
      var c = i + 1, op;
      if (i === beats.length - 1 && pos >= c) op = 1;        // последний держим до конца
      else op = clamp(1 - Math.abs(pos - c) / 0.72, 0, 1);
      beats[i].style.opacity = op.toFixed(3);
      var inner = beats[i].firstElementChild;
      if (inner) inner.style.transform = 'translateY(' + ((pos - c) * 34).toFixed(1) + 'px)';
    }
  }

  // --- прогресс секции по скроллу ---
  function nativeP() {
    var rect = section.getBoundingClientRect();
    return clamp(-rect.top / (section.offsetHeight - window.innerHeight), 0, 1);
  }

  var ticking = false;
  function onScroll() {
    render(nativeP());
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { ticking = false; render(nativeP()); });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  render(nativeP());
})();
