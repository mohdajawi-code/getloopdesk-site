# getloopdesk.com

Holding website for Loopdesk. Static site deployed on Vercel.

- `index.html`: the whole site (EN/AR; styles and script inline)
- `privacy.html`: privacy policy, served at /privacy (EN/AR)
- `terms.html`: terms of service, served at /terms (EN/AR)
- `vercel.json`: clean URLs, so /privacy and /terms work without .html
- `pricing.html`: pricing, served at /pricing (EN/AR). Draft bar and dashed `.tbc` underlines mark unconfirmed prices; remove both before going live.
- The footer is copied into privacy.html, terms.html and pricing.html (links prefixed with /): change all four together.
- `img/`: photos

Edit `index.html` and commit; Vercel publishes automatically.
