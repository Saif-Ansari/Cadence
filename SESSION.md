# Session Notes

## Last session — 2026-07-18

### Deploy — done. Live at https://cadence-tau-self.vercel.app
Backend: `https://cadence-7sy1.onrender.com` (Render, not Railway — switched mid-deploy since
Railway's free tier is trial-credit-only now; Render's zero-config GitHub-import flow was a
near-identical swap). Database: MongoDB Atlas, cluster in Mumbai (ap-south-1); Render region
set to Singapore to keep backend↔DB latency down (picking a US region would have added a
real, needless round-trip for every query).

**Real bugs hit during this deploy, in the order found:**
1. `VITE_API_URL` needs an explicit Vercel **redeploy** to bake into the built bundle — setting
   the env var alone doesn't retroactively apply to an already-built deployment.
2. A stale browser-cached JS bundle briefly kept calling the *Vercel* domain instead of the
   Render backend after the above was fixed — surfaced as a confusing `405 Method Not Allowed`
   (Vercel's SPA rewrite serves `index.html` for any unmatched path, including `/api/*`, and
   static files only accept GET/HEAD). Fixed by a hard refresh — not a real bug, just cache.
3. `CORS_ORIGINS` with a trailing slash never matches a browser's `Origin` header (browsers
   never send one) — silent CORS failure, `Access-Control-Allow-Origin` missing from the
   preflight response.
4. The actual root cause, once the trailing slash was fixed and it *still* failed: the Render
   env var was literally misnamed `CORS_ORIGIN` (missing the trailing `S`) — so
   `process.env.CORS_ORIGINS` was `undefined` the whole time and the code was silently using its
   `localhost` fallback. Confirmed via a temporary `/api/debug-cors` endpoint (added, curl'd
   directly to see the exact raw value, then removed and committed — see `git log`) rather than
   continuing to guess from dashboard screenshots back and forth.

**Two credential exposures happened this session, both from pasting real values into chat/
screenshots — not code bugs, just a reminder for next time to route secrets straight into the
hosting dashboard and never through the conversation:**
- MongoDB Atlas DB user password — exposed twice, rotated (final rotation used to build the
  live `MONGO_URI`)
- `JWT_SECRET` — visible in a Render dashboard screenshot, rotated afterward (this logs out any
  existing sessions, which was fine — no real users yet)

Final security sweep done at the end of this session: grepped both this repo and `../portfolio`
for the literal exposed secret values and generic secret patterns across every tracked file —
clean. Only `.env.example` files (placeholders, no real values) are tracked; the real `.env`
files remain correctly gitignored.

**Also done:** added the live URL (`https://cadence-tau-self.vercel.app`) to the Cadence entry
in `../portfolio/src/components/Projects.jsx` (`link` field — it already had `github`, was
missing `link`, matching the pattern the other two portfolio projects use). Verified the
portfolio site still builds. That change is in a different git repo — uncommitted as of this
note, since it needs a separate decision about who commits it.

---

## Previous session — 2026-07-11

### What's done since 2026-07-08
All committed (`7b43ce2`, `467dabd`, and the doc-sync pass this covers). Backend at 49 tests
(7 suites), frontend at 22 (5 files), `tsc` clean, all green.

- **Five fixes/rules found from actually using the app** (user tested live, not requested
  speculatively):
  - **Goals** — deleting a goal is now blocked (`409 INCOMPLETE_STEPS`) while any step is
    undone. Delete button in `GoalsPage` disabled with a tooltip, same pattern as "mark complete"
  - **Habits** — days before a habit's `createdAt` are flagged (`weekGrid[].beforeCreation`),
    greyed out and non-toggleable instead of reading as missed; streak calc stops at the
    creation week instead of requiring weeks that predate the habit (see LEARNING.md §17-18 for
    the Mongoose `timestamps` gotcha hit while testing this)
  - **Tasks** — delete confirmation no longer shows the task title (could be arbitrarily long) —
    `DeletePopover`'s `itemName` is now optional, generic "delete this?" when omitted
  - **Reflections** — added `DELETE /api/reflections/:id` + a delete button in the Entry Detail
    modal header; fixed the pre-fill effect that only ever populated fields and never cleared
    them (a new day with no entry yet now correctly shows a blank form instead of yesterday's text)
  - Confirmed via conversation, not code changes: past reflections were already view-only (no
    input elements in the Entry Detail modal), and the main form was already always bound to the
    *real* current day at save-time (not whatever day it displayed) — both already correct
- **Two follow-up bugs from the reflection delete button**, both found live and fixed:
  - `DeletePopover` always opens *above* its trigger (`bottom-full`) — fine for list rows, broken
    for the reflection modal's header (too close to the top, got clipped by the modal's scroll
    boundary). Added a `placement` prop (`'top' | 'bottom'`), reflection modal uses `'bottom'`
  - With very little content, the Entry Detail modal shrank so small the downward-opening popover
    had nowhere to sit properly — added `min-h-[320px]` to the modal body
- **`.gitignore` hardened** across root/client/server — was only covering `.env`/`.env.local`;
  missing Vite's other mode variants (`.env.production` etc. — the exact file needed for
  `VITE_API_URL`), Vercel/Railway CLI local config, and defensive credential-file patterns.
  Audited: nothing sensitive was ever actually tracked, just gaps in future-proofing
- **`client/vercel.json` added** — SPA rewrite (`/(.*) → /index.html`). Needed because
  `client/src/App.tsx` uses React Router client-side routes; without this, Vercel 404s on
  direct navigation/refresh to anything but `/`
- **Docs fully synced (this pass)** — beyond just documenting what's new, also fixed
  longstanding drift in PRODUCT_SPEC.md that predated this session: it still described goal
  progress via linked Tasks (`completed tasks ÷ total tasks`) and Tasks as optionally
  goal-linked — neither matches reality since the Steps pivot (documented in CLAUDE.md, never
  back-ported to PRODUCT_SPEC.md until now). CLAUDE.md, README.md, IMPLEMENTATION_PLAN.md, and
  LEARNING.md also updated.

### Known gaps (still intentionally out of scope)
- `PATCH /api/users/email` — email change is not built (PRODUCT_SPEC.md lists it; not implemented)
- Google OAuth — not built (deferred per IMPLEMENTATION_PLAN.md notes)
- Dedicated input-validation library (zod/express-validator) — still ad-hoc per-controller checks
- Request logging (morgan) — not added
- No loading indicator on the main Reflections form's own query (only the history side panel has
  one) — offered to add, user hasn't asked for it yet

### Deploy plan (superseded — see the top of this file for what actually happened)
The original plan below assumed Railway for the backend; the app ended up on Render instead.
Kept here only as a historical note, not something to follow.

### Next session
No outstanding deploy work. Possible next steps: pick up one of the "Known gaps" above (email
change, Google OAuth, dedicated validation library, request logging), or just keep using the
live app and see what surfaces — most of this project's real fixes so far have come from
actually using it, not from planning ahead.

### How to resume
Start with: **"continue from SESSION.md"**
