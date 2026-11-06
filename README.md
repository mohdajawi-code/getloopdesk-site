# getloopdesk.com

Holding website for Loopdesk. Static site deployed on Vercel.

- `index.html`: the whole site (EN/AR; styles and script inline)
- `privacy.html`: privacy policy, served at /privacy (EN/AR)
- `terms.html`: terms of service, served at /terms (EN/AR)
- `vercel.json`: clean URLs, so /privacy and /terms work without .html
- The footer is copied into privacy.html and terms.html (links prefixed with /): change all three together.
- `api/callback.js`: the call-back form's server side (Vercel function). Emails each request to sales@ through Resend. Needs `RESEND_API_KEY` in Vercel's environment variables; until then the form offers "send by email instead".
- The tick-box wording in the form is copied in `api/callback.js` (`CONSENT_WORDS`) so the email records it word for word: change both together.
- `img/`: photos

Edit `index.html` and commit; Vercel publishes automatically.
