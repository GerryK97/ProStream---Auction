#!/usr/bin/env bash
#
# db-tunnel.sh — open a local connection to the production Postgres.
#
# Why this is needed
# ------------------
# Production Postgres runs as a Docker Swarm service on the VPS. Two things stop
# a direct connection:
#
#   1. Port 5432 is firewalled on the VPS (only 22 is open). That is correct:
#      the database must not be exposed to the internet.
#   2. The container sits on `dokploy-network`, a Swarm *overlay* network. The
#      VPS host itself cannot route to the container IP, so a plain
#      `ssh -L ... <container-ip>:5432` also fails.
#
# So we run a tiny socat relay container ON the overlay network, publish it to
# the VPS's loopback only (127.0.0.1:15432, still not internet-facing), and
# forward to it over SSH.
#
#   your Mac :15432  ──ssh──>  VPS 127.0.0.1:15432  ──socat──>  postgres:5432
#
# Usage
#   ./scripts/db-tunnel.sh start     # open the tunnel, print DATABASE_URL
#   ./scripts/db-tunnel.sh stop      # close tunnel and remove the relay
#   ./scripts/db-tunnel.sh status
#   ./scripts/db-tunnel.sh dev       # start tunnel, then run `npm run dev`
#
# Requires: SSH key access to the VPS (already configured).

set -euo pipefail

VPS_HOST="${VPS_HOST:-root@94.136.186.23}"
LOCAL_PORT="${LOCAL_PORT:-15432}"
RELAY_NAME="pgbridge"
PG_SERVICE="prostream-prostreampostgres-gzgwy2"   # docker ps -qf name=prostream-prostreampostgres
PG_DB="prostream"
PG_USER="postgres"
NETWORK="dokploy-network"

ssh_vps() { ssh -o BatchMode=yes -o ConnectTimeout=15 "$VPS_HOST" "$@"; }

get_password() {
  ssh_vps "docker inspect \$(docker ps -qf name=$PG_SERVICE) \
    --format '{{range .Config.Env}}{{println .}}{{end}}' \
    | sed -n 's/^POSTGRES_PASSWORD=//p'" | tr -d '\r\n'
}

tunnel_pid() { pgrep -f "$LOCAL_PORT:127.0.0.1:$LOCAL_PORT $VPS_HOST" || true; }

start() {
  echo "==> ensuring relay container on $NETWORK"
  ssh_vps "docker rm -f $RELAY_NAME >/dev/null 2>&1 || true; \
    docker run -d --name $RELAY_NAME --network $NETWORK \
      -p 127.0.0.1:$LOCAL_PORT:$LOCAL_PORT --restart unless-stopped alpine/socat \
      tcp-listen:$LOCAL_PORT,fork,reuseaddr tcp-connect:$PG_SERVICE:5432 >/dev/null"

  echo "==> opening SSH tunnel localhost:$LOCAL_PORT"
  [ -n "$(tunnel_pid)" ] && kill "$(tunnel_pid)" 2>/dev/null || true
  ssh -o BatchMode=yes -o ExitOnForwardFailure=yes -f -N \
      -L "$LOCAL_PORT:127.0.0.1:$LOCAL_PORT" "$VPS_HOST"

  sleep 2
  local pw; pw="$(get_password)"
  echo
  echo "Tunnel is up. Use this DATABASE_URL:"
  echo
  echo "  DATABASE_URL=postgresql://$PG_USER:$pw@127.0.0.1:$LOCAL_PORT/$PG_DB"
  echo
  echo "Run the app with:  ./scripts/db-tunnel.sh dev"
  echo "Close it with   :  ./scripts/db-tunnel.sh stop"
}

stop() {
  [ -n "$(tunnel_pid)" ] && kill "$(tunnel_pid)" 2>/dev/null && echo "==> tunnel closed" || echo "==> no local tunnel running"
  ssh_vps "docker rm -f $RELAY_NAME >/dev/null 2>&1 || true" && echo "==> relay removed"
}

status() {
  if [ -n "$(tunnel_pid)" ]; then echo "tunnel: RUNNING (pid $(tunnel_pid))"; else echo "tunnel: not running"; fi
  ssh_vps "docker ps --filter name=$RELAY_NAME --format 'relay : {{.Status}}'" || true
}

dev() {
  start
  local pw; pw="$(get_password)"
  echo "==> starting Next.js against production Postgres"
  DATABASE_URL="postgresql://$PG_USER:$pw@127.0.0.1:$LOCAL_PORT/$PG_DB" npm run dev
}

case "${1:-start}" in
  start)  start ;;
  stop)   stop ;;
  status) status ;;
  dev)    dev ;;
  *) echo "usage: $0 {start|stop|status|dev}"; exit 1 ;;
esac
