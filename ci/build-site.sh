#!/usr/bin/env bash
# ประกอบเว็บสำหรับ GitHub Pages: เว็บจริง (main) ที่ราก และเว็บทดลอง (dev) ที่ /staging/
# ใช้: ci/build-site.sh <โฟลเดอร์ main> <โฟลเดอร์ dev> <โฟลเดอร์ผลลัพธ์>
set -euo pipefail
MAIN="$1"; DEV="$2"; OUT="$3"
rm -rf "$OUT"; mkdir -p "$OUT/staging"
copy(){ for f in "$1"/*.html "$1"/*.png "$1"/*.svg "$1"/sw.js "$1"/manifest.webmanifest; do [ -f "$f" ] && cp "$f" "$2"/; done; true; }
copy "$MAIN" "$OUT"
copy "$DEV" "$OUT/staging"
cp "$DEV/ci/staging-mode.js" "$OUT/staging/staging-mode.js"
for f in "$OUT"/staging/*.html; do
  sed -i 's#<head>#<head>\n<script src="staging-mode.js"></script>\n<meta name="robots" content="noindex">#' "$f"
done
touch "$OUT/.nojekyll"
