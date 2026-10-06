BUKZEX PWA SETUP

From the BukzEx project root, run:
  node pwa-setup.mjs
  npm run build

Then commit and push the updated index.html, public/manifest.webmanifest, public/sw.js, public/icons/, pwa-setup.mjs and README-PWA.txt.

The service worker caches the app shell and same-origin static assets for offline display. Wallet, sign-in, checkout, orders, catalogue/API requests, and Firebase still need an internet connection.
