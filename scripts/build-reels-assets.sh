#!/usr/bin/env bash
# 릴스 최종본 → 홈페이지 에셋 일괄 생성 (히어로 하이라이트 루프·포스터·스토리 영상·원화 webp)
# 주의: 로컬 ffmpeg에 libwebp가 없어 PNG 중간 산출 후 PIL로 WebP 변환한다.
set -euo pipefail

SRC="${REELS_SRC:-$HOME/Desktop/naraka/reels/07-ae/naraka_reels_final_v2.mp4}"
FRAME_PNG="${INSTA_FRAME_SRC:-$HOME/Desktop/naraka/reels/06-ae-assets/insta-frame.png}"
COMIC_DIR="${COMIC_SRC:-$HOME/Desktop/naraka/story}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUB="$ROOT/public"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 1) 히어로 하이라이트 루프 — 4컷 12초(발차기 18~22 / 물대포 59~62 / 종신 도장 66.5~68.5 / 단체샷 72.5~75.5)
#    540×960 무음, 인스타 프레임 소품 창 안에서 음소거 자동 루프 (DeskHero)
mkdir -p "$PUB/home" "$PUB/story/comic" "$TMP/stills"
ffmpeg -v error -y -i "$SRC" -filter_complex \
  "[0:v]trim=18:22,setpts=PTS-STARTPTS[a];[0:v]trim=59:62,setpts=PTS-STARTPTS[b];[0:v]trim=66.5:68.5,setpts=PTS-STARTPTS[c];[0:v]trim=72.5:75.5,setpts=PTS-STARTPTS[d];[a][b][c][d]concat=n=4:v=1:a=0,scale=540:960[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 26 -maxrate 1500k -bufsize 3000k -pix_fmt yuv420p \
  -movflags +faststart "$PUB/home/hero-loop.mp4"

# 2) 스틸 — 히어로 포스터(단체샷 72.8초, 540×960) + /story 포스터(단체샷 74.0초)
ffmpeg -v error -y -ss 72.8 -i "$SRC" -frames:v 1 -vf scale=540:960 "$TMP/stills/hero.png"
ffmpeg -v error -y -ss 74.0 -i "$SRC" -frames:v 1 -vf scale=-2:1080 "$TMP/stills/group.png"

# 3) 스토리 영상 웹용 재인코딩(+faststart)
ffmpeg -v error -y -i "$SRC" -c:v libx264 -crf 23 -preset slow -maxrate 4M -bufsize 8M \
  -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "$PUB/story/naraka-story.mp4"

# 4) PIL 일괄 WebP 변환 — 포스터 2종·인스타 프레임(알파 유지)·원화 17장
python3 - "$TMP" "$FRAME_PNG" "$COMIC_DIR" "$PUB" <<'PY'
import glob
import os
import sys

from PIL import Image, ImageDraw

tmp, frame_png, comic_dir, pub = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

# 포스터 2종 — 히어로(540×960) / 스토리(단체샷)
Image.open(f"{tmp}/stills/hero.png").convert("RGB").save(f"{pub}/home/hero-poster.webp", "WEBP", quality=85)
Image.open(f"{tmp}/stills/group.png").convert("RGB").save(f"{pub}/story/poster.webp", "WEBP", quality=82)

# 인스타 프레임 (알파 유지 540×960) — 원본은 폰 바깥에 인스타 다크 배경(#0e0d11)이 불투명으로 남아 있어
# 모서리에서 배경색 flood-fill로 투명화한다 (폰 바 #16151c는 임계 밖이라 보존)
frame = Image.open(frame_png).convert("RGBA").resize((540, 960), Image.LANCZOS)
flat = Image.new("RGBA", frame.size, (14, 13, 17, 255))
flat.alpha_composite(frame)
probe = flat.convert("RGB")
SENTINEL = (255, 0, 255)
for seed in ((0, 0), (539, 0), (0, 959), (539, 959), (270, 0), (0, 480), (539, 480)):
    ImageDraw.floodfill(probe, seed, SENTINEL, thresh=30)
hit = probe.load()
px = frame.load()
for y in range(960):
    for x in range(540):
        if hit[x, y] == SENTINEL:
            r, g, b, _ = px[x, y]
            px[x, y] = (r, g, b, 0)
frame.save(f"{pub}/story/insta-frame.webp", "WEBP", quality=90)

# 치비 원화 17장 (폭 840)
for i in range(1, 18):
    src = Image.open(f"{comic_dir}/{i}.png").convert("RGB")
    w = 840
    h = round(src.height * w / src.width)
    src.resize((w, h), Image.LANCZOS).save(f"{pub}/story/comic/{i:02d}.webp", "WEBP", quality=85)
PY

ls -la "$PUB/home/hero-loop.mp4" "$PUB/home/hero-poster.webp"
du -sh "$PUB/story"
