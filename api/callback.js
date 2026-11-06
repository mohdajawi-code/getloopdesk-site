// Call-back requests from the website form (#demo on index.html).
// Checks the request, then emails it to the sales inbox through Resend.
//
// Vercel environment variables (Project settings > Environment Variables):
//   RESEND_API_KEY   required. Until it is set, the form offers "send by email instead".
//   CALLBACK_TO      optional, default sales@getloopdesk.com
//   CALLBACK_FROM    optional, default "Loopdesk website <website@getloopdesk.com>"
//   LEAD_INTAKE_URL  optional, e.g. https://staff.getloopdesk.com/leads/intake (platform PR #22)
//   LEAD_INTAKE_SECRET  optional, same value as on the platform (24+ characters)
//   With both set, each request also lands in the sales team's open pool, unassigned.
//
// Field values match the platform's lead model (src/sales/leads.ts), so a request
// can later go straight into the sales team's open pool as a "website" lead.

const TO = process.env.CALLBACK_TO || 'sales@getloopdesk.com';
const FROM = process.env.CALLBACK_FROM || 'Loopdesk website <website@getloopdesk.com>';

const VERTICALS = {
  beauty: ['Beauty centre', 'مركز تجميل'],
  cosmetic: ['Cosmetic clinic', 'عيادة تجميل'],
  dental: ['Dental clinic', 'عيادة أسنان'],
  barber: ['Barbershop', 'صالون حلاقة'],
  other: ['Something else', 'نشاط آخر'],
};
const EMIRATES = {
  dubai: 'Dubai', abu_dhabi: 'Abu Dhabi', sharjah: 'Sharjah', ajman: 'Ajman',
  rak: 'Ras Al Khaimah', fujairah: 'Fujairah', uaq: 'Umm Al Quwain',
};
const BRANCHES = { '1': '1', '2': '2', '3': '3', '4': '4 or more' };
const TIMES = {
  morning: 'Morning, 10am to 12pm',
  afternoon: 'Afternoon, 12pm to 4pm',
  evening: 'Evening, 4pm to 8pm',
  any: 'Any time, 10am to 8pm',
};

// The exact words next to each tick box, kept here so the email records what they agreed to.
// Keep in step with the labels in index.html.
const CONSENT_WORDS = {
  email: {
    en: 'Email me ideas, tips and offers from Loopdesk. I can stop any time.',
    ar: 'أرسلوا إليّ أفكارًا ونصائح وعروضًا من Loopdesk بالبريد الإلكتروني، ويمكنني الإيقاف متى شئت.',
  },
  whatsapp: {
    en: 'Send me ideas, tips and offers from Loopdesk on WhatsApp. I can reply STOP any time.',
    ar: 'أرسلوا إليّ أفكارًا ونصائح وعروضًا من Loopdesk عبر WhatsApp، ويمكنني إرسال «إيقاف» متى شئت.',
  },
};

const ALLOWED_ORIGINS = [/^https:\/\/(www\.)?getloopdesk\.com$/, /^https:\/\/[a-z0-9-]+\.vercel\.app$/, /^http:\/\/localhost(:\d+)?$/];
const MIN_FILL_MS = 3000; // people take longer than this to fill seven fields
const LIMIT = 5; // requests per address in the window
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map(); // per running instance only; a first line, not a wall

function rateLimited(ip, now) {
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT;
}

const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** UAE mobiles become +9715XXXXXXXX. Other countries must start with + and their code. */
function normalisePhone(raw) {
  let d = String(raw || '').replace(/[\s\-().]/g, '');
  if (d.startsWith('00')) d = '+' + d.slice(2);
  if (/^05\d{8}$/.test(d)) return '+971' + d.slice(1);
  if (/^5\d{8}$/.test(d)) return '+971' + d;
  if (/^\+9715\d{8}$/.test(d)) return d;
  if (/^\+971/.test(d)) return null; // a UAE number that is not a mobile
  if (/^\+[1-9]\d{7,14}$/.test(d)) return d;
  return null;
}

