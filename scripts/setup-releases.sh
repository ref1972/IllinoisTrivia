#!/usr/bin/env bash
#
# One-time migration from the in-place checkout at /var/www/IllinoisTrivia to
# the release-directory layout that scripts/deploy.sh expects.
#
# Run this ON THE DROPLET, once, before the first scripts/deploy.sh run.
# It is idempotent: re-running it after success changes nothing.
#
# Before:
#   /var/www/IllinoisTrivia/            git checkout, built in place
#   /var/www/IllinoisTrivia/data/       live database
#   /var/www/IllinoisTrivia/public/uploads/
#   /var/www/IllinoisTrivia/.env.local  secrets
#
# After:
#   /var/lib/illinoistrivia/data/       live database   (persistent)
#   /var/lib/illinoistrivia/uploads/    uploaded images (persistent)
#   /etc/illinoistrivia.env             secrets, mode 0600
#   /var/www/illinoistrivia/releases/<id>/   immutable release trees
#   /var/www/illinoistrivia/current -> releases/<id>
#
# The old directory is left untouched so it remains a rollback target.

set -euo pipefail

OLD_DIR=${OLD_DIR:-/var/www/IllinoisTrivia}
BASE_DIR=${BASE_DIR:-/var/www/illinoistrivia}
STATE_DIR=${STATE_DIR:-/var/lib/illinoistrivia}
ENV_FILE=${ENV_FILE:-/etc/illinoistrivia.env}
BACKUP_DIR=${BACKUP_DIR:-/root/backups}

log() { printf '\n== %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "run as root"
[ -d "$OLD_DIR" ]    || die "$OLD_DIR does not exist"

log "Backing up the database before touching anything"
mkdir -p "$BACKUP_DIR"
PRE="$BACKUP_DIR/pre-migration-$(date -u +%Y%m%dT%H%M%SZ).db"
cd "$OLD_DIR"
node -e "
const D = require('better-sqlite3');
const src = process.argv[1], dest = process.argv[2];
new D(src).backup(dest)
  .then(() => {
    const check = new D(dest, { readonly: true }).prepare('PRAGMA integrity_check').get();
    const result = check.integrity_check ?? Object.values(check)[0];
    if (result !== 'ok') { console.error('integrity_check:', result); process.exit(1); }
    console.log('backup verified ok ->', dest);
  })
  .catch(e => { console.error(e.message); process.exit(1); });
" "$OLD_DIR/data/trivia.db" "$PRE"

log "Creating persistent state directories"
mkdir -p "$STATE_DIR/data" "$STATE_DIR/uploads" "$BASE_DIR/releases"

# Move the live data across only if it hasn't been moved already. A WAL-mode
# database must travel with its -wal and -shm siblings, so the whole directory
# moves together while the service is stopped.
if [ ! -f "$STATE_DIR/data/trivia.db" ]; then
  log "Stopping the service so the database is quiescent"
  pm2 stop illinois-trivia >/dev/null 2>&1 || true
  sleep 2

  log "Moving database into $STATE_DIR/data"
  for f in "$OLD_DIR"/data/trivia.db*; do
    [ -e "$f" ] || continue
    mv "$f" "$STATE_DIR/data/"
  done
else
  log "Database already present in $STATE_DIR/data, leaving it alone"
fi

if [ -d "$OLD_DIR/public/uploads" ] && [ ! -L "$OLD_DIR/public/uploads" ]; then
  log "Moving uploads into $STATE_DIR/uploads"
  find "$OLD_DIR/public/uploads" -maxdepth 1 -type f -exec mv {} "$STATE_DIR/uploads/" \;
fi

if [ ! -f "$ENV_FILE" ]; then
  log "Copying .env.local to $ENV_FILE (mode 0600)"
  cp "$OLD_DIR/.env.local" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
else
  log "$ENV_FILE already exists, leaving it alone"
fi

log "Result"
printf '  database : %s (%s bytes)\n' "$STATE_DIR/data/trivia.db" "$(stat -c%s "$STATE_DIR/data/trivia.db" 2>/dev/null || echo missing)"
printf '  uploads  : %s files\n' "$(find "$STATE_DIR/uploads" -type f | wc -l | tr -d ' ')"
printf '  env file : %s (%s)\n' "$ENV_FILE" "$(stat -c%a "$ENV_FILE")"
printf '  backup   : %s\n' "$PRE"
cat <<'NEXT'

Migration complete. The service is stopped and the old directory is untouched.

Next: run scripts/deploy.sh from your local machine. It will create the first
release, link it to the persistent state above, build it, flip the symlink and
start the service. Nothing serves traffic until that finishes.

To abandon this migration, move the database files back to
/var/www/IllinoisTrivia/data/ and run: pm2 start illinois-trivia
NEXT
