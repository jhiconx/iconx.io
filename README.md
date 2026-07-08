# Iconx.io Vercel Contact Capture

## Files
- `index.html` — updated website with ChatGPT-style prompt capture
- `api/contact.js` — Vercel serverless email handler
- `vercel.json` — Vercel function configuration

## Required Vercel environment variables
In Vercel, open **Project → Settings → Environment Variables** and add:

- `RESEND_API_KEY` — your Resend API key
- `CONTACT_FROM_EMAIL` — for example: `Iconx.io Website <website@iconx.io>`

The sending address/domain must be verified in Resend.

After adding the variables, redeploy the project.