function validate(b) {
  const f = {
    name: clean(b.name, 80),
    business: clean(b.business, 120),
    phone: normalisePhone(b.phone),
    email: clean(b.email, 160).toLowerCase(),
    vertical: clean(b.vertical, 20),
    emirate: clean(b.emirate, 20),
    branches: clean(b.branches, 2),
    time: clean(b.time, 20),
    lang: b.lang === 'ar' ? 'ar' : 'en',
    consentEmail: b.consentEmail === true,
    consentWhatsapp: b.consentWhatsapp === true,
  };
  const bad = [];
  if (f.name.length < 2) bad.push('name');
  if (f.business.length < 2) bad.push('business');
  if (!f.phone) bad.push('phone');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) bad.push('email');
  if (!VERTICALS[f.vertical]) bad.push('vertical');
  if (!EMIRATES[f.emirate]) bad.push('emirate');
  if (f.branches && !BRANCHES[f.branches]) bad.push('branches');
  if (!TIMES[f.time]) bad.push('time');
  return { f, bad };
}

/** Dubai time, for people reading the email. */
const dubai = (d) => d.toLocaleString('en-GB', { timeZone: 'Asia/Dubai', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function buildEmail(f, now) {
  const at = new Date(now);
  const consentLine = (ch, yes) => (yes
    ? `Yes. Ticked ${dubai(at)} UAE time, on the ${f.lang === 'ar' ? 'Arabic' : 'English'} page: "${CONSENT_WORDS[ch][f.lang]}"`
    : 'No (box not ticked). Do not add them to marketing on this channel.');
  const rows = [
    ['Name', f.name],
    ['Business', f.business],
    ['Type', VERTICALS[f.vertical][0]],
    ['Emirate', EMIRATES[f.emirate]],
    ['Branches', f.branches ? BRANCHES[f.branches] : 'Not given'],
    ['Mobile', showPhone(f.phone)],
    ['Email', f.email],
    ['Best time to call', TIMES[f.time] + ' (UAE time)'],
    ['Language', f.lang === 'ar' ? 'Arabic: call and write in Arabic' : 'English'],
    ['Sent', dubai(at) + ' UAE time'],
  ];
  const consent = [
    ['Marketing by email', consentLine('email', f.consentEmail)],
    ['Marketing on WhatsApp', consentLine('whatsapp', f.consentWhatsapp)],
  ];
  const lead = {
    source: 'website', centreName: f.business, vertical: f.vertical, emirate: f.emirate,
    branches: f.branches ? Number(f.branches) : null, package: 'not_sure',
    owner: { name: f.name, phone: f.phone, email: f.email, lang: f.lang },
    callTime: f.time,
    consent: {
      email: f.consentEmail ? { status: 'yes', atMs: now, by: 'owner', wording: CONSENT_WORDS.email[f.lang] } : { status: 'no', atMs: now, by: 'owner' },
      whatsapp: f.consentWhatsapp ? { status: 'yes', atMs: now, by: 'owner', wording: CONSENT_WORDS.whatsapp[f.lang] } : { status: 'no', atMs: now, by: 'owner' },
    },
  };
  const subject = `Call back: ${f.business} · ${EMIRATES[f.emirate]} · ${TIMES[f.time].split(',')[0].toLowerCase()}`;
  const tr = (r) => `<tr><td style="padding:8px 16px 8px 0;color:#6E6E78;vertical-align:top;white-space:nowrap">${esc(r[0])}</td><td style="padding:8px 0;color:#0B0B0F">${esc(r[1])}</td></tr>`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.5;max-width:620px">
<p style="font-size:18px;font-weight:600;margin:0 0 4px">${esc(f.name)} from ${esc(f.business)} would like a call.</p>
<p style="margin:0 0 16px;color:#3A3A42">Call <a href="tel:${esc(f.phone)}">${esc(showPhone(f.phone))}</a>, ${esc(TIMES[f.time].toLowerCase())}, within one working day. That is what the website promised.</p>
<table style="border-collapse:collapse">${rows.map(tr).join('')}</table>
<p style="font-weight:600;margin:20px 0 4px">Marketing consent</p>
<table style="border-collapse:collapse">${consent.map(tr).join('')}</table>
<p style="margin:20px 0 4px;color:#6E6E78;font-size:13px">Log this as a lead (source: website) before you call. Reply to this email to write to them directly.</p>
</div>`;
  const text = [
    `${f.name} from ${f.business} would like a call.`,
    `Call ${showPhone(f.phone)}, ${TIMES[f.time].toLowerCase()}, within one working day.`,
    '',
    ...rows.map((r) => `${r[0]}: ${r[1]}`),
    '',
    'Marketing consent',
    ...consent.map((r) => `${r[0]}: ${r[1]}`),
    '',
    'Log this as a lead (source: website) before you call.',
  ].join('\n');
  return { subject, html, text, lead };
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

module.exports = async function handler(req, res) {
  const send = (code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); };
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(405, { ok: false, error: 'method' }); }

  const origin = req.headers.origin || '';
  if (!ALLOWED_ORIGINS.some((re) => re.test(origin))) return send(403, { ok: false, error: 'origin' });

  let b;
  try { b = await readBody(req); } catch (e) { return send(400, { ok: false, error: 'body' }); }
  if (!b || typeof b !== 'object') return send(400, { ok: false, error: 'body' });

  const now = Date.now();
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip, now)) return send(429, { ok: false, error: 'busy' });

  // Spam traps. A bot fills the hidden field or submits instantly: it is told "ok" and nothing is sent.
  const elapsed = Number(b.elapsedMs);
  if (clean(b.website, 200) || !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return send(200, { ok: true });

  const { f, bad } = validate(b);
  if (bad.length) return send(422, { ok: false, error: 'fields', fields: bad });

  const key = process.env.RESEND_API_KEY;
  if (!key) return send(503, { ok: false, error: 'not_configured' });

  const mail = buildEmail(f, now);
  const idem = clean(b.requestId, 64).replace(/[^a-zA-Z0-9-]/g, '');
  const pooled = toPool(mail.lead); // runs alongside the email; never fails the form
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(idem ? { 'Idempotency-Key': 'callback-' + idem } : {}) },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: f.email, subject: mail.subject, html: mail.html, text: mail.text, tags: [{ name: 'type', value: 'callback' }] }),
      signal: AbortSignal.timeout(8000),
    });
    await pooled;
    if (!r.ok) {
      console.error('callback: email provider said', r.status, (await r.text()).slice(0, 300));
      return send(502, { ok: false, error: 'send' });
    }
    await confirmToOwner(f, key, idem); // only after sales@ has it, so she is never told "booked" when it wasn't
    return send(200, { ok: true });
  } catch (e) {
    await pooled;
    console.error('callback: email provider unreachable', e && e.name);
    return send(502, { ok: false, error: 'send' });
  }
};

// ---------- confirmation email to the person who asked for the call ----------
// A service email (she asked for the call), so it needs no marketing tick.
// Arabic: feminine by default, masculine for dental and barber (project rule).
const CONFIRM_FROM = process.env.CONFIRM_FROM || 'Loopdesk <sales@getloopdesk.com>';
const WHEN = {
  en: { morning: 'in the morning, between 10am and 12pm', afternoon: 'in the afternoon, between 12pm and 4pm', evening: 'in the evening, between 4pm and 8pm', any: 'between 10am and 8pm' },
  ar: { morning: 'صباحًا بين 10 و12', afternoon: 'ظهرًا بين 12 و4', evening: 'مساءً بين 4 و8', any: 'بين 10 صباحًا و8 مساءً' },
};
/** +971501234567 -> +971 50 123 4567 (other countries unchanged) */
const showPhone = (p) => (/^\+9715\d{8}$/.test(p) ? `+971 ${p.slice(4, 6)} ${p.slice(6, 9)} ${p.slice(9)}` : p);

const SITE = 'https://getloopdesk.com';
const WHEN_SHORT = {
  en: { morning: 'Morning · 10am to 12pm', afternoon: 'Afternoon · 12pm to 4pm', evening: 'Evening · 4pm to 8pm', any: 'Any time · 10am to 8pm' },
  ar: { morning: 'صباحًا · من 10 إلى 12', afternoon: 'ظهرًا · من 12 إلى 4', evening: 'مساءً · من 4 إلى 8', any: 'أيّ وقت · من 10 صباحًا إلى 8 مساءً' },
};

/** Words for the confirmation. Arabic: feminine by default, masculine for dental and barber. */
function confirmCopy(f) {
  const first = f.name.split(' ')[0];
  const phone = showPhone(f.phone);
  if (f.lang !== 'ar') {
    return {
      dir: 'ltr', lang: 'en', first, phone,
      subject: `${first}, your call is in our diary`,
      preheader: `We'll call ${phone}, ${WHEN.en[f.time]}. Keep your price list handy.`,
      kicker: 'CALL BOOKED', ticket: 'YOUR CALL WITH LOOPDESK',
      title: `It's a date, ${first}.`,
      intro: "Thank you for asking us to call. Here's your little ticket.",
      tWhen: 'When', when: WHEN_SHORT.en[f.time] + ' (UAE)', whenNote: 'Within one working day',
      tPhone: "We'll call", tWho: 'Who calls', who: 'The Loopdesk team',
      bringT: 'Bring one thing to the call',
      bring: "Your price list. We'll show you Loopdesk with your own services and prices, so you see your clients coming back, not someone else's.",
      stepsT: 'What happens next',
      steps: [['We call you', 'At the time you picked. About 20 minutes.'], ['You see it with your services', 'Your treatments, your prices, your team.'], ['You decide', 'No commitment, no card, no pressure.']],
      cta: 'Need another time? Reply here', ctaSubject: 'Another time for my call',
      ps: 'P.S. Your clients have a rhythm. So do we: we call when we say we will.',
      sign: 'Speak soon,', team: 'The Loopdesk team',
      foot: 'You are getting this because you asked us to call you on getloopdesk.com. Just this one email, unless you ticked a box for more.',
      privacy: 'Privacy policy',
    };
  }
  const m = f.vertical === 'dental' || f.vertical === 'barber';
  const k = m ? 'ك' : 'كِ';
  return {
    dir: 'rtl', lang: 'ar', first, phone,
    subject: `${first}، اتصالنا مسجَّل في جدولنا`,
    preheader: `سنتصل على الرقم ⁦${phone}⁩ ${WHEN.ar[f.time]}. ${m ? 'اجعل' : 'اجعلي'} قائمة الأسعار قريبة.`,
    kicker: 'تمّ الحجز', ticket: 'موعد الاتصال مع Loopdesk',
    title: `موعدنا ثابت يا ${first}.`,
    intro: m ? 'شكرًا لطلبك. هذه تذكرتك الصغيرة.' : 'شكرًا لطلبكِ. هذه تذكرتكِ الصغيرة.',
    tWhen: 'متى', when: WHEN_SHORT.ar[f.time] + ' (بتوقيت الإمارات)', whenNote: 'خلال يوم عمل واحد',
    tPhone: 'سنتصل على', tWho: 'من يتصل', who: 'فريق Loopdesk',
    bringT: m ? 'أحضر معك شيئًا واحدًا' : 'أحضري معكِ شيئًا واحدًا',
    bring: m ? 'قائمة أسعارك. سنريك Loopdesk بخدماتك وأسعارك أنت، لترى عملاءك يعودون إليك، لا عملاء غيرك.' : 'قائمة أسعاركِ. سنريكِ Loopdesk بخدماتكِ وأسعاركِ أنتِ، لتري عملاءكِ يعودون إليكِ، لا عملاء غيركِ.',
    stepsT: 'ماذا بعد؟',
    steps: m
      ? [['نتصل بك', 'في الوقت الذي اخترته. نحو 20 دقيقة.'], ['تراها بخدماتك', 'خدماتك وأسعارك وفريقك.'], ['والقرار لك', 'بلا التزام، وبلا بطاقة، وبلا إلحاح.']]
      : [['نتصل بكِ', 'في الوقت الذي اخترتِه. نحو 20 دقيقة.'], ['ترينها بخدماتكِ', 'خدماتكِ وأسعاركِ وفريقكِ.'], ['والقرار لكِ', 'بلا التزام، وبلا بطاقة، وبلا إلحاح.']],
    cta: m ? 'يناسبك وقت آخر؟ ردّ هنا' : 'يناسبكِ وقت آخر؟ ردّي هنا', ctaSubject: 'وقت آخر لاتصالي',
    ps: `ملاحظة: لعملائ${k} إيقاع، ولنا إيقاعنا أيضًا: نتصل حين نَعِد.`,
    sign: 'إلى اللقاء قريبًا،', team: 'فريق Loopdesk',
    foot: m ? 'وصلتك هذه الرسالة لأنك طلبت أن نتصل بك عبر getloopdesk.com. هذه رسالة واحدة فقط، إلا إن اخترت أن تصلك رسائل أخرى.' : 'وصلتكِ هذه الرسالة لأنكِ طلبتِ أن نتصل بكِ عبر getloopdesk.com. هذه رسالة واحدة فقط، إلا إن اخترتِ أن تصلكِ رسائل أخرى.',
    privacy: 'سياسة الخصوصية',
  };
}

