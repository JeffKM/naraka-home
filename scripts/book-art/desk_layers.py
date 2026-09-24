#!/usr/bin/env python3
"""책상 무대 2.5D 겹 나누기 — desk.webp → desk-back.webp(벽·바닥) + desk-top.webp(책상+소품, 투명 배경)

시험판(feat/book-depth-lab)용. 책상 윤곽은 손으로 잰 다각형이고, 책상 윗선 위로 솟은 모자·두루마리는
다각형 안에서도 벽 색(밝은 회청 돌·나무 기둥) 픽셀을 걸러 낸다. 뒤 겹의 책상 자리는
정규화 합성곱(주변 색 번짐)으로 채운다 — 겹이 몇 px만 어긋나므로 가장자리 띠만 보이면 된다.
PIL만 쓴다.
"""
import pathlib

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parents[2]
ART = ROOT / "public/home/book/art"

# 1920×1072 기준 책상 윤곽 (모자·두루마리 끝 포함)
DESK = [(338, 140), (470, 138), (505, 92), (590, 92), (602, 146), (1160, 168), (1175, 150), (1330, 75),
        (1395, 8), (1560, 8), (1560, 95), (1645, 105), (1648, 175), (1612, 190), (1640, 330), (1705, 420),
        (1705, 470), (1735, 640), (1760, 760), (1800, 800), (1868, 880), (1868, 968), (1830, 975),
        (1812, 1072), (125, 1072), (118, 975), (60, 965), (60, 880), (290, 240)]


def top_edge_y(x: float) -> float:
    # 책상 윗선 (338,140) → (1612,190)
    return 140 + (x - 338) * (190 - 140) / (1612 - 338)


def is_wall(rgb: tuple[int, int, int]) -> bool:
    r, g, b = rgb
    lum = (r * 299 + g * 587 + b * 114) / 1000
    stone = lum > 95 and b >= r - 8 and abs(r - g) < 28  # 회청 돌
    beam = lum > 70 and r > b + 12 and g > b and r < 175 and abs(r - g) < 45 and not (r > 150 and g < 90)  # 나무 기둥
    return stone or beam


def main() -> None:
    src = Image.open(ART / "desk.webp").convert("RGB")
    w, h = src.size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).polygon(DESK, fill=255)
    # 책상 윗선 위쪽(모자·두루마리 영역)에서 벽 색 픽셀은 뒤 겹으로
    px, mp = src.load(), mask.load()
    for y in range(0, 200):
        for x in range(300, 1700):
            if mp[x, y] and y < top_edge_y(x) - 4 and is_wall(px[x, y]):
                mp[x, y] = 0
    # 잔티 제거: 작은 구멍 메우고 가장자리 1px 부드럽게
    mask = mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))

    top = src.convert("RGBA")
    top.putalpha(mask)
    top.save(ART / "desk-top.webp", quality=90, method=6)

    # 뒤 겹: 책상 자리를 주변 색으로 번져 채운다 (정규화 합성곱, 반경을 키워 가며)
    hole = mask.point(lambda v: 255 if v > 8 else 0)
    keep = ImageChops.invert(hole)
    filled = src.copy()
    small_scale = 8
    sw, sh = w // small_scale, h // small_scale
    s_img = src.resize((sw, sh), Image.BILINEAR)
    s_keep = keep.resize((sw, sh), Image.BILINEAR)
    acc = None
    for radius in (4, 10, 24, 60):
        num = Image.composite(s_img, Image.new("RGB", (sw, sh)), s_keep).filter(ImageFilter.GaussianBlur(radius))
        den = s_keep.filter(ImageFilter.GaussianBlur(radius))
        npx, dpx = num.load(), den.load()
        out = Image.new("RGB", (sw, sh))
        op = out.load()
        for y in range(sh):
            for x in range(sw):
                d = dpx[x, y]
                if d > 6:
                    r, g, b = npx[x, y]
                    k = 255 / d
                    op[x, y] = (min(255, int(r * k)), min(255, int(g * k)), min(255, int(b * k)))
                else:
                    op[x, y] = (0, 0, 0)
        if acc is None:
            acc = out
        else:
            valid = den.point(lambda v: 255 if v > 6 else 0)
            accv = acc_valid
            acc = Image.composite(acc, out, accv)
        acc_valid = den.point(lambda v: 255 if v > 6 else 0) if acc is out else ImageChops.lighter(acc_valid, den.point(lambda v: 255 if v > 6 else 0))
    fill = acc.resize((w, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(6))
    # 채운 자리는 살짝 어둡게 — 책상 그늘
    fill = Image.blend(fill, Image.new("RGB", (w, h), (20, 14, 20)), 0.25)
    filled = Image.composite(fill, src, hole.filter(ImageFilter.MaxFilter(5)))
    filled.save(ART / "desk-back.webp", quality=82, method=6)
    print("desk-top / desk-back 저장")


if __name__ == "__main__":
    main()
