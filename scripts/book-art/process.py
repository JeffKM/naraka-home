#!/usr/bin/env python3
"""책 홈 그림 처리 — 원본 PNG → public/home/book/art/<키>.webp

사용: python3 scripts/book-art/process.py ~/Desktop/naraka/story [키 ...]
  - 두 번째 인자부터 키를 주면 그 키만 다시 만든다 (예: spines hand-open)
원장: docs/book-art/PROMPTS.md. 원본 폴더엔 예전 원화(1.png~17.png)가 섞여 있어
`NN-이름.png`와 `M1~M3.png`만 쓴다. 없는 파일은 건너뛴다.

처리 순서 (전 장 공통)
  1. Gemini ✦ 가시 워터마크 제거 — 역알파 블렌딩(orig = (wm − a·255)/(1 − a)).
     알파맵은 01-gate.png의 평면 배경에서 뽑고(wm-alpha.png로 캐시),
     장마다 중심 오프셋·알파 배율을 탐색해 국소 잔차가 가장 작은 조합을 쓴다.
  2. 초록 배경 그림은 그다음 키잉 → 조각 분리.
PIL만 쓴다 (numpy·cv2 없음).
"""
import pathlib
import sys

from PIL import Image, ImageFilter

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / "public/home/book/art"
ALPHA_CACHE = HERE / "wm-alpha.png"
# 원화 3번 옥자 크롭을 higgsfield remove_background로 누끼 딴 결과의 알파만 보관 (실루엣엔 알파만 쓴다)
OKJA_MASK = HERE / "okja-mask.png"
BOOK_IDS = ["home", "about", "location", "menu", "staff", "notice", "events", "games"]

# 원본 파일명 → (출력 키, 긴 변 px)
SCENES = {
    "01-gate.png": ("gate", 1920),
    "M1.png": ("gate-m", 1280),
    "02-office.png": ("office", 1920),
    "M2.png": ("office-m", 1280),
    "03-shelf.png": ("shelf", 1400),
    "13-desk.png": ("desk", 1920),
    "M3.png": ("desk-m", 1280),
    "17-mahjong.png": ("mahjong", 1000),
    "18-map.png": ("map", 1200),
}
SCENES.update({f"{5 + i:02d}-cover-{b}.png": (f"cover-{b}", 900) for i, b in enumerate(BOOK_IDS)})

# 키별 WebP 품질 — 개별 ≤ 400KB, 첫 화면(desk+cover-home+corner) ≤ 1MB 예산에 맞춘 값
QUALITY = {"desk": 76, "desk-m": 76, "gate": 78, "gate-m": 78, "office": 76, "office-m": 76}

# ── 워터마크 ───────────────────────────────────
WM_OFF = 240  # 우하단 모서리에서 ✦ 중심까지 (2배 업스케일 원본 기준)
WM_R = 70  # 중심 기준 반경 박스


def build_alpha(gate: pathlib.Path) -> Image.Image:
    """01-gate의 평면 배경(베이지 기둥) 위 ✦에서 알파맵을 뽑는다. a = (wm − bg)/(255 − bg)."""
    im = Image.open(gate).convert("RGB")
    w, h = im.size
    cx, cy = w - WM_OFF, h - WM_OFF
    px = im.load()
    ring = [px[cx + dx, cy - WM_R - 6] for dx in range(-WM_R, WM_R)]
    ring += [px[cx + dx, cy + WM_R + 6] for dx in range(-WM_R, WM_R)]
    bg = [sum(c[i] for c in ring) / len(ring) for i in range(3)]
    size = 2 * WM_R + 1
    amap = Image.new("L", (size, size), 0)
    ap = amap.load()
    for dy in range(-WM_R, WM_R + 1):
        for dx in range(-WM_R, WM_R + 1):
            p = px[cx + dx, cy + dy]
            a = sum((p[i] - bg[i]) / (255 - bg[i]) for i in range(3)) / 3
            ap[dx + WM_R, dy + WM_R] = round(max(0.0, min(0.95, a)) * 255) if a > 0.03 else 0
    return amap


def load_alpha(raw_dir: pathlib.Path) -> list[tuple[int, int, float]]:
    gate = raw_dir / "01-gate.png"
    if gate.exists():
        amap = build_alpha(gate)
        amap.save(ALPHA_CACHE)
    elif ALPHA_CACHE.exists():
        amap = Image.open(ALPHA_CACHE).convert("L")
    else:
        sys.exit("워터마크 알파맵을 만들 01-gate.png도, 캐시 wm-alpha.png도 없다")
    ap = amap.load()
    return [
        (x - WM_R, y - WM_R, ap[x, y] / 255)
        for y in range(amap.height)
        for x in range(amap.width)
        if ap[x, y] > 0
    ]


