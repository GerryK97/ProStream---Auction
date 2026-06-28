# ProStream Auction

Real-time auction management and broadcast overlay application for sports and e-sports tournaments. Next.js App Router with MongoDB (users migrated to shared Neon Postgres), Pusher for realtime, OBS-facing overlay routes.

Full stack: Next.js App Router, React, TypeScript, Tailwind CSS, MongoDB (tournament/player/team data), Neon Postgres (users — shared with Scoreboard), NextAuth credentials, Pusher, Cloudinary.

See `AGENTS.md` for full architecture rules, layer separation, token ownership, and coding standards. This file covers Claude-specific and cross-project context only.

## Cross-Project Connections

This app shares infrastructure with two sibling projects:

| Concern | Scoreboard | Auction | Expo App |
|---|---|---|---|
| User auth / IDs | Neon Postgres `users` table | Same Neon Postgres | JWT Bearer from Auction login |
| User roles | `Admin/Tournament/Player/Audience` | Same enum | Same enum |
| Realtime | Pusher | Pusher (separate channels) | WebSocket via Auction |
| Media | Cloudinary | Cloudinary | Cloudinary URLs |

**When user schema or roles change in Scoreboard, Auction and Expo must be updated in the same task.**

## Critical Constraints

1. Users are stored in Neon Postgres (`DATABASE_URL`). MongoDB still owns tournaments, players, teams, bids.
2. User IDs are `u-{timestamp}-{rand}` text strings — never integers.
3. User roles: `Admin | Tournament | Player | Audience` (not legacy MasterManager/Team).
4. Auction login route returns `token` in the response body — Expo app relies on this for Bearer auth.
5. Overlays are output-only, OBS browser-source. Never add app-shell styling to overlay routes.
6. `src/lib/pg/` contains the Drizzle/Neon user queries. `src/models/` is Mongoose for everything else.

## Agentic Workflow

This project participates in cross-project agentic tasks orchestrated from the Scoreboard project. When a sub-agent is spawned here:
- Create a feature branch (`git checkout -b feature/<task-name>`) before making any changes.
- Run `npm run typecheck` or `tsc --noEmit` after changes.
- Report changed files and typecheck result back to the orchestrator.
- Never push or merge without explicit HIL approval from the orchestrating session.
