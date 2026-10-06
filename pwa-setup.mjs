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

const scripts = `
    <script id="bukzex-sw-registration">
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch((error) => console.error("BukzEx offline setup failed", error)));
      }
    </script>
    <style id="bukzex-install-style">
      #bukzex-install-button[hidden] { display: none !important; }
      #bukzex-install-button { position: fixed; z-index: 2147483000; left: 50%; bottom: calc(84px + env(safe-area-inset-bottom)); transform: translateX(-50%); border: 0; border-radius: 999px; padding: 14px 22px; background: #f3d27a; color: #071827; box-shadow: 0 8px 28px #0005; font: 700 16px system-ui, sans-serif; cursor: pointer; }
    </style>
    <button id="bukzex-install-button" type="button" hidden>Install BukzEx</button>
    <script id="bukzex-install-handler">
      (() => {
        const button = document.getElementById("bukzex-install-button");
        const installLink = new URLSearchParams(location.search).get("install") === "1";
        const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
        if (standalone) return;
        let installPrompt = null;
        if (installLink) button.hidden = false;
        window.addEventListener("beforeinstallprompt", (event) => {
          event.preventDefault();
          installPrompt = event;
          button.hidden = false;
        });
        button.addEventListener("click", async () => {
          if (!installPrompt) {
            alert("To install BukzEx, open Chrome’s ⋮ menu and choose Install app or Add to Home screen.");
            return;
          }
          await installPrompt.prompt();
          const choice = await installPrompt.userChoice;
          if (choice.outcome === "accepted") button.hidden = true;
          installPrompt = null;
        });
        window.addEventListener("appinstalled", () => { button.hidden = true; });
      })();
    </script>
`;
for (const id of ["bukzex-sw-registration", "bukzex-install-handler"]) {
  const pattern = new RegExp(`<script id="${id}">[\\s\\S]*?<\\/script>\\s*`, "g");
  html = html.replace(pattern, "");
}
html = html.replace(/<style id="bukzex-install-style">[\s\S]*?<\/style>\s*/g, "");
html = html.replace(/<button id="bukzex-install-button"[\s\S]*?<\/button>\s*/g, "");
if (!html.includes("</body>")) throw new Error("Could not find </body> in index.html");
html = html.replace("</body>", `${scripts}  </body>`);
await writeFile(indexPath, html);
console.log("BukzEx PWA is ready. Share https://bukzex.shadexgoltd.com/?install=1 to show the install button.");
