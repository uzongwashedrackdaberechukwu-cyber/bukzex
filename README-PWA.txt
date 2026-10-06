BUKZEX PWA INSTALL BUTTON UPDATE

Replace the existing pwa-setup.mjs with this package, then run from the BukzEx project root:
  node pwa-setup.mjs
  npm run build

Commit and push the changed index.html and pwa-setup.mjs. Once Cloudflare finishes deploying, share this link:
  https://bukzex.shadexgoltd.com/?install=1

The page shows an Install BukzEx button. The visitor taps it and confirms the browser install prompt. If their browser does not expose the prompt yet, the page shows the Chrome menu instructions.
