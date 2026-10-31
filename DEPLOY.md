# Deploy on Firebase (App Hosting) — step by step

App Hosting runs this Next.js app on Cloud Run behind Google's CDN. Data goes to **Firestore**, photos to
**Cloud Storage**. It needs the **Blaze (pay-as-you-go)** plan: a card is required, but a small shop normally stays
inside the free monthly quota (set a budget alert in Google Cloud to be safe).

## 1. Create the Firebase project
1. https://console.firebase.google.com → **Add project**.
2. Bottom-left → **Upgrade** → Blaze.
3. **Build → Firestore Database → Create database** (production mode, pick a region).
4. **Build → Storage → Get started** (production mode). Copy the bucket name shown at the top of the *Files* tab,
   e.g. `my-project.firebasestorage.app`.

## 2. Configure the project files
- `.firebaserc` → replace `YOUR-FIREBASE-PROJECT-ID` with your project id.
- `apphosting.yaml` → replace `YOUR-FIREBASE-PROJECT-ID.firebasestorage.app` with your bucket name.

## 3. Deploy
```bash
npm install -g firebase-tools
firebase login
npm install
firebase apphosting:backends:create --project YOUR-PROJECT-ID    # once: choose region, backend id "encore-fourchette"
firebase deploy
```
(The backend id must match `backendId` in `firebase.json`.)
Your site is on the URL printed at the end (`https://encore-fourchette--<project>.<region>.hosted.app`);
admin at `/admin`, livreur at `/livreur`. Add your own domain in *App Hosting → Settings → Domains*.

**Alternative:** connect the backend to your GitHub repo during `backends:create`; every `git push` to the
live branch then deploys automatically.

## 4. First use
1. Open `/admin` → **sonia / titourita**.
2. *Articles*: add products with photos (or "Ajouter 12 articles de démo").
3. *Livreurs*: create an account (username + password) and give them to your livreur, who opens `/livreur`.

## If something fails
- **Permission denied (Firestore/Storage)** in the logs: in Google Cloud → IAM, give the App Hosting service
  account (`firebase-app-hosting-compute@<project>.iam.gserviceaccount.com`) the roles
  *Cloud Datastore User* and *Storage Object Admin*.
- **"Firebase backend needs FIREBASE_STORAGE_BUCKET"**: the bucket name in `apphosting.yaml` is missing/wrong.
- Photos not showing: check the bucket name; photos are served by the app at `/uploads/<file>`.

## Security notes
- Keep the GitHub repo **private**: the default admin login (`sonia / titourita`) is written in `src/lib/auth.ts`.
  To change it, set `ADMIN_USER` / `ADMIN_PASSWORD` in `apphosting.yaml` (use a secret for the password) —
  changing the password logs the admin out everywhere.
- Firestore and Storage rules are closed (`false`): browsers can't read the database directly, only the app can.
- Livreur passwords are stored hashed (scrypt); resetting or deleting a livreur ends his sessions immediately.

---

## Alternative: Supabase + Render/Vercel (free, no card)
Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (and no `STORAGE_BACKEND`), run `supabase.sql` once in the Supabase
SQL editor, then deploy the repo on Render (Node web service: build `npm install && npm run build`, start `npm start`)
or Vercel. Photos are served straight from Supabase Storage.
