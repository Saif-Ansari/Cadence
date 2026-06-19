# Session Notes

## Last session — 2026-06-19

### What's done
- Weekend 1 ✅ — TypeScript + Tailwind added to client
- Weekend 2 ✅ — Auth backend complete
  - User model, CheckIn model
  - POST /api/auth/signup — bcrypt, JWT
  - POST /api/auth/login — bcrypt compare, check-in recorded, JWT
  - POST /api/auth/logout
  - GET /api/auth/me — protect middleware
  - Proper folder structure: routes / controllers / services / config / middleware
  - LEARNING.md created with all backend concepts

### Tested and confirmed
- POST /api/auth/signup → token + user ✅
- MongoDB running locally on port 27017 ✅
- Express on port 5000 ✅

### Still needs testing (do first thing next session)
- Duplicate email → expect 409 EMAIL_TAKEN
- POST /api/auth/login → expect 200 + token
- GET /api/auth/me with token → expect user
- GET /api/auth/me without token → expect 401

### Next session plan
1. Finish testing the remaining 4 endpoints above
2. Full backend walkthrough — architecture, system design, how everything connects and why
3. Then move to Weekend 3 — Auth frontend (React Router, login/signup UI, useAuth, Zustand, TanStack Query, protected routes)

### How to resume
Start your message with: **"continue from SESSION.md"**