def _unblend(px, cx: int, cy: int, alpha, scale: float) -> None:
    for dx, dy, a0 in alpha:
        a = min(0.97, a0 * scale)
        p = px[cx + dx, cy + dy]
        px[cx + dx, cy + dy] = tuple(max(0, min(255, round((p[i] - a * 255) / (1 - a)))) for i in range(3))


def _pairs(alpha) -> list[tuple[int, int, int, int]]:
    """✦ 안쪽(진한 곳) 픽셀마다 상하좌우로 걸어 나가 ✦ 밖 2px 지점과 짝짓는다."""
    amap = {(dx, dy): a for dx, dy, a in alpha}
    amax = max(amap.values())
    pairs = []
    for (dx, dy), a in amap.items():
        if a < 0.6 * amax or (dx + dy) % 3:  # 3칸에 하나만 — 속도
            continue
        for sx, sy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            x, y = dx, dy
            while amap.get((x, y), 0) > 0:
                x, y = x + sx, y + sy
            pairs.append((dx, dy, x + 2 * sx, y + 2 * sy))
    return pairs


def _residual(px, cx: int, cy: int, amap: dict, pairs, scale: float) -> float:
    """보정 후 ✦ 안쪽과 바로 바깥의 밝기 차 — 주변 대비 편차. 선화가 가로지르는 짝은 상한으로 눌러 둔다."""
    total = 0.0
    for ix, iy, ox, oy in pairs:
        a = min(0.97, amap[(ix, iy)] * scale)
        p = px[cx + ix, cy + iy]
        q = px[cx + ox, cy + oy]
        d = 0.0
        for i in range(3):
            v = max(0.0, min(255.0, (p[i] - a * 255) / (1 - a)))
            d += abs(v - q[i])
        total += min(d, 90.0)
    return total


def remove_watermark(im: Image.Image, alpha) -> tuple[Image.Image, tuple[int, int, float]]:
    """중심 오프셋 ±4px · 알파 배율을 탐색해 국소 잔차 최소 조합으로 ✦를 지운다.
    업스케일 과정에서 밝은 바탕일수록 ✦가 더 진하게 찍혀 배율 범위를 넓게(0.8~3.0) 본다."""
    im = im.convert("RGB")
    w, h = im.size
    px = im.load()
    amap = {(dx, dy): a for dx, dy, a in alpha}
    pairs = _pairs(alpha)
    bx, by = w - WM_OFF, h - WM_OFF

    def res(ox: int, oy: int, s: float) -> float:
        return _residual(px, bx + ox, by + oy, amap, pairs, s)

    # 1) 오프셋 — 거의 모든 장이 (0,0)이라, 딴 자리는 잔차가 15% 넘게 줄 때만 받는다
    zero = min(res(0, 0, s) for s in (1.0, 2.0))
    cand = min((min(res(ox, oy, s) for s in (1.0, 2.0)), ox, oy)
               for oy in range(-4, 5) for ox in range(-4, 5))
    ox, oy = (cand[1], cand[2]) if cand[0] < zero * 0.85 else (0, 0)
    # 2) 배율 — 거친 격자 → 잘게
    s0 = min((res(ox, oy, s), s) for s in (0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0))[1]
    scale = min((res(ox, oy, s0 + d), s0 + d) for d in (-0.1, -0.05, 0.0, 0.05, 0.1) if s0 + d > 0.5)[1]
    out = im.copy()
    opx = out.load()
    _unblend(opx, bx + ox, by + oy, alpha, scale)
    # 3) 가장자리 띠 — 업스케일 번짐 탓에 역블렌딩만으론 ✦ 윤곽선이 희미하게 남는다.
    #    알파가 옅은 테두리 띠만 바깥에서 안으로 한 겹씩 이웃 평균으로 메운다
    _fill_ring(opx, bx + ox, by + oy, amap)
    return out, (ox, oy, scale)


