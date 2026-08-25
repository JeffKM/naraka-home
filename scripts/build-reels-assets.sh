#!/usr/bin/env bash
# 릴스 최종본 → 홈페이지 에셋 일괄 생성 (여정 역재생 프레임·스틸·스토리 영상·원화 webp)
# 주의: 로컬 ffmpeg에 libwebp가 없어 PNG 중간 산출 후 PIL로 WebP 변환한다.
set -euo pipefail

SRC="${REELS_SRC:-$HOME/Desktop/naraka/reels/07-ae/naraka_reels_fianl.mp4}"
FRAME_PNG="${INSTA_FRAME_SRC:-$HOME/Desktop/naraka/reels/06-ae-assets/insta-frame.png}"
COMIC_DIR="${COMIC_SRC:-$HOME/Desktop/naraka/story}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUB="$ROOT/public"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 1) 여정 역재생 프레임 — 74.0~80.0초를 역순 12fps로 72장 (데스크톱 1080·모바일 720 세로)
rm -rf "$PUB/journey/desktop" "$PUB/journey/mobile" "$PUB/journey/stills"
mkdir -p "$PUB/journey/desktop" "$PUB/journey/mobile" "$PUB/journey/stills" "$PUB/story/comic" \
  "$TMP/desktop" "$TMP/mobile" "$TMP/stills"
ffmpeg -v error -ss 74.0 -t 6.0 -i "$SRC" -vf "reverse,fps=12,scale=-2:1080" "$TMP/desktop/s_%04d.png"
ffmpeg -v error -ss 74.0 -t 6.0 -i "$SRC" -vf "reverse,fps=12,scale=-2:720" "$TMP/mobile/s_%04d.png"

# 2) 스틸 3종 — 정적 폴백(모션 축소)·재방문 축약 히어로용 (+ /story 포스터 공용 소스)
ffmpeg -v error -y -ss 74.0 -i "$SRC" -frames:v 1 -vf scale=-2:1080 "$TMP/stills/group.png"
ffmpeg -v error -y -ss 76.5 -i "$SRC" -frames:v 1 -vf scale=-2:1080 "$TMP/stills/frame.png"
ffmpeg -v error -y -ss 78.5 -i "$SRC" -frames:v 1 -vf scale=-2:1080 "$TMP/stills/desk.png"

# 3) 스토리 영상 웹용 재인코딩(+faststart)
ffmpeg -v error -y -i "$SRC" -c:v libx264 -crf 23 -preset slow -maxrate 4M -bufsize 8M \
  -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "$PUB/story/naraka-story.mp4"

# 4) PIL 일괄 WebP 변환 — 여정 프레임·스틸·포스터·인스타 프레임(알파 유지)·원화 17장
python3 - "$TMP" "$FRAME_PNG" "$COMIC_DIR" "$PUB" <<'PY'
import glob
import os
import sys

from PIL import Image

tmp, frame_png, comic_dir, pub = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

# 여정 프레임 (데스크톱 q78 / 모바일 q75)
for sub, q in (("desktop", 78), ("mobile", 75)):
    for p in sorted(glob.glob(f"{tmp}/{sub}/s_*.png")):
        name = os.path.splitext(os.path.basename(p))[0]
        Image.open(p).convert("RGB").save(f"{pub}/journey/{sub}/{name}.webp", "WEBP", quality=q)

# 스틸 3종 + 포스터(단체샷 공용)
for name in ("group", "frame", "desk"):
    im = Image.open(f"{tmp}/stills/{name}.png").convert("RGB")
    im.save(f"{pub}/journey/stills/{name}.webp", "WEBP", quality=82)
Image.open(f"{tmp}/stills/group.png").convert("RGB").save(f"{pub}/story/poster.webp", "WEBP", quality=82)

# 인스타 프레임 (알파 유지 540×960)
frame = Image.open(frame_png).convert("RGBA").resize((540, 960), Image.LANCZOS)
frame.save(f"{pub}/story/insta-frame.webp", "WEBP", quality=90)

# 치비 원화 17장 (폭 840)
for i in range(1, 18):
    src = Image.open(f"{comic_dir}/{i}.png").convert("RGB")
    w = 840
    h = round(src.height * w / src.width)
    src.resize((w, h), Image.LANCZOS).save(f"{pub}/story/comic/{i:02d}.webp", "WEBP", quality=85)
PY

echo "desktop $(ls "$PUB/journey/desktop" | wc -l)장 / mobile $(ls "$PUB/journey/mobile" | wc -l)장"
du -sh "$PUB/journey" "$PUB/story"
