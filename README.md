# Encore Une 3ème Fourchette — Next.js

Homemade-food shop built with **Next.js 15 (App Router) + React 19 + TypeScript**.

| Space | URL | Who |
|---|---|---|
| Shop (cart + order form, no login) | `/` | customers |
| Admin (articles, orders, livreurs) | `/admin` | `sonia` / `titourita` |
| Livreur (orders only) | `/livreur` | accounts created by the admin |

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000   (data in ./data, no cloud account needed)
```
Production check: `npm run build && npm start`.

## Roles
- **Admin** manages articles (photos, price, discount), sees every order, and creates livreur accounts
  (tab *Livreurs*: username + password).
- **Livreur** logs in at `/livreur`; the first time he fills **name + phone** (shown to the admin).
  He only sees orders (customer, address, items, amount to collect) and can set the status:
  *À livrer / En route / Livrée / Annulée* (+ a reason when cancelling). He never sees articles.
- Every status change is stored with **who / when / from → to**; the admin sees it under *Historique* on each
  order and gets a notification when the livreur changes something.
- Logins last **one year** on the device (cookie renewed at each visit).

## Deploy
See **DEPLOY.md** (Firebase App Hosting; Supabase alternative included).

## Neue Monigue font
Put the font files in `public/fonts/` (see `public/fonts/README.txt`).
