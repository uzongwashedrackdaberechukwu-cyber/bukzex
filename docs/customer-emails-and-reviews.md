# BukzEx customer emails and service reviews

This feature is implemented only inside the BukzEx application, Cloudflare Worker and BukzEx Firestore project.

## Behaviour

- An administrator-confirmed wallet deposit is credited by the BukzEx Worker and creates a BukzEx confirmation email job.
- A paid service purchase creates a BukzEx customer check-in email scheduled for 48 hours later.
- The BukzEx Worker cron processes due email jobs every five minutes.
- Customers can rate eligible paid purchases from their BukzEx purchase history.
- Reviews are verified against the customer's own BukzEx order.
- Reviews remain private until a BukzEx administrator approves them.
- Only approved reviews rated four or five stars, with customer publication consent, appear on the BukzEx public landing page.
- Customer emails and account details are never exposed in public reviews.

## Required BukzEx-only configuration

Set an independent Resend API key and a sender address verified for BukzEx:

```sh
wrangler secret put BUKZEX_RESEND_API_KEY
wrangler secret put BUKZEX_FROM_EMAIL
```

Do not reuse the ShadexGoLtd email secret or sender configuration.

## Rollout

1. Deploy the BukzEx Firestore indexes and rules:
   `firebase deploy --only firestore:indexes,firestore:rules`
2. Set the two BukzEx-only Worker secrets above.
3. Deploy the BukzEx Worker using `bukzex-shadex-catalog-worker/wrangler.jsonc`.
4. Build and deploy the BukzEx frontend.
5. Confirm an administrator-confirmed test deposit queues one confirmation email, a paid test purchase queues a check-in for 48 hours later, and an approved consented positive review appears on the BukzEx landing page.

No ShadexGoLtd database, API, email credentials, reviews or customer records are used by this feature.
