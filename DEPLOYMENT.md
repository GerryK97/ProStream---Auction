# VPS Deployment (branch: `vps-deploy`)

Dokploy deployment on the Contabo VPS. Kept deployable at all times;
`main`, `Development` and `Production` are unaffected.

| | |
|---|---|
| URL | https://auction.prostream.lk |
| Host | Dokploy on 94.136.186.23 (project `prostream`) |
| Build | Nixpacks, `NIXPACKS_NODE_VERSION=22` |

## Shared state (important)

Auction and Scoreboard share the Dokploy-managed **`prostream-postgres`**
database for PostgreSQL-backed application state, including users and wallets.
The shared `public` schema was migrated and source-to-target verified on
2026-09-07. Neon remains unchanged only as a time-limited rollback snapshot;
do not direct production writes there.

Auction additionally uses MongoDB Atlas for tournaments, players, teams, bids,
and auction state. That MongoDB migration is a separate future project.

`NEXTAUTH_SECRET` is deliberately **identical** to the Scoreboard app's: the
two share a user table, and a JWT issued by one is accepted by the other.
Changing it in one place breaks cross-app operator flows.

## Cron

The Vercel cron (`/api/cron/auction-lifecycle`, daily 02:00) is replaced by a
system cron on the VPS at `/etc/cron.d/prostream-auction`, authenticated with
`CRON_SECRET`.

## Promoting changes

```bash
git checkout vps-deploy
git merge main
git push
```

## Rollback

Keep Neon and the protected pre-cutover Dokploy dump for at least 30 days.
Rollback requires a deliberate maintenance window and a database restore. Do
not simply point DNS at Vercel, because its Neon configuration is now stale and
could create a write split.

## Local development against the production database

Production Postgres is **not** reachable directly, by design:

- Only port 22 is open on the VPS; 5432 is firewalled.
- The container sits on `dokploy-network`, a Docker **Swarm overlay** network,
  so even the VPS host cannot route to the container IP. A plain
  `ssh -L 15432:<container-ip>:5432` therefore times out.

Use the helper script, which runs a loopback-only `socat` relay on the overlay
network and forwards to it over SSH:

```bash
./scripts/db-tunnel.sh dev      # tunnel + npm run dev against production
./scripts/db-tunnel.sh start    # just the tunnel, prints DATABASE_URL
./scripts/db-tunnel.sh status
./scripts/db-tunnel.sh stop
```

Path: `localhost:15432 → ssh → VPS 127.0.0.1:15432 → socat → postgres:5432`.
The relay publishes to the VPS loopback only, so nothing new is exposed to the
internet.

### Warning: `.env.local` still points at Neon

Neon was the pre-2026-09-07 database and its credentials now fail
authentication. Any local run that uses `.env.local`'s `DATABASE_URL` is either
broken or reading a stale snapshot. Row counts differ substantially, e.g. Neon
has 114 tournaments versus 61 in production. Always override `DATABASE_URL` via
the tunnel when testing PostgreSQL-backed behaviour.

MongoDB (tournaments, teams, players, auction state) is Atlas-hosted and
reachable directly, so it needs no tunnel.

### Caution

This connects to the **live production database**. Reads are safe; treat writes
as production changes.
