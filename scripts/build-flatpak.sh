#!/usr/bin/env bash
#
# scripts/build-flatpak.sh
# Flatpak build, install, run, lint, clean ve readiness-check otomasyonu.
# Sadece dist/ klasöründeki derleme ciktisini (tar.xz) kaynak olarak kullanacak sekilde modifiye edilmistir.
# Git tag bilgisini ve tarihini alarak dinamik isimlendirme ve manifest güncellemesi yapar.
#
# Kullanim:
# scripts/build-flatpak.sh build        # Flatpak paketi olustur
# scripts/build-flatpak.sh install      # Flatpak olustur ve kullanici kurulumuna yukle
# scripts/build-flatpak.sh run [args]   # Kurulu Flatpak'i calistir
# scripts/build-flatpak.sh lint         # Manifest ve metadata linter'larini calistir
# scripts/build-flatpak.sh check-ready  # Surum metadata'sinin kararli yayina uygunlugunu kontrol et
# scripts/build-flatpak.sh clean        # Flatpak build ciktilarini temizle

set -euo pipefail

# Renk Tanımlamaları
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Yardımcı Kütüphane Yükleme ve Varsayılan Loglama Fonksiyonları
if [ -f "$(dirname "$0")/lib.sh" ]; then
    # shellcheck source=/dev/null
    . "$(dirname "$0")/lib.sh"
else
    log() { echo -e "${BLUE}[INFO]${NC} $*"; }
    warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
    die() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }
fi

# Dizin ve Yapılandırma Tanımlamaları
HILAL_REPO_ROOT="$(cd "$(dirname "$0")/../" && pwd)"
TARGET_DIST_DIR="${HILAL_REPO_ROOT}/dist"
CONFIG_FILE="${HILAL_REPO_ROOT}/config.yml"
APP_ID="org.gkdevstudio.Hilal"
BUILD_DIR="${HILAL_REPO_ROOT}/flatpak-build"
REPO_DIR="${HILAL_REPO_ROOT}/repo"

usage() {
    cat <<'USAGE'
Kullanim:
  scripts/build-flatpak.sh build        # Flatpak paketi olustur (Sadece dist/ altindaki paketi kullanir)
  scripts/build-flatpak.sh install      # Flatpak olustur ve kullanici kurulumuna yukle
  scripts/build-flatpak.sh run [args]   # Kurulu Flatpak'i calistir
  scripts/build-flatpak.sh lint         # Manifest ve metadata linter'larini calistir
  scripts/build-flatpak.sh check-ready  # Surum metadata'sinin kararli yayina uygunlugunu kontrol et
  scripts/build-flatpak.sh clean        # Flatpak build ciktilarini temizle
USAGE
}

need() {
    command -v "$1" >/dev/null 2>&1 || die "Gerekli komut bulunamadi: $1"
}

# Git tag ve tarih bilgilerini alma
get_git_tag() {
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        git describe --tags --abbrev=0 2>/dev/null || echo "v0.1.0"
    else
        echo "v0.1.0"
    fi
}

get_git_date() {
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        local tag
        tag=$(get_git_tag)
        # Tag'in oluşturulma tarihini YYYYMMDD formatında alıyoruz
        git log -1 --format=%cd --date=format:'%Y%m%d' "$tag" 2>/dev/null || date +'%Y%m%d'
    else
        date +'%Y%m%d'
    fi
}

find_package() {
    local pkg
    # Sadece ana dist/ dizininde tar.xz veya tar.gz paketleri araniyor
    pkg=$(find "$TARGET_DIST_DIR" -maxdepth 1 -type f \( \
        -name "firefox-*.tar.xz" -o \
        -name "firefox-*.tar.gz" -o \
        -name "hilal-*.tar.xz" -o \
        -name "hilal-*.tar.gz" \
    \) 2>/dev/null | head -1 || true)
    printf '%s\n' "$pkg"
}

