#!/bin/bash
set -euo pipefail

# Build a minimal static ffmpeg with only the features our app needs
# Output: src-tauri/binaries/ffmpeg-{target-triple}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR" && pwd)"
BINARIES_DIR="$PROJECT_DIR/src-tauri/binaries"
WORK_DIR="$PROJECT_DIR/.ffmpeg-build"

# ---- Platform detection ----
ARCH="$(uname -m)"
OS="$(uname -s)"

case "$OS-$ARCH" in
    Darwin-x86_64)  TARGET="x86_64-apple-darwin" ;;
    Darwin-arm64)   TARGET="aarch64-apple-darwin" ;;
    Linux-x86_64)   TARGET="x86_64-unknown-linux-gnu" ;;
    Linux-aarch64)  TARGET="aarch64-unknown-linux-gnu" ;;
    *)
        echo "Unsupported platform: $OS-$ARCH"
        echo "Build manually and place binary in $BINARIES_DIR/ffmpeg-{triple}"
        exit 1
        ;;
esac

OUTPUT="$BINARIES_DIR/ffmpeg-$TARGET"
mkdir -p "$BINARIES_DIR"

# Check if already built
if [ -f "$OUTPUT" ] && [ -x "$OUTPUT" ] && [ "$(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT" 2>/dev/null)" -gt 1000000 ]; then
    echo "ffmpeg already built for $TARGET: $(ls -lh "$OUTPUT" | awk '{print $5}')"
    exit 0
fi

NPROC="$(sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo 4)"
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"

cd "$WORK_DIR"

# === Build x264 ===
echo ">>> Building x264 (static)..."
git clone --depth 1 https://code.videolan.org/videolan/x264.git
cd x264
./configure \
    --enable-static --disable-shared \
    --disable-cli --enable-pic \
    --extra-cflags="-Os" \
    --prefix="$WORK_DIR/install"
make -j"$NPROC"
make install
cd "$WORK_DIR"

# === Build minimal ffmpeg ===
echo ">>> Building ffmpeg (minimal)..."
curl -sL -o ffmpeg.tar.gz "https://ffmpeg.org/releases/ffmpeg-7.1.tar.gz"
tar -xzf ffmpeg.tar.gz
cd ffmpeg-7.1

CFLAGS="-Os -fvisibility=hidden"
LDFLAGS="-dead_strip -Wl,-S"
LIBS="-lpthread -lm -lz"

if [ "$OS" = "Darwin" ]; then
    INDV="--enable-indev=avfoundation"
    # Avoid building X11-related components on macOS
    DISABLE_X11="--disable-xlib --disable-sdl2"
else
    INDV="--enable-indev=x11grab"
    DISABLE_X11=""
fi

PKG_CONFIG_PATH="$WORK_DIR/install/lib/pkgconfig" \
CPPFLAGS="-I$WORK_DIR/install/include" \
LDFLAGS="-L$WORK_DIR/install/lib $LDFLAGS" \
./configure \
    --enable-small \
    --disable-everything \
    --enable-libx264 --enable-gpl \
    --enable-encoder=libx264,aac,png \
    --enable-decoder=h264,aac,png,mjpeg,rawvideo,pcm_f32le \
    --enable-muxer=mp4,mov,matroska,image2 \
    --enable-demuxer=mov,matroska,image2 \
    --enable-protocol=file \
    --enable-filter=crop,scale,aresample \
    --enable-parser=h264,aac,mjpeg \
    --enable-bsf=h264_mp4toannexb \
    --disable-doc --disable-ffplay --disable-ffprobe \
    --disable-network --disable-iconv \
    --enable-ffmpeg --enable-runtime-cpudetect \
    $INDV $DISABLE_X11 \
    --extra-cflags="$CFLAGS" \
    --extra-ldflags="$LDFLAGS" \
    --extra-libs="$LIBS" \
    --pkg-config-flags=--static

make -j"$NPROC"

# Strip and install
strip ffmpeg
cp ffmpeg "$OUTPUT"
chmod +x "$OUTPUT"

echo ""
echo "============================================"
echo " Built minimal ffmpeg for $TARGET"
ls -lh "$OUTPUT"
echo "============================================"

# Cleanup
cd "$PROJECT_DIR"
rm -rf "$WORK_DIR"
