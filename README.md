# Iconx.io Vercel Site

Updated static site for Iconx.io with:

- Nextdoor Pixel base code added to `index.html` for PAGE_VIEW tracking using data source ID `30385738-a5b3-4a07-8ad5-40ffe59e7d29`.

- no phone number on-site
- separate Retail Activation / Endcap section
- separate One4One Sampling section
- CHI-powered Gen Z loyalty section
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


## Latest update

Added a section after “Technology that connects every stakeholder” called “Loyalty For Gen Z Shoppers,” with Chili Coin (CHI) copy, live tracker links, and Chili logo display.


## V2 CHI logo update

The Gen Z Loyalty section now uses local CHI assets with the red coin mark displayed above the Chili wordmark.

New files:
- `assets/chi-red-coin.png`
- `assets/chi-logo-text.png`

## V2 AI/contact form fix

This version fixes the prompt organizer so label-style entries are parsed correctly, for example:

- `My name is: Jonas`
- `My company or brand is: Agency, Coke`
- `The geography I want to target is: US`
- `My preferred retailer or channel is: Indie`

The contact handler now also reparses the inquiry on the server before saving or emailing, so a bad browser-side summary should not corrupt the lead email.

### Important Vercel settings

The form needs `RESEND_API_KEY` and a verified `CONTACT_FROM_EMAIL` to send emails.

Lead storage needs either `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`, plus `SUPABASE_URL`. If Supabase is not configured or the `iconx_leads` table rejects the insert, this version will still send the email through Resend and return success with `database_warning` in the API response.

## Current short-term homepage burst

A top-of-page burst banner has been added:

`Email us to test our new Sample Program in Florida.`

The email link opens a mailto addressed to `samples@iconx.io` with a Florida Sample Program Test subject.

## Florida Sample Program top burst update

The top-page burst now includes the Ideal + Jomara community banner image and a larger email callout linking to `samples@iconx.io`.


## Rules page update

Added:
- `/rules/` clean URL via `rules/index.html`
- Official Offer, Coupon & Rewards Program Rules
- Effective Date: August 31, 2026
- Last Updated: August 31, 2026
- End Date: September 30, 2026
- Rules link in the site navigation and footer
