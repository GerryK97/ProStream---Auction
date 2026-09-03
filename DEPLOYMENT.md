# VPS Deployment (branch: `vps-deploy`)

Dokploy deployment on the Contabo VPS. Kept deployable at all times;
`main`, `Development` and `Production` are unaffected.

| | |
|---|---|
| URL | https://auction.prostream.lk |
| Host | Dokploy on 94.136.186.23 (project `prostream`) |
| Build | Nixpacks, `NIXPACKS_NODE_VERSION=22` |

## Shared state (important)

Auction and Scoreboard share **one Neon Postgres database** (users, wallets)
and one Cloudinary account. Auction additionally uses MongoDB Atlas for
tournaments, players, teams and auction state.

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

Vercel remains live during the transition and reads the same databases, so
reverting DNS is sufficient; no data migration is involved.
