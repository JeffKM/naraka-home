# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "scipy", "pillow", "opencv-python-headless"]
# ///
"""책상 무대 2.5D 겹 나누기 — desk.webp → desk-back.webp(벽·바닥) + desk-top.webp(책상+소품, 투명 배경)

사용: uv run scripts/book-art/desk_layers.py

시험판(feat/book-depth-lab)용. 손으로 잰 다각형은 모자·유령 둘레가 어긋나서 버리고,
그림의 검은 윤곽선을 벽으로 삼아 화면 가장자리(위·왼쪽·오른쪽)에서 배경을 채워 들어간다.
  1. 어두운 픽셀(윤곽선) = 벽 → 가장자리에서 닿는 밝은 영역 = 배경(벽·바닥·유령)
  2. 배경이 아닌 곳 = 책상 후보. 벽돌 줄눈 같은 가는 선은 열림 연산으로 떼고,
     화면 가운데와 이어진 덩어리만 남긴 뒤 구멍을 메우고, 떼면서 깎인 바깥 윤곽선을 되살린다.
  3. 뒤 겹의 책상 자리는 행마다 옆 벽·바닥의 거울상으로 채운다 — 겹이 수십 px만
     어긋나므로 가장자리 띠만 자연스러우면 된다.
"""
import pathlib

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = pathlib.Path(__file__).resolve().parents[2]
ART = ROOT / "public/home/book/art"

LINE_LUM = 70  # 이보다 어두우면 윤곽선
THIN = 6  # 이 반경(px) 이하로 가는 선(벽 기둥·유령 윤곽)은 책상에서 뗀다
BAND = 120  # 뒤 겹에서 거울상으로 채우는 경계 띠 폭(px) — 교체 중 드러나는 폭(약 30px)보다 넉넉히
SHADOW = (58, 40, 48)  # 책상 밑 그늘색
CORE = (600, 960)  # 책상 한가운데 (y, x) — 1920×1072 기준


def desk_mask(rgb: np.ndarray) -> np.ndarray:
    lum = rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114
    wall = ndi.binary_dilation(lum < LINE_LUM, iterations=1)
    free = ~wall
    free[-1, :] = False  # 아래 가장자리는 책상 서랍이 닿으므로 씨앗에서 뺀다
    lab, _ = ndi.label(free)
    seeds = set(np.unique(lab[0, :])) | set(np.unique(lab[:-1, 0])) | set(np.unique(lab[:-1, -1]))
    seeds.discard(0)
    bg = np.isin(lab, list(seeds))
    if bg[CORE]:
        raise SystemExit("배경 채우기가 책상 안으로 샜다 — 윤곽선이 끊긴 곳을 확인할 것")

    cand = ~bg
    disk = ndi.generate_binary_structure(2, 1)
    core = ndi.binary_opening(cand, structure=disk, iterations=THIN)
    lab, _ = ndi.label(core)
    core = lab == lab[CORE]
    core = ndi.binary_fill_holes(core)
    # 열림 연산에 깎인 책상 바깥 윤곽선을 되살린다 (배경 쪽으로는 넘지 않게)
    mask = ndi.binary_dilation(core, structure=disk, iterations=THIN + 1) & cand
    mask = ndi.binary_fill_holes(mask | core)
    # 되살리면서 같이 자란 벽 기둥 선 토막(폭 ~8px)을 떼어 낸다
    mask = ndi.binary_opening(mask, structure=disk, iterations=5)
    return mask


def main() -> None:
    src = Image.open(ART / "desk.webp").convert("RGB")
    rgb = np.asarray(src)
    mask = desk_mask(rgb.astype(np.float32))

    # 앞 겹 — 가장자리 1px만 부드럽게
    alpha = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 0.7)
    top = np.dstack([rgb, (alpha * 255).round().astype(np.uint8)])
    Image.fromarray(top, "RGBA").save(ART / "desk-top.webp", quality=90, method=6)

    # 뒤 겹 — 책상 자리(넉넉히 넓힌)를 행마다 오른쪽 경계 기준 좌우 거울상으로 채운다.
    # 교체 중 책상 겹이 왼쪽으로 더 흘러 드러나는 곳은 책상 오른쪽 가장자리 띠라서, 바로 옆 벽·바닥·유령의
    # 결이 이어져 보이는 거울상이 번짐(inpaint)보다 자연스럽다. 오른쪽에 채울 거리가 없으면 왼쪽 거울상.
    hole = ndi.binary_dilation(mask, iterations=6)
    h, w = hole.shape
    back = rgb.copy()
    for y in range(h):
        row = hole[y]
        x = 0
        while x < w:
            if not row[x]:
                x += 1
                continue
            x0 = x
            while x < w and row[x]:
                x += 1
            x1 = x  # [x0, x1) 구멍 구간
            xs = np.arange(x0, x1)
            if x1 < w:
                src_x = 2 * x1 - 1 - xs  # 오른쪽 경계 거울상
            else:
                src_x = 2 * x0 - 1 - xs  # 왼쪽 경계 거울상
            src_x = np.clip(src_x, 0, w - 1)
            back[y, x0:x1] = rgb[y, src_x]
            # 경계에서 BAND보다 먼 안쪽은 드러날 일이 없으니 그늘색으로 (거울상 줄무늬 방지)
            far = (x1 - 1 - xs) > BAND if x1 < w else (xs - x0) > BAND
            back[y, x0:x1][far] = SHADOW
    # 거울 이음매를 누그러뜨리고 살짝 어둡게 — 책상 그늘
    soft_fill = cv2.GaussianBlur(back, (0, 0), 1.2).astype(np.float32)
    shade = np.array([20, 14, 20], np.float32)
    soft_fill = soft_fill * 0.85 + shade * 0.15
    soft = cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 2)[..., None]
    back = rgb.astype(np.float32) * (1 - soft) + soft_fill * soft
    Image.fromarray(back.clip(0, 255).astype(np.uint8)).save(ART / "desk-back.webp", quality=82, method=6)
    print(f"desk-top / desk-back 저장 (책상 {mask.mean():.1%})")


if __name__ == "__main__":
    main()
