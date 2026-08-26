"""원화에서 인물 오려내기 — 지정 영역 안에서 배경색 팔레트 BFS로 배경을 지우고, 먹선은 채색면 7px 이내만 남긴다.
릴스 컷아웃 때 확립한 방법(릴스 README 참조). 사용:
  python3 scripts/book/extract_character.py 1.png out.png --bbox 120 300 700 1100 [--tol 28]
"""
import argparse
from collections import deque
from PIL import Image, ImageFilter


def close_colors(a: tuple[int, int, int], b: tuple[int, int, int], tol: int) -> bool:
  return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2]) <= tol


def extract(img: Image.Image, bbox: tuple[int, int, int, int], tol: int) -> Image.Image:
  crop = img.convert("RGB").crop(bbox)
  w, h = crop.size
  px = crop.load()
  # 배경 팔레트 = 네 모서리 색
  palette = {px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]}
  bg = [[False] * w for _ in range(h)]
  q: deque[tuple[int, int]] = deque()
  for x, y in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
    q.append((x, y))
    bg[y][x] = True
  while q:
    x, y = q.popleft()
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
      if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx] and any(close_colors(px[nx, ny], p, tol) for p in palette):
        bg[ny][nx] = True
        q.append((nx, ny))
  alpha = Image.new("L", (w, h), 255)
  ap = alpha.load()
  for y in range(h):
    for x in range(w):
      if bg[y][x]:
        ap[x, y] = 0
  # 먹선 고아 제거: 채색면(알파 유지)에서 7px 넘게 떨어진 어두운 픽셀은 버린다
  keep = alpha.filter(ImageFilter.MaxFilter(15))
  kp = keep.load()
  for y in range(h):
    for x in range(w):
      if ap[x, y] and kp[x, y] == 0:
        ap[x, y] = 0
  out = crop.convert("RGBA")
  out.putalpha(alpha)
  return out


def main() -> None:
  ap = argparse.ArgumentParser()
  ap.add_argument("src")
  ap.add_argument("dst")
  ap.add_argument("--bbox", type=int, nargs=4, required=True)
  ap.add_argument("--tol", type=int, default=28)
  a = ap.parse_args()
  out = extract(Image.open(a.src), tuple(a.bbox), a.tol)
  out.save(a.dst)
  print(f"{a.dst} {out.width}x{out.height}")


if __name__ == "__main__":
  main()
