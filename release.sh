#!/bin/bash
# release.sh — One-shot release for SECRA OP Tracking.
# Usage: ./release.sh v2.1.7
#
# Performs the steps from CLAUDE.md "Release workflow" in the required order:
#   1. Update VERSION
#   2. Prepend CHANGELOG.md skeleton, open $EDITOR, wait for save
#   3. Bump jsDelivr CDN pin (@vX.Y.Z) in docs/wix snippet to new version
#   4. Commit src/ + VERSION + CHANGELOG.md + pinned docs
#   5. Run ./build.sh
#   6. Commit dist/ (if changed)
#   7. git tag <version>
#
# No push — the final message prints the commands to publish.

set -euo pipefail

# --- 1. Argument & format check ---
if [ -z "${1:-}" ]; then
    echo "Usage: $0 v<MAJOR>.<MINOR>.<PATCH>"
    echo "Example: $0 v2.1.7"
    exit 1
fi

VERSION="$1"
VERSION_NO_V="${VERSION#v}"

if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: version must match v<MAJOR>.<MINOR>.<PATCH> (got: $VERSION)" >&2
    exit 1
fi

# --- 2. Pre-flight checks ---
if [ -n "$(git status --porcelain)" ]; then
    echo "Error: working tree not clean. Commit or stash first." >&2
    git status --short >&2
    exit 1
fi

if git rev-parse -q --verify "refs/tags/$VERSION" >/dev/null; then
    echo "Error: tag $VERSION already exists." >&2
    exit 1
fi

BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "(detached)")
if [ "$BRANCH" != "main" ]; then
    printf "Warning: not on 'main' branch (current: %s). Continue? [y/N] " "$BRANCH"
    read -r reply
    case "$reply" in
        y|Y) ;;
        *) echo "Aborted."; exit 1 ;;
    esac
fi

echo "==> Releasing $VERSION"

# --- 3. Update VERSION ---
echo "$VERSION" > VERSION
echo "  - VERSION → $VERSION"

# --- 4. Prepend CHANGELOG skeleton ---
TODAY=$(date -u +"%Y-%m-%d")
CL_FILE="CHANGELOG.md"

SKELETON_FILE=$(mktemp)
cat > "$SKELETON_FILE" <<EOF
## [$VERSION_NO_V] - $TODAY

### Added
-

### Fixed
-

### Changed
-

---

EOF

# Insert skeleton just before the first existing "## [..." version header.
awk -v skelfile="$SKELETON_FILE" '
    !inserted && /^## \[/ {
        while ((getline line < skelfile) > 0) print line
        close(skelfile)
        inserted = 1
    }
    { print }
' "$CL_FILE" > "$CL_FILE.tmp"
mv "$CL_FILE.tmp" "$CL_FILE"
rm "$SKELETON_FILE"
echo "  - CHANGELOG.md skeleton prepended"

# --- 5. Editor pause ---
hash_file() {
    if command -v md5sum >/dev/null 2>&1; then
        md5sum "$1" | awk '{print $1}'
    else
        md5 -q "$1"
    fi
}
CL_BEFORE=$(hash_file "$CL_FILE")

EDITOR_CMD="${EDITOR:-vi}"
echo "  - Opening $EDITOR_CMD on $CL_FILE — fill entries, save & quit to continue."
$EDITOR_CMD "$CL_FILE"

CL_AFTER=$(hash_file "$CL_FILE")

if ! grep -q "^## \[$VERSION_NO_V\] - " "$CL_FILE"; then
    echo "Error: '## [$VERSION_NO_V]' header missing after edit." >&2
    echo "To restore: git checkout VERSION CHANGELOG.md" >&2
    exit 1
fi

if [ "$CL_BEFORE" = "$CL_AFTER" ]; then
    printf "Warning: CHANGELOG.md unchanged. Continue anyway? [y/N] "
    read -r reply
    case "$reply" in
        y|Y) ;;
        *) echo "Aborted. To restore: git checkout VERSION CHANGELOG.md"; exit 1 ;;
    esac
fi

# --- 6. Update jsDelivr CDN-pin in docs & wix snippet ---
# Replaces any `secra-op-tracking@vX.Y.Z` reference with the new tag so docs and
# embed examples don't drift behind the actual release.
CDN_PIN_FILES=(
    README.md
    GA4-gtag-Anleitung.md
    GTM-Events-Anleitung.md
    wix/wix-op-integration.html
)

# Portable in-place sed wrapper (BSD/macOS uses `-i ''`, GNU uses `-i`).
sed_inplace() {
    if sed --version >/dev/null 2>&1; then
        sed -i -E "$@"
    else
        sed -i '' -E "$@"
    fi
}

PIN_PATTERN='(secra-op-tracking@)v[0-9]+\.[0-9]+\.[0-9]+'
PINNED_FILES=()
for f in "${CDN_PIN_FILES[@]}"; do
    if [ ! -f "$f" ]; then
        echo "  - Warning: $f missing — skipping jsDelivr pin update" >&2
        continue
    fi
    sed_inplace "s|$PIN_PATTERN|\\1$VERSION|g" "$f"
    PINNED_FILES+=("$f")
done
echo "  - jsDelivr pin → $VERSION in: ${PINNED_FILES[*]:-(none)}"

# --- 7. Commit src/ + VERSION + CHANGELOG + pinned docs ---
git add VERSION CHANGELOG.md src/ "${PINNED_FILES[@]+"${PINNED_FILES[@]}"}"
git commit -m "Bump version to $VERSION; update CHANGELOG; pin docs/wix to $VERSION"
echo "  - Committed VERSION + CHANGELOG.md + src/ + pinned docs"

# --- 8. Build ---
./build.sh

# --- 9. Commit dist/ (skip if unchanged) ---
if [ -n "$(git status --porcelain dist/)" ]; then
    git add dist/
    git commit -m "Build dist/ for $VERSION"
    echo "  - Committed dist/"
else
    echo "  - dist/ unchanged (skipping commit)"
fi

# --- 10. Tag ---
git tag "$VERSION"
echo "  - Tagged $VERSION"

# --- 11. Final message ---
cat <<EOF

==> Local release of $VERSION complete.

To publish, push branch + tag:
  git push origin $BRANCH
  git push origin $VERSION
EOF
