/* ============================================================
   Фото-интро «вход в дом» на motion.dev.
   Прогресс скролла берём через Motion (scroll()) — трекинг
   оптимизированный; затем сглаживаем инерцией (current→target),
   чтобы «камера» ехала плавно, с лёгким пружинным послевкусием.
   Двигаем только transform/opacity по реальным фото.
   Если motion.dev не загрузился — падаем на нативный скролл.
   ============================================================ */
(function () {
  var section = document.querySelector('.enter-house');
  if (!section) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ext = section.querySelector('.eh-ext');
  var int = section.querySelector('.eh-int');
  var flash = section.querySelector('.eh-flash');
  var title = section.querySelector('.eh-title');
  var hint = section.querySelector('.eh-hint');
  var bar = section.querySelector('.eh-progress');
  var beats = Array.prototype.slice.call(section.querySelectorAll('.eh-beat'));

  var centers = [0.44, 0.60, 0.76, 0.93];
  var HALF = 0.12;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  // --- отрисовка кадра по прогрессу p (0..1) ---
  function render(p) {
    if (bar) bar.style.width = (p * 100) + '%';
    document.body.classList.toggle('eh-immersed', p > 0.02 && p < 0.98);

    // 1) фасад — наезд и растворение
    var extScale = lerp(1.06, 1.2, clamp(p / 0.30, 0, 1));
    ext.style.transform = 'scale(' + extScale.toFixed(4) + ')';
    ext.style.opacity = (p < 0.18 ? 1 : clamp(1 - (p - 0.18) / 0.12, 0, 1)).toFixed(3);

    if (title) {
      title.style.opacity = clamp(1 - (p - 0.10) / 0.08, 0, 1).toFixed(3);
      title.style.transform = 'translateY(' + (-p * 60).toFixed(1) + 'px)';
    }
    if (hint) hint.style.opacity = clamp(1 - p / 0.12, 0, 1).toFixed(3);

    // 2) переход к интерьеру
    int.style.opacity = clamp((p - 0.18) / 0.12, 0, 1).toFixed(3);

    // 3) вход: зум от двери (2.3) к общему плану (1.0)
    var intScale = lerp(2.3, 1.0, easeOut(clamp((p - 0.24) / 0.66, 0, 1)));
    int.style.transform = 'scale(' + intScale.toFixed(4) + ')';

    if (flash) flash.style.opacity = (clamp(1 - Math.abs(p - 0.24) / 0.10, 0, 1) * 0.8).toFixed(3);

    // 4) смысловые кадры — единый плавный кроссфейд, привязанный к скроллу (одно появление)
    for (var i = 0; i < beats.length; i++) {
      var c = centers[i], op;
      if (i === beats.length - 1 && p >= c) op = 1;
      else if (i === 0 && p <= c) op = clamp((p - 0.30) / (c - 0.30), 0, 1);
      else op = clamp(1 - Math.abs(p - c) / HALF, 0, 1);
      beats[i].style.opacity = op.toFixed(3);
      var inner = beats[i].firstElementChild;
      if (inner) inner.style.transform = 'translateY(' + ((p - c) * 80).toFixed(1) + 'px)';
    }
  }

  // --- прогресс секции по скроллу ---
  function nativeP() {
    var rect = section.getBoundingClientRect();
    return clamp(-rect.top / (section.offsetHeight - window.innerHeight), 0, 1);
  }

  // Единый драйвер — нативный скролл, синхронный рендер. rAF-батчинг, чтобы не молотить чаще кадра.
  var ticking = false;
  function onScroll() {
    render(nativeP());                    // мгновенно и надёжно
    if (!ticking) {                       // и ещё раз в кадре — на случай, если событие пришло между кадрами
      ticking = true;
      requestAnimationFrame(function () { ticking = false; render(nativeP()); });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  render(nativeP());
})();
