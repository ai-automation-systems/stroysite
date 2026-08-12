/* ============================================================
   CLOUDFLARE WORKER — приём заявок с сайта и отправка в Telegram.
   Токен бота и id чата хранятся как секреты воркера (env),
   в коде сайта их НЕТ. Это «как у топов»: браузер шлёт заявку сюда,
   а уже воркер пишет в ваш Telegram.

   РАЗВЁРТЫВАНИЕ (один раз, ~10 минут) — см. README-telegram.md.
   Секреты, которые надо задать в настройках воркера:
     BOT_TOKEN   — токен бота от @BotFather
     CHAT_ID     — id вашего чата/канала (узнать у @userinfobot)
     ALLOW_ORIGIN — адрес сайта, напр. https://username.github.io
   ============================================================ */

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allow = env.ALLOW_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': allow === '*' ? '*' : origin === allow ? origin : allow,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, cors);

    let data;
    try { data = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400, cors); }

    // Honeypot: скрытое поле, которое заполняют только боты.
    if (data.company) return json({ ok: true }, 200, cors); // тихо игнорируем

    const name = clean(data.name, 80);
    const phone = clean(data.phone, 40);
    if (!name || !phone) return json({ ok: false, error: 'required' }, 422, cors);

    const intent = clean(data.intent, 60) || '—';
    const comment = clean(data.comment, 800);
    const page = clean(data.page, 200);

    const text =
      '🏠 <b>Новая заявка с сайта</b>\n\n' +
      '👤 <b>Имя:</b> ' + esc(name) + '\n' +
      '📞 <b>Телефон:</b> ' + esc(phone) + '\n' +
      '🎯 <b>Задача:</b> ' + esc(intent) + '\n' +
      (comment ? '💬 <b>Комментарий:</b> ' + esc(comment) + '\n' : '') +
      (page ? '\n🔗 <i>' + esc(page) + '</i>' : '');

    const tg = await fetch(
      'https://api.telegram.org/bot' + env.BOT_TOKEN + '/sendMessage',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      }
    );

    if (!tg.ok) return json({ ok: false, error: 'telegram' }, 502, cors);
    return json({ ok: true }, 200, cors);
  },
};

function clean(v, max) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