find_manifest() {
    local candidate
    for candidate in \
        "$HILAL_REPO_ROOT/flatpak/$APP_ID.json" \
        "$HILAL_REPO_ROOT/$APP_ID.json" \
        "$HILAL_REPO_ROOT/flatpak/org.gkdevstudio.Hilal.json" \
        "$HILAL_REPO_ROOT/org.gkdevstudio.Hilal.json"; do
        if [ -f "$candidate" ]; then
            echo "$candidate"
            return 0
        fi
    done
    return 0
}

display_version() {
    local version_patch="$HILAL_REPO_ROOT/patches/0009-hilal-version.patch"
    if [ -f "$version_patch" ]; then
        awk '/^+[0-9]/{ sub(/^+/, ""); print; exit }' "$version_patch"
    else
        get_git_tag
    fi
}

manifest_hilal_tag() {
    local manifest_path
    manifest_path=$(find_manifest)
    if [ -n "$manifest_path" ] && [ -f "$manifest_path" ]; then
        # JSON yapısı içinde tag araması yapıyoruz
        grep -oP '"tag":\s*"\K[^"]+' "$manifest_path" | head -1 || echo ""
    else
        echo ""
    fi
}

flatpak_lint() {
    local manifest_path
    manifest_path=$(find_manifest)
    if [ -z "$manifest_path" ]; then
        echo -e "${RED}[Hata]${NC} Linter calistirilamadi: Manifest bulunamadi."
        return 1
    fi
    echo -e "${BLUE}[Lint]${NC} Manifest ve uygulama metadata'lari dogrulaniyor..."
    
    if command -v flatpak-builder-lint >/dev/null 2>&1; then
        flatpak-builder-lint manifest "$manifest_path"
    elif command -v flatpak >/dev/null 2>&1; then
        flatpak run --command=flatpak-builder-lint org.flatpak.Builder manifest "$manifest_path"
    else
        warn "Skipping flatpak-builder-lint: install flatpak-builder-lint or org.flatpak.Builder."
    fi

    local desktop_file="$HILAL_REPO_ROOT/flatpak/$APP_ID.desktop"
    if [ -f "$desktop_file" ] && command -v desktop-file-validate >/dev/null 2>&1; then
        desktop-file-validate "$desktop_file"
    else
        warn "Skipping desktop-file-validate: command not found or desktop file missing."
    fi

    local metainfo_file="$HILAL_REPO_ROOT/flatpak/$APP_ID.metainfo.xml"
    if [ -f "$metainfo_file" ] && command -v appstreamcli >/dev/null 2>&1; then
        appstreamcli validate --strict "$metainfo_file"
    else
        warn "Skipping appstreamcli: command not found or metainfo file missing."
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
            warn "Manifest source tag is not Flathub-stable ready: ${tag:-}"
            bad=1
            ;;
    esac
    if [ "$bad" = 1 ]; then
        die "Flatpak packaging is present, but Flathub stable submission must wait for a stable release tag."
    fi
    log "Flatpak metadata is stable-release ready: version=$version tag=$tag"
}

# Kilitli kalan FUSE bağlama noktalarını güvenli bir şekilde çözen fonksiyon
force_cleanup_fuse() {
    local mountpoint
    # .flatpak-builder altındaki rofiles bağlama noktalarını bulup zorla ayırıyoruz
    if [ -d "$HILAL_REPO_ROOT/.flatpak-builder" ]; then
        find "$HILAL_REPO_ROOT/.flatpak-builder" -type d -name "rofiles-*" 2>/dev/null | while read -r mountpoint; do
            if mountpoint -q "$mountpoint" 2>/dev/null || (command -v gvfs-mount >/dev/null && gvfs-mount -l 2>/dev/null | grep -q "$mountpoint"); then
                echo -e "${YELLOW}[Temizlik]${NC} Kilitli FUSE baglama noktası temizleniyor: $mountpoint"
                if command -v fusermount3 >/dev/null 2>&1; then
                    fusermount3 -u -z "$mountpoint" 2>/dev/null || true
                elif command -v fusermount >/dev/null 2>&1; then
                    fusermount -u -z "$mountpoint" 2>/dev/null || true
                else
                    umount -l "$mountpoint" 2>/dev/null || true
                fi
            fi
        done
    fi
}