def _fill_ring(px, cx: int, cy: int, amap: dict) -> None:
    amax = max(amap.values())
    ring = {k for k, a in amap.items() if a < 0.55 * amax}
    # 띠를 안팎으로 1px 넓힌다
    grown = set(ring)
    for dx, dy in ring:
        for ex, ey in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            grown.add((dx + ex, dy + ey))
    todo = grown
    while todo:
        filled = {}
        for dx, dy in todo:
            acc = [0, 0, 0]
            n = 0
            for ex, ey in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                k = (dx + ex, dy + ey)
                if k in todo:
                    continue
                p = px[cx + k[0], cy + k[1]]
                acc = [acc[i] + p[i] for i in range(3)]
                n += 1
            if n >= 2:
                filled[(dx, dy)] = tuple(round(v / n) for v in acc)
        if not filled:
            break
        for (dx, dy), c in filled.items():
            px[cx + dx, cy + dy] = c
        todo = todo - filled.keys()


def tint_gray_flame(im: Image.Image) -> Image.Image:
    """05-cover-home 전용 임시 보정 — 리테이크(불꽃 네 개 같은 색)가 도착하면 이 함수와 호출부를 지운다.
    ✦ 자리의 푸른 불꽃 속이 회색으로 그려져 나왔다(생성 잔재).
    불꽃 속 회색 혀(검은 윤곽선 안쪽)만 채우기로 찾아, 밝기를 살려 불꽃 청록으로 물들인다."""
    w, h = im.size
    px = im.load()
    x0, x1, y0, y1 = w - 300, w - 190, h - 320, h - 214
    seed = (w - 245, h - 240)
    seen = {seed}
    stack = [seed]
    while stack:
        x, y = stack.pop()
        r, g, b = px[x, y]
        lum = (r + g + b) / 3
        if lum < 70:  # 윤곽선
            continue
        if max(r, g, b) - min(r, g, b) < 40:
            t = min(1.0, max(0.0, (lum - 70) / 145))
            px[x, y] = tuple(round(lo + (hi - lo) * t) for lo, hi in zip((60, 190, 205), (175, 242, 246)))
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if x0 <= n[0] < x1 and y0 <= n[1] < y1 and n not in seen:
                seen.add(n)
                stack.append(n)
    return im


# ── 저장 ──────────────────────────────────────
def fit(im: Image.Image, long_side: int) -> Image.Image:
    w, h = im.size
    scale = long_side / max(w, h)
    return im if scale >= 1 else im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)


