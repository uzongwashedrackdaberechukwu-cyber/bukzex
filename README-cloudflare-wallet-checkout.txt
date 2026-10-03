BUKZEX WALLET CHECKOUT ON CLOUDFLARE WORKERS

This update moves checkout off Firebase Cloud Functions. Firebase can remain on the free Spark plan. The Cloudflare Worker already used for catalogues will securely verify BukzEx sign-in, read the saved BukzEx price, debit the wallet once, submit the order to ShadexGoLtd, and save the result to the customer's BukzEx Stack.

IMPORTANT
- Do not upgrade Firebase billing for this setup.
- Do not put the Firebase key or ShadexGoLtd API key in source files, GitHub, or ChatGPT.
- Keep the Firebase service-account JSON in Downloads only and send it to Cloudflare as a secret using the command below.
- The Cloudflare Worker Free plan has a daily request limit. It is not a promise of unlimited service.

ONE-TIME SETUP

1. In Firebase Console, open project bukzex, then Project settings > Service accounts > Firebase Admin SDK > Generate new private key. Save the downloaded JSON file in Downloads and rename it:
   bukzex-worker-service-account.json

2. In Termux, from the BukzEx project, run:
   cd ~/bukzex/bukzex-shadex-catalog-worker
   npx -y wrangler@latest secret put FIREBASE_SERVICE_ACCOUNT_JSON < /storage/emulated/0/Download/bukzex-worker-service-account.json

   This sends the file directly to Cloudflare as a hidden secret. Do not open it in ChatGPT or commit it to GitHub. You may delete the downloaded key after Wrangler reports success.

3. The worker already has SHADEX_API_KEY if its existing catalogue routes are working. Do not overwrite that secret unless ShadexGoLtd issued a replacement. The key must have these API scopes enabled for checkout and stack refresh:
   vtu:write, bills:write, virtual_sms:write, social_boost:write, marketplace:write, orders:read

DEPLOY THE WORKER

After replacing the project files from this update ZIP, run:
   cd ~/bukzex/bukzex-shadex-catalog-worker
   npx -y wrangler@latest deploy

The Worker name must remain bukzex-shadex-catalog so the BukzEx app keeps using its current URL.

DEPLOY THE WEBSITE

From the project root, run:
   cd ~/bukzex
   npm run build
   git add src/services/api.js src/services/shadexCatalog.js bukzex-shadex-catalog-worker/src/index.js README-cloudflare-wallet-checkout.txt
   git commit -m "Move BukzEx wallet checkout to Cloudflare Worker"
   git push

If the build succeeds and the push succeeds, GitHub's existing site deployment will update the BukzEx website. Firebase Functions are not part of this deployment. Firestore rules may still be deployed on Spark with:
   cd ~/bukzex
   npx -y firebase-tools@latest deploy --only firestore:rules

New Worker routes:
- POST /api/checkout/purchase
- POST /api/checkout/order-refresh

Existing catalogue GET routes remain available.