cmd="${1:-build}"
case "$cmd" in
    -h|--help|help)
        usage
        exit 0
        ;;
    run)
        need flatpak
        log "Hilal Flatpak baslatiliyor: $APP_ID"
        shift
        flatpak run "$APP_ID" "$@"
        exit 0
        ;;
    lint)
        flatpak_lint
        exit 0
        ;;
    check-ready)
        check_stable_ready
        exit 0
        ;;
    clean)
        force_cleanup_fuse
        rm -rf "$BUILD_DIR" "$REPO_DIR"
        rm -rf "$TARGET_DIST_DIR/flatpak-src"
        log "Gecici Flatpak derleme dizinleri temizlendi."
        exit 0
        ;;
    build|install)
        # build veya install altında devam edecek
        ;;
    *)
        usage >&2
        die "Bilinmeyen komut: $cmd"
        ;;
esac

# Ön aşamada kilitli kalmış olabilecek FUSE mount'ları temizleyelim
force_cleanup_fuse

echo -e "${BLUE}[Flatpak Otomasyon]${NC} dist/ klasorunde yerel paket taramasi yapiliyor..."
PACKAGE_FILE=$(find_package)
if [ -z "$PACKAGE_FILE" ]; then
    echo -e "${RED}[Hata]${NC} Flatpak olusturabilmek icin 'dist/' altinda derlenmis bir paket (.tar.xz veya .tar.gz) bulunmalidir!" >&2
    echo -e "${YELLOW}[Ipucu]${NC} Lutfen derleme ciktisini 'dist/' klasorune tasiyin veya kopyalayin." >&2
    exit 1
fi
echo -e "${GREEN}[Bulunan Paket]${NC} $PACKAGE_FILE"

# Git'ten sürüm ve tarih etiketlerini çekiyoruz
GIT_TAG=$(get_git_tag)
GIT_DATE=$(get_git_date)
echo -e "${GREEN}[Git Detaylari]${NC} En son Tag: $GIT_TAG | Tag Tarihi: $GIT_DATE"

# Geçici yerel kaynak dizini oluşturup paketi oraya açıyoruz
LOCAL_SRC_DIR="$TARGET_DIST_DIR/flatpak-src"
echo -e "${BLUE}[Islem]${NC} Paket gecici Flatpak kaynak dizinine aciliyor: $LOCAL_SRC_DIR"
rm -rf "$LOCAL_SRC_DIR"
mkdir -p "$LOCAL_SRC_DIR"
tar -xf "$PACKAGE_FILE" -C "$LOCAL_SRC_DIR" --strip-components=1

# flatpak/ klasöründeki yardımcı dosyaları kaynak klasörüne aktarıyoruz
if [ -d "$HILAL_REPO_ROOT/flatpak" ]; then
    echo -e "${BLUE}[Islem]${NC} flatpak/ altindaki yardimci dosyalar kaynak dizinine kopyalaniyor..."
    find "$HILAL_REPO_ROOT/flatpak" -maxdepth 1 ! -name "*.json" ! -name "*.json.bak" -not -path "$HILAL_REPO_ROOT/flatpak" -exec cp -R -t "$LOCAL_SRC_DIR/" {} +
fi
if [ -d "$HILAL_REPO_ROOT/branding/hilal" ]; then
    echo -e "${BLUE}[Islem]${NC} branding/hilal altindaki ikonlar kaynak dizinine kopyalaniyor..."
    mkdir -p "$LOCAL_SRC_DIR/branding/hilal"
    cp "$HILAL_REPO_ROOT/branding/hilal"/default*.png "$LOCAL_SRC_DIR/branding/hilal/" 2>/dev/null || true
fi

# Flatpak manifest dosyasını buluyoruz
MANIFEST_PATH=$(find_manifest)
if [ -z "$MANIFEST_PATH" ]; then
    echo -e "${RED}[Hata]${NC} Flatpak manifest dosyasi ($APP_ID.json) bulunamadi!" >&2
    exit 1
