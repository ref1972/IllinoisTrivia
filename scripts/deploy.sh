#!/usr/bin/env bash
#
# Deploys a tagged release of IllinoisTrivia to the production droplet.
#
#   DEPLOY_REF=illinoistrivia-v1.2.0 scripts/deploy.sh
#
# The release is built in a fresh directory on the droplet and only becomes
# live when the `current` symlink is flipped. The previously running release is
# never modified, so a failed build cannot take the site down and a rollback is
# a symlink flip rather than a rebuild.
#
# Requires SSH key access to the droplet. Run from the repository root.

set -euo pipefail

DEPLOY_REF=${DEPLOY_REF:-}
HOST=${DEPLOY_HOST:-root@67.205.170.236}
BASE_DIR=${BASE_DIR:-/var/www/illinoistrivia}
STATE_DIR=${STATE_DIR:-/var/lib/illinoistrivia}
ENV_FILE=${ENV_FILE:-/etc/illinoistrivia.env}
BACKUP_DIR=${BACKUP_DIR:-/root/backups}
PM2_APP=${PM2_APP:-illinois-trivia}
KEEP_RELEASES=${KEEP_RELEASES:-5}
PUBLIC_URL=${PUBLIC_URL:-https://illinoistrivia.com}

log()  { printf '\n== %s\n' "$*"; }
die()  { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

[ -n "$DEPLOY_REF" ] || die "set DEPLOY_REF to an annotated tag, e.g. DEPLOY_REF=illinoistrivia-v1.2.0 scripts/deploy.sh"

# ---------------------------------------------------------------- local gates

log "Checking local state"

git rev-parse -q --verify "refs/tags/$DEPLOY_REF" >/dev/null \
  || die "tag $DEPLOY_REF does not exist locally"

# Deploying a tag that isn't on the remote makes the deployed state
# unreproducible by anyone else.
git ls-remote --exit-code --tags origin "refs/tags/$DEPLOY_REF" >/dev/null 2>&1 \
  || die "tag $DEPLOY_REF has not been pushed: git push origin $DEPLOY_REF"

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  printf 'Tracked files are modified locally:\n'
  git status --short --untracked-files=no
  printf '\nThe deploy uses the tag, not the working tree, so these changes will NOT ship.\n'
  read -r -p 'Continue anyway? [y/N] ' reply
  [ "$reply" = "y" ] || [ "$reply" = "Y" ] || die "aborted"
fi

COMMIT=$(git rev-parse --short "$DEPLOY_REF^{commit}")
RELEASE_ID="${DEPLOY_REF}-$(date -u +%Y%m%dT%H%M%SZ)"
WORK_DIR=$(mktemp -d)
ARCHIVE="$WORK_DIR/illinoistrivia-release.tar.gz"
trap 'rm -rf "$WORK_DIR"' EXIT

log "Building archive for $DEPLOY_REF ($COMMIT)"
git archive --format=tar.gz --output="$ARCHIVE" "$DEPLOY_REF"
printf '  %s bytes\n' "$(wc -c < "$ARCHIVE" | tr -d ' ')"

log "Confirming droplet is reachable"
ssh -o BatchMode=yes -o ConnectTimeout=10 "$HOST" 'true' \
  || die "cannot reach $HOST over SSH. Is the public key in authorized_keys?"

log "Uploading archive"
scp -q "$ARCHIVE" "$HOST:/tmp/illinoistrivia-release.tar.gz"

# --------------------------------------------------------------- remote steps

log "Deploying on $HOST"
ssh "$HOST" 'bash -s' <<REMOTE
set -euo pipefail

BASE_DIR="$BASE_DIR"
STATE_DIR="$STATE_DIR"
ENV_FILE="$ENV_FILE"
BACKUP_DIR="$BACKUP_DIR"
PM2_APP="$PM2_APP"
RELEASE_ID="$RELEASE_ID"
KEEP_RELEASES="$KEEP_RELEASES"
RELEASE_DIR="\$BASE_DIR/releases/\$RELEASE_ID"

step() { printf '\n-- %s\n' "\$*"; }

for required in "\$STATE_DIR/data/trivia.db" "\$ENV_FILE"; do
  [ -e "\$required" ] || { echo "ERROR: \$required missing. Run scripts/setup-releases.sh first." >&2; exit 1; }
done

step "Verified backup before deploying"
mkdir -p "\$BACKUP_DIR"
BACKUP="\$BACKUP_DIR/pre-deploy-\$RELEASE_ID.db"
cd "\$BASE_DIR/current" 2>/dev/null || cd /var/www/IllinoisTrivia
node -e "
const D = require('better-sqlite3');
const [src, dest] = process.argv.slice(1);
new D(src).backup(dest)
  .then(() => {
    const row = new D(dest, { readonly: true }).prepare('PRAGMA integrity_check').get();
    const result = row.integrity_check ?? Object.values(row)[0];
    if (result !== 'ok') { console.error('integrity_check failed:', result); process.exit(1); }
    console.log('   backup verified ok:', dest);
  })
  .catch(e => { console.error(e.message); process.exit(1); });
" "\$STATE_DIR/data/trivia.db" "\$BACKUP"

step "Extracting release \$RELEASE_ID"
rm -rf "\$RELEASE_DIR"
mkdir -p "\$RELEASE_DIR"
tar -xzf /tmp/illinoistrivia-release.tar.gz -C "\$RELEASE_DIR"
rm -f /tmp/illinoistrivia-release.tar.gz

step "Linking persistent state into the release"
# The app resolves these relative to its working directory, so they are
# symlinks rather than copies. Nothing stateful lives inside a release.
rm -rf "\$RELEASE_DIR/data" "\$RELEASE_DIR/public/uploads"
ln -s "\$STATE_DIR/data"    "\$RELEASE_DIR/data"
mkdir -p "\$RELEASE_DIR/public"
ln -s "\$STATE_DIR/uploads" "\$RELEASE_DIR/public/uploads"
ln -s "\$ENV_FILE"          "\$RELEASE_DIR/.env.local"

step "Installing dependencies"
cd "\$RELEASE_DIR"
npm ci --no-audit --no-fund

step "Building (the live release is untouched during this)"
npm run build

step "Flipping current -> \$RELEASE_ID"
ln -sfn "\$RELEASE_DIR" "\$BASE_DIR/current.tmp"
mv -Tf "\$BASE_DIR/current.tmp" "\$BASE_DIR/current"
readlink -f "\$BASE_DIR/current"

step "Restarting \$PM2_APP"
cd "\$BASE_DIR/current"
if pm2 describe "\$PM2_APP" >/dev/null 2>&1; then
  pm2 delete "\$PM2_APP" >/dev/null
fi
# Started from the symlink so each restart picks up whatever current points at.
pm2 start npm --name "\$PM2_APP" --cwd "\$BASE_DIR/current" -- start
pm2 save >/dev/null

step "Waiting for the app to answer"
ok=0
for _ in \$(seq 1 30); do
  if curl -fsS -o /dev/null http://localhost:3000/; then ok=1; break; fi
  sleep 1
done
if [ "\$ok" -ne 1 ]; then
  cat >&2 <<UNHEALTHY

ERROR: the new release did not start serving.

The site is DOWN. Recover by pointing current at the previous release:

  ls -1dt \$BASE_DIR/releases/*/
  ln -sfn \$BASE_DIR/releases/<previous> \$BASE_DIR/current.tmp
  mv -Tf \$BASE_DIR/current.tmp \$BASE_DIR/current
  pm2 delete \$PM2_APP; pm2 start npm --name \$PM2_APP --cwd \$BASE_DIR/current -- start

Diagnose with:
  pm2 logs \$PM2_APP --lines 50 --nostream --err
UNHEALTHY
  exit 1
fi

step "Local route check"
for p in / /map /trivia /pub-quiz /contact; do
  printf '   %-10s %s\n' "\$p" "\$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000\$p)"
done

step "Pruning old releases (keeping \$KEEP_RELEASES)"
cd "\$BASE_DIR/releases"
current_target=\$(readlink -f "\$BASE_DIR/current")
ls -1dt */ 2>/dev/null | tail -n +\$((KEEP_RELEASES + 1)) | while read -r old; do
  old_path=\$(readlink -f "\$old")
  [ "\$old_path" = "\$current_target" ] && continue
  echo "   removing \$old"
  rm -rf "\$old"
done

echo
echo "RELEASE_ID=\$RELEASE_ID"
REMOTE

# ------------------------------------------------------------ public checks

log "Verifying from outside the droplet"
for p in / /map /trivia /pub-quiz /contact; do
  printf '  %-10s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' "$PUBLIC_URL$p")"
done

printf '\n  anti-spam honeypot: '
curl -s -X POST "$PUBLIC_URL/api/contact" -H 'Content-Type: application/json' -d '{"company":"probe"}'
printf '\n'

cat <<SUMMARY

== Deployed
   tag        $DEPLOY_REF
   commit     $COMMIT
   release    $RELEASE_ID

State of this change:
   [x] source committed and pushed
   [x] tag deployed to production
   [ ] behaviour independently verified  <- confirm the specific change yourself

Rollback (no rebuild required):
   ssh $HOST 'ln -sfn $BASE_DIR/releases/<previous> $BASE_DIR/current.tmp && mv -Tf $BASE_DIR/current.tmp $BASE_DIR/current && pm2 restart $PM2_APP'
   ssh $HOST 'ls -1dt $BASE_DIR/releases/*/'
SUMMARY
