# getloopdesk.com

Holding website for Loopdesk. Static site deployed on Vercel.

- `index.html`: the whole site (EN/AR; styles and script inline)
- `privacy.html`: privacy policy, served at /privacy (EN/AR)
- `terms.html`: terms of service, served at /terms (EN/AR)
- `vercel.json`: clean URLs, so /privacy and /terms work without .html
- The footer is copied into privacy.html and terms.html (links prefixed with /): change all three together.
- `img/`: photos

Edit `index.html` and commit; Vercel publishes automatically.

## Chat with Romy
The "Chat with Romy" button (in Book a demo) and the floating "Ask Romy" button open WhatsApp with Loopdesk's own number and a first message ready. Both stay hidden until `ROMY_NUMBER` (top of the script in index.html) is set to the number, digits only with 971. Set it only once the number is live on the WhatsApp Business Platform and `npm run sales-line` (platform repo) is answering.