fi
echo -e "${GREEN}[Bulunan Manifest]${NC} $MANIFEST_PATH"

# Orijinal manifest dosyasını yedekliyoruz ve çıkışta geri yüklüyoruz
MANIFEST_BAK="${MANIFEST_PATH}.bak"
cp "$MANIFEST_PATH" "$MANIFEST_BAK"
cleanup() {
    if [ -f "$MANIFEST_BAK" ]; then
        echo -e "${BLUE}[Temizlik]${NC} Orijinal Flatpak manifest dosyası geri yukleniyor..."
        mv "$MANIFEST_BAK" "$MANIFEST_PATH"
    fi
    rm -rf "$LOCAL_SRC_DIR"
    force_cleanup_fuse
}
trap cleanup EXIT INT TERM

# Python kullanarak manifest içindeki uzak kaynak tanımını ve tag değerlerini güncelliyoruz
echo -e "${BLUE}[Islem]${NC} Flatpak manifesti dinamik Git bilgileriyle yerel kaynaklara yonlendiriliyor..."
MANIFEST_PATH="$MANIFEST_PATH" LOCAL_SRC_DIR="$LOCAL_SRC_DIR" GIT_TAG="$GIT_TAG" python3 - <<'EOF'
import json
import sys
import os

manifest_file = os.environ['MANIFEST_PATH']
local_dir = os.environ['LOCAL_SRC_DIR']
git_tag = os.environ['GIT_TAG']

with open(manifest_file, 'r') as f:
    try:
        data = json.load(f)
    except Exception as e:
        print(f"JSON Ayristirma Hatasi: {e}")
        sys.exit(1)

patched_count = 0

def patch_recursive(node):
    global patched_count
    if isinstance(node, dict):
        name = node.get('name', '')
        if isinstance(name, str) and any(x in name.lower() for x in ['hilal', 'firefox']):
            node['sources'] = [{
                "type": "dir",
                "path": local_dir
            }]
            # Git ile ilgili diğer parametreleri temizliyoruz
            node.pop('branch', None)
            node.pop('tag', None)
            node.pop('commit', None)
            print(f"-> '{name}' modulu yerel dizine ({local_dir}) yonlendirildi.")
            patched_count += 1

        # İç içe geçmiş modülleri taramak için rekürsif çağrı
        for key, val in list(node.items()):
            patch_recursive(val)
            
    elif isinstance(node, list):
        for item in node:
            patch_recursive(item)

# Rekürsif taramayı başlat
patch_recursive(data)

# Eğer hiçbir eşleşme bulunamazsa emniyet kilidi olarak son modülü yamalayalım
if patched_count == 0 and 'modules' in data and len(data['modules']) > 0:
    last_mod = data['modules'][-1]
    last_mod['sources'] = [{
        "type": "dir",
        "path": local_dir
    }]
    print(f"-> Son modul olan '{last_mod.get('name')}' emniyet kilidi amaciyla yerel dizine yonlendirildi.")

# Üst düzey metadata kısmında veya gerekli yerlerde tag güncellemesi yapıyoruz
if 'x-git-tag' in data:
    data['x-git-tag'] = git_tag
if 'tag' in data:
    data['tag'] = git_tag

with open(manifest_file, 'w') as f:
    json.dump(data, f, indent=2)
EOF

# --- BİRİNCİ DENEME: Standart Derleme (FUSE rofiles aktif) ---
echo -e "${BLUE}[Flatpak Otomasyon]${NC} Flatpak $cmd sureci baslatiliyor..."
FLATPAK_BUNDLE_NAME="hilal-${GIT_TAG}-${GIT_DATE}.flatpak"
FLATPAK_BUNDLE=""
mkdir -p "$BUILD_DIR"
BUILD_SUCCESS=0

log "Standart Flatpak derlemesi baslatiliyor..."
if [ "$cmd" = "install" ]; then
    if flatpak-builder --force-clean --user --install "$BUILD_DIR" "$MANIFEST_PATH"; then
        BUILD_SUCCESS=1
    fi
