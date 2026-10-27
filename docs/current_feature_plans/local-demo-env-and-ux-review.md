# In progress: local demo environment + look-and-feel review

Status (2026-10-27): paused to save usage; continue in a fresh session.

Done
- HP has Ubuntu 24.04 in WSL (`wsl -d Ubuntu`, systemd on) with Docker 29 and Supabase CLI 2.122
  installed inside it (run as root: `wsl -d Ubuntu -u root -- ...`). Docker Desktop is NOT used (needs a GUI).
- Branch `feature/local-demo-env`: `supabase/config.toml` (project_id rebirthai), `scripts/seed-demo.mjs`
  (fictional Maria at /@maria_g + an empty newcomer; refuses non-local URLs). Untested.

Next
1. In WSL from this repo: `supabase start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor`
   (applies supabase/migrations). Windows reaches it at http://127.0.0.1:54321 via WSL localhost.
2. `supabase status -o env` for keys; pass them as env vars (never commit, never write .env files):
   seed with `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo.mjs`.
3. Run the app with NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DEMO_MODE=1,
   DEMO_EMAIL=demo@rebirthai.local; sign in at /demo. One dev server only; stop it after.
4. Screenshots of every screen at phone size + short GIFs of main flows (owner prefers a mix);
   ux-language-advocate reviews them (Sonnet). Report top issues as Issues (Backlog/Pending).
5. Add the local-env steps to CLAUDE.md/README, open the PR, merge to dev.
6. Later, owner in person: switch the HP to Ubuntu Server (checklist still to write).
