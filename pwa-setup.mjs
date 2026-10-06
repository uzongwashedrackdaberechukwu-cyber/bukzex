import { readFile, writeFile } from "node:fs/promises";

const indexPath = new URL("./index.html", import.meta.url);
let html = await readFile(indexPath, "utf8");
const headTags = `
    <meta name="theme-color" content="#071827">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="BukzEx">
    <link rel="manifest" href="/manifest.webmanifest">
    <link rel="apple-touch-icon" href="/icons/icon-192.png">
`;
if (!html.includes('rel="manifest"')) {
  if (!html.includes("</head>")) throw new Error("Could not find </head> in index.html");
  html = html.replace("</head>", `${headTags}  </head>`);
}
const registration = `
    <script id="bukzex-sw-registration">
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch((error) => console.error("BukzEx offline setup failed", error)));
      }
    </script>
`;
if (!html.includes('id="bukzex-sw-registration"')) {
  if (!html.includes("</body>")) throw new Error("Could not find </body> in index.html");
  html = html.replace("</body>", `${registration}  </body>`);
}
await writeFile(indexPath, html);
console.log("BukzEx PWA tags added to index.html. Manifest, icons and service worker are in public/.");
