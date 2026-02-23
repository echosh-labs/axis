#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LANDING_DIR="$ROOT_DIR/landing"
DIST_DIR="$LANDING_DIR/dist"
HTML_FILE="$LANDING_DIR/index.html"
PORT="8888"

if [[ ! -d "$LANDING_DIR" ]]; then
    echo "Landing directory not found at $LANDING_DIR" >&2
    exit 1
fi

cd "$LANDING_DIR"

if [[ ! -d node_modules ]]; then
    echo "Installing landing dependencies..."
    npm install
fi

echo "Building Tailwind bundle..."
npm run build >/dev/null

CSS_FILE="$DIST_DIR/landing.css"
if [[ ! -f "$CSS_FILE" ]]; then
    echo "Expected CSS at $CSS_FILE after build" >&2
    exit 1
fi

HASH=$(openssl dgst -sha384 -binary "$CSS_FILE" | base64)
SHORT_HASH="${HASH:0:8}"
HASHED_CSS="$DIST_DIR/landing.${SHORT_HASH}.css"

mv "$CSS_FILE" "$HASHED_CSS"

python3 - "$HTML_FILE" "$SHORT_HASH" "$HASH" <<'PY'
import sys, re, pathlib
html_path = pathlib.Path(sys.argv[1])
short_hash = sys.argv[2]
full_hash = sys.argv[3]
html = html_path.read_text()
new_href = f'./dist/landing.{short_hash}.css'
new_integrity = f'sha384-{full_hash}'
pattern = r'href="\.\/dist\/landing\.[^"]+" integrity="[^"]+"'
replacement = f'href="{new_href}" integrity="{new_integrity}"'
updated = re.sub(pattern, replacement, html)
if html == updated:
    print("Warning: link tag not updated; pattern not found", file=sys.stderr)
html_path.write_text(updated)
PY

echo "Serving landing/ at http://localhost:${PORT} (Ctrl+C to stop)..."
python3 -m http.server "$PORT" --directory "$LANDING_DIR"
