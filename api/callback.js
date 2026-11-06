// Call-back requests from the website form (#demo on index.html).
// Checks the request, then emails it to the sales inbox through Resend.
//
// Vercel environment variables (Project settings > Environment Variables):
//   RESEND_API_KEY   required. Until it is set, the form offers "send by email instead".
//   CALLBACK_TO      optional, default sales@getloopdesk.com
//   CALLBACK_FROM    optional, default "Loopdesk website <website@getloopdesk.com>"
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
    ? `YES, ticked ${at.toISOString()} on the ${f.lang === 'ar' ? 'Arabic' : 'English'} page. Words: "${CONSENT_WORDS[ch][f.lang]}"`
    : 'No (box not ticked). Do not add them to marketing on this channel.');
  const rows = [
    ['Name', f.name],
    ['Business', f.business],
    ['Type', VERTICALS[f.vertical][0]],
    ['Emirate', EMIRATES[f.emirate]],
    ['Branches', f.branches ? BRANCHES[f.branches] : 'Not given'],
    ['Mobile', f.phone],
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
<p style="margin:0 0 16px;color:#3A3A42">Call <a href="tel:${esc(f.phone)}">${esc(f.phone)}</a>, ${esc(TIMES[f.time].toLowerCase())}, within one working day. That is what the website promised.</p>
<table style="border-collapse:collapse">${rows.map(tr).join('')}</table>
<p style="font-weight:600;margin:20px 0 4px">Marketing consent</p>
<table style="border-collapse:collapse">${consent.map(tr).join('')}</table>
<p style="margin:20px 0 4px;color:#6E6E78;font-size:13px">Log this as a lead (source: website) before you call. Reply to this email to write to them directly.</p>
<pre style="font-size:11px;color:#6E6E78;white-space:pre-wrap">lead-json: ${esc(JSON.stringify(lead))}</pre>
</div>`;
  const text = [
    `${f.name} from ${f.business} would like a call.`,
    `Call ${f.phone}, ${TIMES[f.time].toLowerCase()}, within one working day.`,
    '',
    ...rows.map((r) => `${r[0]}: ${r[1]}`),
    '',
    'Marketing consent',
    ...consent.map((r) => `${r[0]}: ${r[1]}`),
    '',
    'Log this as a lead (source: website) before you call.',
    '',
    'lead-json: ' + JSON.stringify(lead),
  ].join('\n');
  return { subject, html, text };
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
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(idem ? { 'Idempotency-Key': 'callback-' + idem } : {}) },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: f.email, subject: mail.subject, html: mail.html, text: mail.text, tags: [{ name: 'type', value: 'callback' }] }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      console.error('callback: email provider said', r.status, (await r.text()).slice(0, 300));
      return send(502, { ok: false, error: 'send' });
    }
    return send(200, { ok: true });
  } catch (e) {
    console.error('callback: email provider unreachable', e && e.name);
    return send(502, { ok: false, error: 'send' });
  }
};

module.exports.validate = validate;
module.exports.buildEmail = buildEmail;
module.exports.normalisePhone = normalisePhone;
module.exports.CONSENT_WORDS = CONSENT_WORDS;
