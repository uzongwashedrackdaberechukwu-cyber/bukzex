BUKZEX ADMIN CATALOGUE SETTINGS UPDATE

This update connects Admin > Services to the ShadexGoLtd catalogue Worker.
The admin can publish/hide each available service category and set a BukzEx
percentage markup. Saving writes the settings to Firebase services documents.
Customer Services then shows active categories and displays provider prices
with the saved markup added.

Install by extracting this ZIP in the root of ~/bukzex and choosing overwrite.
Then run npm run build. If it succeeds, commit and push the changed files so
the BukzEx Worker deploys the update.

Notes:
- Marketplace is disabled when the provider catalogue is empty.
- OTP is disabled while ShadexGoLtd's OTP catalogue endpoint is failing.
- This update sets published status and display pricing only. VTU orders still
  go to the existing pending-for-admin-review flow; automatic provider order
  submission and wallet charging are not enabled by this update.
