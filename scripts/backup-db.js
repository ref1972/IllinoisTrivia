#!/usr/bin/env node
// Point-in-time backup of the SQLite database.
//
// Uses SQLite's online backup API rather than copying the file. A plain `cp` is
// unsafe here: the app runs in WAL mode, so recent writes live in trivia.db-wal
// and a copy of trivia.db alone can be weeks out of date, or torn if a write
// lands mid-copy.
//
// Runs from cron; see scripts/README-backup.md for the install command.

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const APP_DIR = process.env.APP_DIR || '/var/www/IllinoisTrivia';
const DEST_DIR = process.env.BACKUP_DIR || '/root/backups';
const KEEP_DAYS = Number(process.env.BACKUP_KEEP_DAYS || 14);

const source = path.join(APP_DIR, 'data', 'trivia.db');
const stamp = new Date().toISOString().slice(0, 10);
const dest = path.join(DEST_DIR, `trivia-${stamp}.db`);

fs.mkdirSync(DEST_DIR, { recursive: true });

const db = new Database(source);

db.backup(dest)
  .then(() => {
    const { size } = fs.statSync(dest);
    console.log(`[backup] ${new Date().toISOString()} wrote ${dest} (${size} bytes)`);

    const cutoff = Date.now() - KEEP_DAYS * 86400000;
    for (const file of fs.readdirSync(DEST_DIR)) {
      if (!/^trivia-\d{4}-\d{2}-\d{2}\.db$/.test(file)) continue;
      const full = path.join(DEST_DIR, file);
      if (fs.statSync(full).mtimeMs < cutoff) {
        fs.unlinkSync(full);
        console.log(`[backup] pruned ${file}`);
      }
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(`[backup] ${new Date().toISOString()} FAILED: ${err.message}`);
    process.exit(1);
  });