else
    if flatpak-builder --force-clean --repo="$REPO_DIR" "$BUILD_DIR" "$MANIFEST_PATH"; then
        BUILD_SUCCESS=1
    fi
fi

# --- İKİNCİ DENEME: Geri Çekilme (Fallback) Modu ---
# Eğer standart derleme hata verirse, FUSE kilidini çözer ve --no-rofiles-fuse ile dener
if [ "$BUILD_SUCCESS" -eq 0 ]; then
    warn "Standart derleme basarisiz oldu (muhtemelen FUSE/rofiles kilitleme sorunu)."
    warn "Otomatik kurtarma baslatiliyor: Askida kalan baglantilar temizleniyor ve --no-rofiles-fuse parametresi ile tekrar deneniyor..."

    # Askıda kalmış FUSE mount'larını zorla temizle
    force_cleanup_fuse
    if [ "$cmd" = "install" ]; then
        flatpak-builder --force-clean --no-rofiles-fuse --user --install "$BUILD_DIR" "$MANIFEST_PATH"
    else
        flatpak-builder --force-clean --no-rofiles-fuse --repo="$REPO_DIR" "$BUILD_DIR" "$MANIFEST_PATH"
    fi
    log "Yedek derleme modu (--no-rofiles-fuse) basariyla tamamlandi!"
fi

# --- BUILD KOMUTU SONRASI İŞLEMLER ---
if [ "$cmd" != "install" ]; then
    FLATPAK_BUNDLE="$TARGET_DIST_DIR/$FLATPAK_BUNDLE_NAME"
    echo -e "${BLUE}[Islem]${NC} Dinamik Flatpak bundle olusturuluyor: $FLATPAK_BUNDLE"
    flatpak build-bundle "$REPO_DIR" "$FLATPAK_BUNDLE" "$APP_ID"
fi
echo -e "\n--------------------------------------------------"

# --- KONFİGÜRASYON DOSYASI (config.yml) YÖNETİMİ ---
CURRENT_BUILD=0
if [ -f "$CONFIG_FILE" ]; then
    CURRENT_BUILD=$(grep -E '^build_count:' "$CONFIG_FILE" | awk '{print $2}' || echo 0)
    if [[ ! "$CURRENT_BUILD" =~ ^[0-9]+$ ]]; then
        CURRENT_BUILD=0
    fi
else
    mkdir -p "$(dirname "$CONFIG_FILE")"
    echo "build_count: 0" > "$CONFIG_FILE"
fi
NEXT_BUILD=$((CURRENT_BUILD + 1))

# --- CONFIG DOSYASINI YERİNDE GÜNCELLEME ---
sed -i "s/^build_count:.*/build_count: $NEXT_BUILD/" "$CONFIG_FILE" 2>/dev/null || \
echo "build_count: $NEXT_BUILD" > "$CONFIG_FILE"

# --- INSTALL KOMUTU SONRASI İŞLEMLER ---
if [ "$cmd" = "install" ]; then
    if flatpak info "$APP_ID" >/dev/null 2>&1; then
        echo -e "${GREEN}[Basarili]${NC} Flatpak basariyla kuruldu: $APP_ID"
        echo -e "${YELLOW}[Calistirmak icin]${NC} scripts/build-flatpak.sh run"
    else
        echo -e "${YELLOW}[Bilgi]${NC} Flatpak build tamamlandi. Kurulum dogrulamasi yapilamadi."
    fi
    exit 0
fi

# --- BUILD KOMUTU SONRASI İŞLEMLER ---
if [ -n "$FLATPAK_BUNDLE" ] && [ -f "$FLATPAK_BUNDLE" ]; then
    echo -e "${GREEN}[Basarili]${NC} Flatpak bundle dist/ dizinine kaydedildi: $FLATPAK_BUNDLE"
else
    echo -e "${YELLOW}[Bilgi]${NC} Flatpak build tamamlandi. Bundle dosyasi otomatik olarak tespit edilemedi."
    echo -e "${YELLOW}[Bilgi]${NC} Flatpak kurulumu 'scripts/build-flatpak.sh install' komutu ile yapilabilir."
fi

log "Done."