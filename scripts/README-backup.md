# Database backups

`backup-db.js` writes a point-in-time copy of `data/trivia.db` to `/root/backups/trivia-YYYY-MM-DD.db`
and prunes copies older than 14 days.

It uses SQLite's online backup API, not a file copy. This matters: the app runs in WAL mode, so
recent writes live in `trivia.db-wal` until a checkpoint. Copying `trivia.db` on its own can silently
lose weeks of data, and copying it during a write can produce a torn file.

## Install (on the droplet)

```
cd /var/www/IllinoisTrivia && node scripts/backup-db.js
(crontab -l 2>/dev/null | grep -v backup-db.js; echo "0 3 * * * cd /var/www/IllinoisTrivia && $(command -v node) scripts/backup-db.js >> /var/log/illinoistrivia-backup.log 2>&1") | crontab -
```

Runs daily at 03:00 UTC. Check `/var/log/illinoistrivia-backup.log` for results.

## Configuration

| Variable           | Default                  |
| ------------------ | ------------------------ |
| `APP_DIR`          | `/var/www/IllinoisTrivia`|
| `BACKUP_DIR`       | `/root/backups`          |
| `BACKUP_KEEP_DAYS` | `14`                     |

## Restore

```
pm2 stop illinois-trivia
cd /var/www/IllinoisTrivia
mv data/trivia.db data/trivia.db.broken
rm -f data/trivia.db-wal data/trivia.db-shm          # stale WAL would fight the restored file
cp /root/backups/trivia-YYYY-MM-DD.db data/trivia.db
pm2 start illinois-trivia
```

## Still missing: off-box copies

These backups live on the same droplet as the database. They cover accidental deletion and bad
migrations, but not loss of the droplet itself. Uploaded images in `public/uploads/` are not covered
at all. Both gaps want either DigitalOcean's automated droplet backups (paid add-on) or an offsite
sync.
