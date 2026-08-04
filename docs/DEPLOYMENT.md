# Deploying IllinoisTrivia

Production is a DigitalOcean droplet at `67.205.170.236` serving
<https://illinoistrivia.com> through nginx, which proxies to a Next.js process on
`localhost:3000` managed by PM2 as `illinois-trivia`.

## Layout

| Path | Contents |
| --- | --- |
| `/var/www/illinoistrivia/releases/<id>/` | Immutable release trees |
| `/var/www/illinoistrivia/current` | Symlink to the live release |
| `/var/lib/illinoistrivia/data/` | SQLite database (WAL mode) |
| `/var/lib/illinoistrivia/uploads/` | Uploaded event images |
| `/etc/illinoistrivia.env` | Secrets, mode 0600 |
| `/root/backups/` | Database backups |

Nothing stateful lives inside a release. Each release links `data`,
`public/uploads` and `.env.local` to the persistent paths above, so a release
directory can be deleted at any time without data loss.

## Why releases rather than building in place

The earlier process ran `git pull && npm run build` inside the live directory.
`next build` rewrites `.next` while the running process is still serving from it,
so a failed or slow build could break the live site, and rollback meant a second
full rebuild. Building into a fresh directory and flipping a symlink means the
running release is never touched and rollback is instant.

## One-time migration

Only needed once, on a droplet still using the old in-place layout:

```sh
scp scripts/setup-releases.sh root@67.205.170.236:/tmp/
ssh root@67.205.170.236 'bash /tmp/setup-releases.sh'
```

It takes a verified backup, moves the database (with its WAL siblings, service
stopped) and uploads to `/var/lib/illinoistrivia/`, and copies `.env.local` to
`/etc/illinoistrivia.env`. The old `/var/www/IllinoisTrivia` directory is left
in place as a rollback target. The site is down between this step and the first
deploy below.

## Deploying

### 1. Gates

```sh
git status --short --branch
npx tsc --noEmit
npm run build
git diff --check
```

### 2. Tag and push

Deployment is always from an annotated tag, never a branch, so the deployed
state is named and reproducible.

```sh
git push origin main
git tag -a illinoistrivia-vX.Y.Z -m "Describe the release"
git push origin illinoistrivia-vX.Y.Z
```

Never move an existing release tag.

### 3. Deploy

```sh
DEPLOY_REF=illinoistrivia-vX.Y.Z scripts/deploy.sh
```

The script refuses to run if the tag is missing or unpushed, warns if tracked
files are modified locally (the tag ships, not the working tree), takes a
verified backup with `PRAGMA integrity_check`, builds in a new release
directory, flips the symlink, restarts PM2, waits for the app to answer, checks
routes locally and publicly, and prunes to the last five releases.

PM2 is deleted and restarted rather than reloaded, so expect one or two seconds
where requests fail. Single-instance fork mode has no zero-downtime reload.

### 4. Verify

The script checks that routes respond. It cannot check that *your specific
change* works — do that yourself, against the public URL.

Always distinguish these states, and never call a change live before the last:

1. Source exists locally
2. Source is committed and pushed
3. A named tag is deployed
4. Behaviour is independently verified in production

## Rollback

No rebuild required:

```sh
ssh root@67.205.170.236 'ls -1dt /var/www/illinoistrivia/releases/*/'
ssh root@67.205.170.236 'ln -sfn /var/www/illinoistrivia/releases/<previous> /var/www/illinoistrivia/current.tmp \
  && mv -Tf /var/www/illinoistrivia/current.tmp /var/www/illinoistrivia/current \
  && pm2 delete illinois-trivia; pm2 start npm --name illinois-trivia --cwd /var/www/illinoistrivia/current -- start'
```

A code rollback must never restore an older database. The database is shared by
all releases and rolling it back would discard events, quizzes and subscribers
submitted since the backup.

## Database safety

The database runs in WAL mode. **Never copy `trivia.db` with `cp`** — recent
writes live in `trivia.db-wal` and a plain copy can be weeks stale or torn.
Always use SQLite's online backup API, as `scripts/backup-db.js` and the deploy
script both do, and confirm `PRAGMA integrity_check` returns `ok`.

Only one process may write to the database. Do not run a second instance
against the live file.

## Scheduled jobs

See `scripts/README.md`. Nightly backup at 03:00 UTC, weekly subscriber digest
Wednesdays at 10:00 UTC, both in root's crontab.

## Approval

Deploying, restarting production, changing secrets, restoring or replacing the
database, and sending any real subscriber email are each separate decisions
requiring the owner's explicit go-ahead. Authorisation to deploy is not
authorisation for the others.