/** A premium, table-based email (works in Gmail, Outlook and Apple Mail), plus a plain-text twin. */
function buildConfirm(f) {
  const c = confirmCopy(f);
  const rtl = c.dir === 'rtl';
  const start = rtl ? 'right' : 'left';
  const end = rtl ? 'left' : 'right';
  const font = rtl ? "Tahoma,'Geeza Pro','Segoe UI',Arial,sans-serif" : "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
  const ink = '#0B0B0F', muted = '#6E6E78', line = '#E6E6EA', soft = '#F5F5F7', rose = '#D9466E', roseSoft = '#FBE8EE';
  const e = esc;
  const ltr = (t) => `<span dir="ltr" style="unicode-bidi:isolate">${e(t)}</span>`;
  const name = (t) => `<span dir="auto" style="unicode-bidi:isolate">${e(t)}</span>`;
  const title = rtl ? e(c.title).replace(e(c.first), name(c.first)) : e(c.title);
  const mailto = `mailto:${TO}?subject=${encodeURIComponent(c.ctaSubject)}`;
  const row = (label, value, note) => `<tr><td style="padding:14px 0;border-top:1px solid #26262D;color:#A1A1AA;font-size:13px;width:34%;vertical-align:top;text-align:${start}">${e(label)}</td><td style="padding:14px 0;border-top:1px solid #26262D;color:#F5F5F7;font-size:16px;font-weight:600;text-align:${start}">${value}${note ? `<div style="font-size:13px;font-weight:400;color:#A1A1AA;margin-top:2px">${e(note)}</div>` : ''}</td></tr>`;
  const step = (s, i) => `<tr><td style="width:40px;vertical-align:top;padding:0 0 16px"><div style="width:28px;height:28px;line-height:28px;border-radius:14px;background:${soft};color:${ink};font-size:13px;font-weight:700;text-align:center">${i + 1}</div></td><td style="vertical-align:top;padding:3px 0 16px;text-align:${start}"><div style="font-size:15px;font-weight:600;color:${ink}">${e(s[0])}</div><div style="font-size:14px;color:${muted};margin-top:2px">${e(s[1])}</div></td></tr>`;
  const html = `<!doctype html><html lang="${c.lang}" dir="${c.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${e(c.subject)}</title></head>
<body style="margin:0;padding:0;background:${soft};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${e(c.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${soft}"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${c.dir}" style="max-width:560px;font-family:${font};color:${ink}">
<tr><td style="padding:0 8px 20px;text-align:${start}"><a href="${SITE}" style="text-decoration:none"><img src="${SITE}/img/email-logo.png" width="141" height="32" alt="Loopdesk" style="display:inline-block;border:0;width:141px;height:32px"></a></td></tr>
<tr><td style="background:#FFFFFF;border-radius:24px;padding:36px 28px 28px;text-align:${start}">
  <div style="display:inline-block;background:${roseSoft};color:${rose};font-size:12px;font-weight:700;letter-spacing:${rtl ? '0' : '.08em'};border-radius:999px;padding:5px 12px">● ${e(c.kicker)}</div>
  <h1 style="margin:18px 0 8px;font-size:32px;line-height:1.15;font-weight:700;letter-spacing:${rtl ? '0' : '-.02em'};color:${ink}">${title}</h1>
  <p style="margin:0 0 24px;font-size:17px;line-height:1.5;color:#3A3A42">${e(c.intro)}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${ink};border-radius:18px"><tr><td style="padding:8px 22px 8px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${c.dir}">
      <tr><td colspan="2" style="padding:0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${c.dir}"><tr><td style="padding:14px 0 12px;text-align:${start};color:#F5F5F7;font-size:13px;font-weight:700;letter-spacing:${rtl ? '0' : '.08em'}">${e(c.ticket)}</td><td style="padding:14px 0 12px;text-align:${end}"><span style="display:inline-block;width:10px;height:10px;border-radius:5px;background:${rose}"></span></td></tr></table></td></tr>
      ${row(c.tWhen, e(c.when), c.whenNote)}
      ${row(c.tPhone, ltr(c.phone))}
      ${row(c.tWho, e(c.who))}
    </table>
  </td></tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;border:1px solid ${line};border-radius:16px"><tr><td style="padding:18px 20px;text-align:${start}">
    <div style="font-size:15px;font-weight:700;color:${ink}">${e(c.bringT)}</div>
    <div style="font-size:15px;line-height:1.55;color:#3A3A42;margin-top:4px">${e(c.bring)}</div>
  </td></tr></table>
  <div style="font-size:13px;font-weight:700;color:${muted};margin:28px 0 14px;letter-spacing:${rtl ? '0' : '.06em'}">${e(rtl ? c.stepsT : c.stepsT.toUpperCase())}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${c.dir}">${c.steps.map(step).join('')}</table>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px"><tr><td style="background:${ink};border-radius:999px"><a href="${mailto}" style="display:inline-block;padding:14px 24px;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;font-family:${font}">${e(c.cta)}</a></td></tr></table>
  <p style="margin:28px 0 0;font-size:15px;line-height:1.5;color:${ink}">${e(c.sign)}<br><b>${e(c.team)}</b></p>
  <p style="margin:18px 0 0;padding:14px 16px;background:${roseSoft};border-radius:14px;font-size:14px;line-height:1.5;color:#7A2440">${e(c.ps)}</p>
</td></tr>
<tr><td style="padding:22px 12px 0;text-align:center;font-size:12px;line-height:1.6;color:${muted}">${e(c.foot)}<br><a href="${SITE}" style="color:${muted}">getloopdesk.com</a> · <a href="${SITE}/privacy" style="color:${muted}">${e(c.privacy)}</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    c.title, '', c.intro, '',
    `${c.tWhen}: ${c.when} (${c.whenNote})`, `${c.tPhone}: ${c.phone}`, `${c.tWho}: ${c.who}`, '',
    `${c.bringT}: ${c.bring}`, '',
    c.stepsT, ...c.steps.map((s, i) => `${i + 1}. ${s[0]}: ${s[1]}`), '',
    `${c.cta}: ${TO}`, '', c.sign, c.team, '', c.ps, '', c.foot,
  ].join('\n');
  return { subject: c.subject, html, text };
}

async function confirmToOwner(f, key, idem) {
  try {
    const m = buildConfirm(f);
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(idem ? { 'Idempotency-Key': 'confirm-' + idem } : {}) },
      body: JSON.stringify({ from: CONFIRM_FROM, to: [f.email], reply_to: TO, subject: m.subject, html: m.html, text: m.text, tags: [{ name: 'type', value: 'callback_confirm' }] }),
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) console.error('callback: confirmation email said', r.status, (await r.text()).slice(0, 200));
  } catch (e) {
    console.error('callback: confirmation email failed', e && e.name);
  }
}

/** Adds the request to the platform's open pool. 201 new, 200 already a lead or centre. Errors are logged, never shown. */
async function toPool(lead) {
  const url = process.env.LEAD_INTAKE_URL;
  const secret = process.env.LEAD_INTAKE_SECRET;
  if (!url || !secret) return 'off';
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-loopdesk-intake-key': secret },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(5000),
    });
    if (r.status !== 201 && r.status !== 200) console.error('callback: lead intake said', r.status, (await r.text()).slice(0, 200));
    return r.status;
  } catch (e) {
    console.error('callback: lead intake unreachable', e && e.name);
    return 'error';
  }
}

module.exports.validate = validate;
module.exports.toPool = toPool;
module.exports.buildConfirm = buildConfirm;
module.exports.buildEmail = buildEmail;
module.exports.normalisePhone = normalisePhone;
module.exports.CONSENT_WORDS = CONSENT_WORDS;
