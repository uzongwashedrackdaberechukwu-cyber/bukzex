DEPLOY THE BUKZEX WORKER FROM GITHUB ACTIONS (ANDROID-FRIENDLY)

Wrangler cannot run directly in Termux on this Android phone because its workerd dependency does not support Android ARM64. This GitHub Actions workflow runs Wrangler on a Linux runner instead. No Firebase billing upgrade is needed.

ONE-TIME CLOUDFLARE SECRET

1. In Firebase Console, open project bukzex > Project settings > Service accounts > Generate new private key. Download the JSON key to your phone. Keep it private; do not put it in GitHub or send it in chat.
2. In Cloudflare, open Workers & Pages > bukzex-shadex-catalog > Settings > Variables and Secrets > Add secret.
3. Enter the name FIREBASE_SERVICE_ACCOUNT_JSON, paste the full JSON key as its value, and save it.
4. Keep the existing SHADEX_API_KEY secret in this Worker. It must have the ShadexGoLtd write scopes for VTU, bills, OTP, social boost, and marketplace, plus orders:read.

ONE-TIME GITHUB ACTION SECRETS

1. In Cloudflare, open My Profile > API Tokens > Create Token. Choose the Edit Cloudflare Workers template and restrict it to the account that owns the BukzEx Worker. Copy the token.
2. In Cloudflare Workers & Pages, open the BukzEx Worker overview and copy the Account ID.
3. In the BukzEx GitHub repository, open Settings > Secrets and variables > Actions. Add two repository secrets with these exact names:
   CLOUDFLARE_API_TOKEN
   CLOUDFLARE_ACCOUNT_ID
   Paste the matching value into each. Never put either value in a source file or chat.

DEPLOY

From the BukzEx project root in Termux, after replacing the workflow file from the update ZIP, run:
   git add .github/workflows/deploy-bukzex-worker.yml README-worker-deploy-android.txt
   git commit -m "Deploy BukzEx Worker from GitHub Actions"
   git push

GitHub Actions will run the deployment on Linux. Open the Actions tab in GitHub and check the workflow named Deploy BukzEx Cloudflare Worker. A green check mark means the Worker deployed. Do not run npx wrangler in Termux.
