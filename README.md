# getloopdesk.com

Holding website for Loopdesk. Static site deployed on Vercel.

- `index.html`: the whole site (EN/AR; styles and script inline)
- `privacy.html`: privacy policy, served at /privacy (EN/AR)
- `terms.html`: terms of service, served at /terms (EN/AR)
- `vercel.json`: clean URLs, so /privacy and /terms work without .html
- The footer is copied into privacy.html and terms.html (links prefixed with /): change all three together.
- `api/callback.js`: the call-back form's server side (Vercel function). Emails each request to sales@ through Resend. Needs `RESEND_API_KEY` in Vercel's environment variables; until then the form offers "send by email instead". With `LEAD_INTAKE_URL` and `LEAD_INTAKE_SECRET` also set, each request is added to the platform's sales open pool (unassigned); an intake error never fails the form.
- The tick-box wording in the form is copied in `api/callback.js` (`CONSENT_WORDS`) so the email records it word for word: change both together.
- `img/`: photos

Edit `index.html` and commit; Vercel publishes automatically.

## Chat with Loopdesk on WhatsApp
"Chat with us on WhatsApp" (in the Book a demo card on /, /romy and /sinan) and the floating "Ask Loopdesk" button open WhatsApp with Loopdesk's sales number (+971 50 113 2840) and a first message that fits the page (Romy on /romy, Sinan on /sinan). Both stay hidden until `CHAT_LIVE` (bottom of `site.js`) is `true`. Flip it only once the number is registered on the WhatsApp Business Platform and the platform's `npm run sales-line` is answering, or owners would write to a number nobody reads.