def save(im: Image.Image, key: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{key}.webp"
    im.save(path, "WEBP", quality=QUALITY.get(key, 82), method=6)
    print(f"{key}.webp  {im.size[0]}x{im.size[1]}  {path.stat().st_size // 1024}KB")


# ── 키잉 · 조각 ───────────────────────────────
def chroma_key(im: Image.Image, tol: int = 90) -> Image.Image:
    """초록(#00FF00) 배경 → 투명. 녹색 우세도(g − max(r, b))로 알파를 정하고 가장자리 초록 번짐을 뺀다."""
    im = im.convert("RGBA")
    px = im.load()
    soft = tol // 3
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, _ = px[x, y]
            dom = g - max(r, b)
            if dom > tol:
                px[x, y] = (0, 0, 0, 0)
            elif dom > soft:
                alpha = int(255 * (tol - dom) / (tol - soft))
                px[x, y] = (r, max(r, b), b, alpha)
    return im


def components(
    im: Image.Image, min_area: int = 400, scale: int = 4, grow: int = 1
) -> list[tuple[int, int, int, int]]:
    """투명 배경 시트에서 떨어진 조각들의 bbox — 위→아래 줄, 줄 안에서 왼→오.
    grow(홀수)만큼 알파를 부풀려 가는 선화의 끊긴 틈을 한 조각으로 잇는다."""
    small = im.split()[3].resize((max(1, im.width // scale), max(1, im.height // scale)))
    if grow > 1:
        small = small.filter(ImageFilter.MaxFilter(grow))
    sp = small.load()
    sw, sh = small.size
    seen = bytearray(sw * sh)
    boxes = []
    for y0 in range(sh):
        for x0 in range(sw):
            if seen[y0 * sw + x0] or sp[x0, y0] < 32:
                continue
            stack = [(x0, y0)]
            seen[y0 * sw + x0] = 1
            x1 = x2 = x0
            y1 = y2 = y0
            n = 0
            while stack:
                x, y = stack.pop()
                n += 1
                x1, x2, y1, y2 = min(x1, x), max(x2, x), min(y1, y), max(y2, y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < sw and 0 <= ny < sh and not seen[ny * sw + nx] and sp[nx, ny] >= 32:
                        seen[ny * sw + nx] = 1
                        stack.append((nx, ny))
            if n * scale * scale >= min_area:
                # 부풀린 만큼 되돌리고 실제 픽셀 bbox로 조인다
                pad = grow // 2
                box = (max(0, (x1 + pad) * scale - scale), max(0, (y1 + pad) * scale - scale),
                       min(im.width, (x2 + 1 - pad) * scale + scale), min(im.height, (y2 + 1 - pad) * scale + scale))
                tight = im.crop(box).getbbox()
                if tight:
                    boxes.append((box[0] + tight[0], box[1] + tight[1], box[0] + tight[2], box[1] + tight[3]))
    row_h = max(1, im.height // 6)
    return sorted(boxes, key=lambda b: (b[1] // row_h, b[0]))


# ── 개별 그림 ─────────────────────────────────
# 책등 시트 경계 (원본 2752px 폭 기준 x) — 책 몇 권이 맞닿거나 겹쳐 있어 조각 찾기로는 못 가른다.
# 원본을 확대해 책마다 바깥 윤곽선 바로 바깥을 경계로 잡았다 (검정 책 옆면·집게 고리 뒤 적갈 책 옆면 포함)
# 04-spines.png(2752x1536) 원본을 눈으로 재서 잡은 책 경계 (BOOK_IDS 순서).
# 리테이크로 원본이 바뀌면 경계를 반드시 다시 잰다 — 크기가 다르면 do_spines가 멈춘다
SPINE_SOURCE_SIZE = (2752, 1536)
SPINE_CUTS = [0, 446, 805, 1101, 1340, 1745, 2000, 2337, 2752]


def do_spines(im: Image.Image) -> None:
    if im.size != SPINE_SOURCE_SIZE:
        # 다른 원본을 옛 경계로 조용히 자르면 책등이 엉뚱하게 잘린다 → 경고하고 멈춘다
        print(
            f"  경고: 04-spines 원본 크기 {im.size[0]}x{im.size[1]} ≠ "
            f"{SPINE_SOURCE_SIZE[0]}x{SPINE_SOURCE_SIZE[1]} — SPINE_CUTS를 다시 재고 SPINE_SOURCE_SIZE를 고친 뒤 실행하세요",
            file=sys.stderr,
        )
        sys.exit(1)
    # 책 8권 아래에 책상 소품(잉크병·종이) 잔상이 깔려 있어 밑단 바로 아래에서 자른다
    im = im.crop((0, 0, im.width, round(im.height * 0.885)))
    sheet = chroma_key(im)
    k = sheet.width / SPINE_SOURCE_SIZE[0]
    for book, x1, x2 in zip(BOOK_IDS, SPINE_CUTS, SPINE_CUTS[1:]):
        part = sheet.crop((round(x1 * k), 0, round(x2 * k), sheet.height))
        save(fit(part.crop(part.getbbox()), 400), f"spine-{book}")


def do_ornaments(im: Image.Image) -> None:
    sheet = chroma_key(im)
    boxes = components(sheet, min_area=4000, grow=9)
    print(f"  장식 조각 {len(boxes)}개: {boxes}")
    # 조각 순서(위→아래, 왼→오)에서 좌상단 모서리 = 1번, 책갈피 = 너비 대비 가장 세로로 긴 조각
    if boxes:
        save(fit(isolate(sheet.crop(boxes[0])), 600), "corner")
        ribbon = max(boxes, key=lambda b: (b[3] - b[1]) / max(1, b[2] - b[0]))
        save(fit(isolate(sheet.crop(ribbon)), 600), "bookmark")


def isolate(piece: Image.Image, scale: int = 4, grow: int = 9) -> Image.Image:
    """직사각 bbox 안에 딸려 들어온 이웃 장식 끄트머리를 지운다 — 부풀린 알파의 가장 큰 덩어리만 남김."""
    sw, sh = max(1, piece.width // scale), max(1, piece.height // scale)
    small = piece.split()[3].resize((sw, sh)).filter(ImageFilter.MaxFilter(grow))
    sp = small.load()
    label = [0] * (sw * sh)
    sizes = [0]
    for y0 in range(sh):
        for x0 in range(sw):
            if label[y0 * sw + x0] or sp[x0, y0] < 32:
                continue
            lab = len(sizes)
            sizes.append(0)
            stack = [(x0, y0)]
            label[y0 * sw + x0] = lab
            while stack:
                x, y = stack.pop()
                sizes[lab] += 1
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < sw and 0 <= ny < sh and not label[ny * sw + nx] and sp[nx, ny] >= 32:
                        label[ny * sw + nx] = lab
                        stack.append((nx, ny))
    if len(sizes) <= 2:
        return piece
    main = max(range(1, len(sizes)), key=lambda i: sizes[i])
    keep = Image.new("L", (sw, sh), 0)
    keep.putdata([255 if v == main else 0 for v in label])
    alpha = Image.composite(piece.split()[3], Image.new("L", piece.size, 0), keep.resize(piece.size, Image.NEAREST))
    piece.putalpha(alpha)
    return piece.crop(piece.getbbox())


def do_hand_pull(im: Image.Image) -> None:
    keyed = chroma_key(im)
    save(fit(keyed.crop(keyed.getbbox()), 700), "hand-pull")


def do_hand_open(im: Image.Image) -> None:
    # 리테이크 v2(2026-09-24): 책 없이 빈손만 — 키잉 후 그대로 쓴다 (1차본은 15-hand-open-v1.png로 보관)
    keyed = chroma_key(im)
    save(fit(keyed.crop(keyed.getbbox()), 700), "hand-open")


def fill_holes(alpha: Image.Image) -> Image.Image:
    """테두리에서 닿지 않는 투명 구멍(목깃 V 등)을 메운다 — 실루엣이 뚫려 보이지 않게."""
    small = alpha.resize((alpha.width // 4, alpha.height // 4))
    sp = small.load()
    sw, sh = small.size
    outside = bytearray(sw * sh)
    stack = [(x, y) for x in range(sw) for y in (0, sh - 1)] + [(x, y) for y in range(sh) for x in (0, sw - 1)]
    while stack:
        x, y = stack.pop()
        if not (0 <= x < sw and 0 <= y < sh) or outside[y * sw + x] or sp[x, y] >= 128:
            continue
        outside[y * sw + x] = 1
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    holes = Image.new("L", (sw, sh), 0)
    hp = holes.load()
    for y in range(sh):
        for x in range(sw):
            if not outside[y * sw + x] and sp[x, y] < 128:
                hp[x, y] = 255
    holes = holes.resize(alpha.size).filter(ImageFilter.MaxFilter(5))
    return Image.composite(Image.new("L", alpha.size, 255), alpha, holes)


def do_okja_shadow() -> None:
    if not OKJA_MASK.exists():
        print("okja-mask.png 없음 — okja-shadow 건너뜀")
        return
    mask = Image.open(OKJA_MASK).convert("L")
    alpha = fill_holes(mask)
    # 원화에서 왼쪽이 화면 가장자리로 잘려 있어 직선으로 끊긴다 → 왼쪽 90px를 서서히 흐리게
    ap = alpha.load()
    fade = 90
    for x in range(min(fade, alpha.width)):
        k = x / fade
        for y in range(alpha.height):
            ap[x, y] = round(ap[x, y] * k)
    sil = Image.new("RGBA", mask.size, (13, 12, 17, 0))
    sil.putalpha(alpha)
    sil = sil.crop(sil.getbbox())
    sil.thumbnail((900, 900))
    save(sil, "okja-shadow")


def main(raw_dir: pathlib.Path, only: set[str]) -> None:
    alpha = load_alpha(raw_dir)

    def want(key: str) -> bool:
        return not only or key in only

    def clean(name: str) -> Image.Image | None:
        src = raw_dir / name
        if not src.exists():
            return None
        out, (ox, oy, scale) = remove_watermark(Image.open(src), alpha)
        print(f"  {name}: 워터마크 오프셋 ({ox:+d},{oy:+d}) 배율 {scale:.2f}")
        return out

    for name, (key, size) in SCENES.items():
        if want(key) and (im := clean(name)):
            if key == "cover-home":
                im = tint_gray_flame(im)
            save(fit(im, size), key)
    for name, key, fn in (
        ("14-hand-pull.png", "hand-pull", do_hand_pull),
        ("15-hand-open.png", "hand-open", do_hand_open),
        ("04-spines.png", "spines", do_spines),
        ("16-ornaments.png", "ornaments", do_ornaments),
    ):
        if want(key) and (im := clean(name)):
            fn(im)
    if want("okja-shadow"):
        do_okja_shadow()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("사용: process.py <원본 폴더> [키 ...]")
    main(pathlib.Path(sys.argv[1]).expanduser(), set(sys.argv[2:]))
