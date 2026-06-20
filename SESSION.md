# Session Notes

## Last session — 2026-06-20

### What's done
- Weekend 1 ✅ — TypeScript + Tailwind
- Weekend 2 ✅ — Auth backend (signup, login, logout, me, protect middleware)
- Weekend 3 ✅ — Auth frontend built, needs testing
  - `types/index.ts` — User, AuthResponse types
  - `lib/api.ts` — fetch wrapper with JWT auto-attach
  - `services/auth.service.ts` — signup, login, logout, me
  - `store/auth.store.ts` — Zustand auth store (setAuth, clearAuth)
  - `constants/quotes.ts` — motivational quotes array
  - `main.tsx` — BrowserRouter + QueryClientProvider + bootstrap (token rehydration)
  - `App.tsx` — React Router routes
  - `components/layout/ProtectedLayout.tsx` — redirects to /auth if not logged in
  - `pages/AuthPage.tsx` — full login + signup UI matching Paper design
  - `pages/DashboardPage.tsx` — placeholder

### Needs testing tomorrow (do this first)
- Switch between login/signup toggle
- Sign up with a new email → should land on Dashboard
- Refresh page → should stay on Dashboard (token rehydration)
- Navigate to /auth while logged in → should redirect to /
- Login with existing account

### Architecture covered in LEARNING.md
- Routes / Controllers / Services — what and why
- Why app.js is separate from index.js
- Why services have no req/res
- MongoDB vs SQL
- JWT vs Sessions
- bcrypt vs MD5/SHA-256

### Next session
1. Test the auth frontend (list above)
2. Fix any issues
3. Commit Weekend 3
4. Decide: start Goals backend or take a breather to review everything

### How to resume
Start with: **"continue from SESSION.md"**
