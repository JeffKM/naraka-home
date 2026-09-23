#!/usr/bin/env python3
# 릴스 프레임에서 소품 컷아웃 추출 — 경계색 팔레트 BFS + 먹선 근접 유지 + 최대 성분
# (로컬 델타 flood 금지 — 안티앨리어스로 전멸. 원화 컷아웃과 동일 파이프라인)
import os
import subprocess
import sys
from collections import Counter, deque

import numpy as np
from PIL import Image, ImageFilter

SRC = os.path.expanduser("~/Desktop/naraka/reels/07-ae/naraka_reels_fianl.mp4")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "home", "deco", "video")

# (이름, 시각초, (x1,y1,x2,y2) 1080×1920 기준, 옵션)
# 옵션: tol=배경 유사 임계(기본 40), multi=True면 1% 이상 성분 모두 유지, width=출력 폭(기본 280)
PROPS = [
    ("v-note", 0.5, (470, 20, 780, 220), {"width": 200}),          # 음표+물결 (베개 위)
    ("v-cushion", 0.5, (65, 235, 468, 685), {"width": 320, "palmax": 200}),  # 고양이 방석
    ("v-inkwell", 0.5, (455, 1360, 625, 1680), {"width": 160}),    # 잉크병+깃펜 (검정)
    ("v-jar", 0.5, (450, 1630, 620, 1912), {"width": 160}),        # 유리병
    ("v-scrap", 0.5, (100, 1170, 280, 1330), {"width": 140}),      # 구겨진 종이
    ("v-mace", 22.5, (130, 990, 510, 1580), {"width": 220}),       # 철퇴
    ("v-resume", 66, (610, 520, 910, 1215), {"width": 220, "palmax": 180}),       # 종신 이력서
    ("v-stamp-tool", 66, (940, 550, 1078, 760), {"width": 130}),   # 도장 스탬프
    ("v-quill-ink", 66, (5, 755, 140, 1125), {"width": 130}),      # 깃펜+청잉크병
    ("v-nameplate", 79.6, (90, 890, 1010, 1570), {"width": 420}), # 명패
    ("v-cross", 79.6, (120, 620, 675, 945), {"width": 260}),      # 십자가
    ("v-note2", 51, (380, 355, 580, 480), {"width": 160}),         # 음표 물결 (하늘)
    ("v-starburst", 21, (890, 40, 1078, 340), {"width": 180}),     # 스타 임팩트
]


def extract(name, t, box, opt):
    tmp = f"/tmp/deco-{name}.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", SRC,
                    "-frames:v", "1", tmp], check=True)
    im = Image.open(tmp).convert("RGB").crop(box)
    # 그레인 제거 — 유사도 판정은 미디언 스무딩본으로 (먹선이 배경 판정되는 것 방지)
    a = np.asarray(im.filter(ImageFilter.MedianFilter(5))).astype(np.int16)
    h, w = a.shape[:2]
    tol = opt.get("tol", 22)

    # 1) 경계 2px 색 팔레트 (8단계 양자화 상위 4색 — 검정 먹선이 끼면 flood가 전멸하므로 어두운 색 제외)
    border = np.concatenate([a[:2].reshape(-1, 3), a[-2:].reshape(-1, 3),
                             a[:, :2].reshape(-1, 3), a[:, -2:].reshape(-1, 3)])
    cand = Counter(map(tuple, (border // 8 * 8).tolist())).most_common(10)
    palmax = opt.get("palmax", 255)
    pal = [np.array(c) for c, _ in cand if 60 <= sum(c) / 3 <= palmax][:4]
    if not pal:
        pal = [np.array(cand[0][0])]

    # 2) 배경 유사 마스크(벡터화, 채널 최대거리) 후 경계에서 BFS
    bgok = np.zeros((h, w), bool)
    for p in pal:
        bgok |= np.abs(a - p).max(axis=2) < tol
    bg = np.zeros((h, w), bool)
    q = deque()
    edge = np.zeros((h, w), bool)
    edge[:2] = edge[-2:] = True
    edge[:, :2] = edge[:, -2:] = True
    for y, x in zip(*np.where(edge & bgok)):
        bg[y, x] = True
        q.append((int(y), int(x)))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and bgok[ny, nx]:
                bg[ny, nx] = True
                q.append((ny, nx))
    fg = ~bg

    # 3) 먹선(어두운 픽셀)은 채색면 7px 이내만 유지
    #    예외: 채색면이 거의 없는 검정 글리프 소품(음표 등)은 먹선 전부 유지
    lum = a.mean(axis=2)
    dark = lum < 70
    colored = fg & ~dark
    if colored.sum() >= fg.sum() * 0.1:
        near = colored.copy()
        for _ in range(7):
            p = np.pad(near, 1)
            near = p[2:, 1:-1] | p[:-2, 1:-1] | p[1:-1, 2:] | p[1:-1, :-2] | near
        fg = colored | (fg & dark & near)

    # 4) 연결 성분 — 기본 최대 1개, multi면 전체 전경의 1% 이상 모두
    lab = np.zeros((h, w), np.int32)
    sizes, cur = {}, 0
    for sy, sx in zip(*np.where(fg)):
        if lab[sy, sx]:
            continue
        cur += 1
        lab[sy, sx] = cur
        q = deque([(int(sy), int(sx))])
        n = 0
        while q:
            y, x = q.popleft()
            n += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and lab[ny, nx] == 0:
                    lab[ny, nx] = cur
                    q.append((ny, nx))
        sizes[cur] = n
    if not sizes:
        print(f"[실패] {name}: 전경 없음")
        return
    total = int(fg.sum())
    if opt.get("multi"):
        keep = [k for k, v in sizes.items() if v >= total * 0.01]
    else:
        keep = [max(sizes, key=lambda k: sizes[k])]
    fg = np.isin(lab, keep)

    # 5) 알파 합성 + 트림 + 리사이즈 + 저장
    rgba = np.dstack([np.asarray(im), (fg * 255).astype(np.uint8)])
    ys, xs = np.where(fg)
    out = Image.fromarray(rgba).crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    tw = opt.get("width", 280)
    if out.width > tw:
        out = out.resize((tw, round(out.height * tw / out.width)), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{name}.webp")
    out.save(path, "WEBP", quality=88)
    print(f"[완료] {name}: {out.size}, {os.path.getsize(path) // 1024}KB, 성분 {len(sizes)}개 중 {len(keep)}개 유지")


if __name__ == "__main__":
    only = sys.argv[1:]
    for name, t, box, opt in PROPS:
        if only and name not in only:
            continue
        extract(name, t, box, opt)
