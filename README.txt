BukzEx ShadexGoLtd catalogue batch

This update connects the BukzEx service pages to ShadexGoLtd catalogue routes:
- VTU airtime and data
- Bills (electricity and cable)
- Marketplace
- Virtual SMS / OTP
- Social Boost

Orders are not submitted to ShadexGoLtd and this update does not debit wallets. The non-VTU pages are catalogue-only. The current ShadexGoLtd Marketplace catalogue is empty, and its OTP catalogue returned an upstream server error when checked on 2026-10-02; the app shows those states rather than placeholder products.

Install in Termux:
  cd ~/bukzex
  unzip -o ~/storage/downloads/bukzex-shadex-catalogue-batch.zip -d .
  npm run build

The public Worker URL is set in src/services/shadexCatalog.js. If the workers.dev address differs from your Cloudflare Overview address, replace WORKER_URL in that file with your exact address.
