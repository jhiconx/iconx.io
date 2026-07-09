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

- reduced One4One photo set to a cleaner 4-image gallery
- removed the lower signage/photo panels
- male faces preserved in the High Noon image

- added three new activation images: Big K consumers, street food vendor, and dessert vendor

- restored High Noon campaign poster and reward unlock image
- removed Big K couple image


## Supabase lead storage

Add these Production environment variables in Vercel:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Each successful inquiry is now:
1. parsed into structured lead fields,
2. inserted into `public.iconx_leads`,
3. emailed through Resend.

The form will show an error if the lead cannot be saved.


## Private Iconx Lead Intelligence dashboard

New files:
- `admin.html`
- `api/admin-leads.js`

Open the dashboard at:
- `https://YOUR-VERCEL-DOMAIN/admin.html`

Add this Vercel Production environment variable before redeploying:
- `ADMIN_PASSWORD` — choose a strong private password

The dashboard includes:
- password-gated access
- natural-language lead search
- structured lead filters
- lead detail drawer
- status, priority, and notes editing
- CSV export
- basic opportunity matching based on stored lead text

The current search is deterministic and keyword/intent-based. It does not call a hosted LLM or Ollama yet.
