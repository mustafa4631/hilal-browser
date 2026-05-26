#!/usr/bin/env bash
# Build, install, lint, and readiness-check the Hilal Flatpak manifest.

set -euo pipefail

# shellcheck source=lib.sh
. "$(dirname "$0")/lib.sh"

APP_ID="org.gkdevstudio.Hilal"
MANIFEST="$HILAL_REPO_ROOT/org.gkdevstudio.Hilal.yml"
BUILD_DIR="${HILAL_FLATPAK_BUILD_DIR:-$HILAL_REPO_ROOT/flatpak-build}"
REPO_DIR="${HILAL_FLATPAK_REPO_DIR:-$HILAL_REPO_ROOT/repo}"

usage() {
  cat <<'USAGE'
Usage:
  scripts/build-flatpak.sh build        # local build with this working tree as source
  scripts/build-flatpak.sh install      # build and install into the user Flatpak installation
  scripts/build-flatpak.sh run [args]   # run installed Flatpak
  scripts/build-flatpak.sh repo         # build and export a local OSTree repo
  scripts/build-flatpak.sh lint         # run available manifest/metadata linters
  scripts/build-flatpak.sh check-ready  # fail while release metadata is alpha/beta/nightly
  scripts/build-flatpak.sh clean        # remove local Flatpak build output

Environment:
  HILAL_FLATPAK_BUILD_DIR=/path/to/build-dir
  HILAL_FLATPAK_REPO_DIR=/path/to/repo
USAGE
}

need() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

tmp_manifest=""
tmp_source_root=""
cleanup() {
  [ -z "$tmp_manifest" ] || rm -f "$tmp_manifest"
  [ -z "$tmp_source_root" ] || rm -rf "$tmp_source_root"
}
trap cleanup EXIT

prepare_local_source() {
  tmp_source_root="$(mktemp -d "${TMPDIR:-/tmp}/hilal-flatpak-source.XXXXXX")"
  local source_dir="$tmp_source_root/hilal-browser"
  mkdir -p "$source_dir"

  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete \
      --exclude '/.git/' \
      --exclude '/.flatpak-builder/' \
      --exclude '/artifacts/' \
      --exclude '/dist/' \
      --exclude '/firefox/' \
      --exclude '/flatpak-build/' \
      --exclude '/repo/' \
      --exclude '*.dmg' \
      --exclude '*.flatpak' \
      --exclude '*.flatpakref' \
      --exclude '*.flatpakrepo' \
      "$HILAL_REPO_ROOT/" "$source_dir/"
  else
    (
      cd "$HILAL_REPO_ROOT"
      tar \
        --exclude './.git' \
        --exclude './.flatpak-builder' \
        --exclude './artifacts' \
        --exclude './dist' \
        --exclude './firefox' \
        --exclude './flatpak-build' \
        --exclude './repo' \
        --exclude '*.dmg' \
        --exclude '*.flatpak' \
        --exclude '*.flatpakref' \
        --exclude '*.flatpakrepo' \
        -cf - .
    ) | tar -xf - -C "$source_dir"
  fi

  printf '%s\n' "$source_dir"
}

render_local_manifest() {
  tmp_manifest="$(mktemp "${TMPDIR:-/tmp}/hilal-flatpak.XXXXXX.yml")"
  local local_source
  local_source="$(prepare_local_source)"
  local local_source_escaped="${local_source//\"/\\\"}"
  awk -v repo="$local_source_escaped" '
    /# HILAL_SOURCE_BEGIN/ {
      print
      print "      - type: dir"
      print "        path: \"" repo "\""
      print "        dest: hilal-browser"
      skip = 1
      next
    }
    /# HILAL_SOURCE_END/ {
      skip = 0
      print
      next
    }
    skip != 1 { print }
  ' "$MANIFEST" > "$tmp_manifest"
  printf '%s\n' "$tmp_manifest"
}

flatpak_build_manifest() {
  need flatpak-builder
  local manifest
  manifest="$(render_local_manifest)"
  flatpak-builder --force-clean "$@" "$BUILD_DIR" "$manifest"
}

flatpak_lint() {
  if command -v flatpak-builder-lint >/dev/null 2>&1; then
    flatpak-builder-lint manifest "$MANIFEST"
  elif command -v flatpak >/dev/null 2>&1; then
    flatpak run --command=flatpak-builder-lint org.flatpak.Builder manifest "$MANIFEST"
  else
    warn "Skipping flatpak-builder-lint: install flatpak-builder-lint or org.flatpak.Builder."
  fi

  if command -v desktop-file-validate >/dev/null 2>&1; then
    desktop-file-validate "$HILAL_REPO_ROOT/flatpak/$APP_ID.desktop"
  else
    warn "Skipping desktop-file-validate: command not found."
  fi

  if command -v appstreamcli >/dev/null 2>&1; then
    appstreamcli validate --strict "$HILAL_REPO_ROOT/flatpak/$APP_ID.metainfo.xml"
  else
    warn "Skipping appstreamcli: command not found."
  fi

  if [ -d "$REPO_DIR" ]; then
    if command -v flatpak-builder-lint >/dev/null 2>&1; then
      flatpak-builder-lint repo "$REPO_DIR"
    elif command -v flatpak >/dev/null 2>&1; then
      flatpak run --command=flatpak-builder-lint org.flatpak.Builder repo "$REPO_DIR"
    fi
  else
    warn "Skipping repo lint: $REPO_DIR does not exist yet."
  fi
}

display_version() {
  awk '/^\+[0-9]/{ sub(/^\+/, ""); print; exit }' "$HILAL_REPO_ROOT/patches/0009-hilal-version.patch"
}

manifest_hilal_tag() {
  awk '
    /url: https:\/\/github.com\/VastSea0\/hilal-browser.git/ { in_source = 1 }
    in_source && /tag:/ { print $2; exit }
  ' "$MANIFEST"
}

check_stable_ready() {
  local version tag bad=0
  version="$(display_version)"
  tag="$(manifest_hilal_tag)"

  case "$version" in
    *alpha*|*beta*|*nightly*|*dev*|*a[0-9]*)
      warn "Display version is not Flathub-stable ready: $version"
      bad=1
      ;;
  esac

  case "$tag" in
    *alpha*|*beta*|*nightly*|*dev*|*a[0-9]*|"")
      warn "Manifest source tag is not Flathub-stable ready: ${tag:-<missing>}"
      bad=1
      ;;
  esac

  if [ "$bad" = 1 ]; then
    die "Flatpak packaging is present, but Flathub stable submission must wait for a stable release tag."
  fi

  log "Flatpak metadata is stable-release ready: version=$version tag=$tag"
}

cmd="${1:-build}"
case "$cmd" in
  -h|--help|help)
    usage
    ;;
  build)
    flatpak_build_manifest
    ;;
  install)
    flatpak_build_manifest --user --install
    ;;
  repo)
    flatpak_build_manifest --repo="$REPO_DIR"
    log "Local Flatpak repo exported to: $REPO_DIR"
    ;;
  run)
    shift
    need flatpak
    flatpak run "$APP_ID" "$@"
    ;;
  lint)
    flatpak_lint
    ;;
  check-ready)
    check_stable_ready
    ;;
  clean)
    rm -rf "$BUILD_DIR" "$REPO_DIR"
    log "Removed $BUILD_DIR and $REPO_DIR"
    ;;
  *)
    usage >&2
    die "Unknown command: $cmd"
    ;;
esac
