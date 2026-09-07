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
