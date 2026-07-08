# Iconx.io Vercel Site

Updated static site for Iconx.io with:

- no phone number on-site
- separate Retail Activation / Endcap section
- separate One4One Sampling section
- prompt-only contact capture modal
- Vercel serverless contact handler
- attached campaign and lifestyle images packaged in `assets/`

## Files to upload
- `index.html`
- `vercel.json`
- `README.md`
- `api/contact.js`
- `assets/`

## Required Vercel environment variables
Set these in Vercel Project Settings:

- `RESEND_API_KEY`
- `CONTACT_FROM_EMAIL`

Example sender:
`Iconx.io Website <website@iconx.io>`

The sender domain/address must be verified in Resend.

- photo captions removed
- wide brand-ambassador image uses a face-safe contained layout
