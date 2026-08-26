"""종이 인형 처리 — 투명 컷아웃에 흰 종이 테두리·종이 질감·접촉 그림자를 입혀 WebP로.
무대(앤틱 생성)와 인물(원화)의 결 차이를 같은 처리로 묶는다.
사용: python3 scripts/book/paperdoll.py in.png out.webp [--border 3] [--max 1024] [--no-shadow]
"""
import argparse
import random
from PIL import Image, ImageFilter, ImageChops


def paper_texture(size: tuple[int, int], seed: int = 7) -> Image.Image:
  """약한 종이 결 — seed로 결정적인 점 노이즈를 블러한 뒤 밝기 0.92~1.0로 압축.

  Image.effect_noise는 PIL 내부 C 난수를 쓰며 Python random을 무시하므로,
  seed 재현이 필요한 이 용도로는 random.Random(seed)로 직접 바이트를 뽑아
  Image.frombytes로 노이즈 이미지를 만든다(같은 seed → 항상 같은 결과).
  """
  rnd = random.Random(seed)
  w, h = size
  data = bytes(rnd.getrandbits(8) for _ in range(w * h))
  noise = Image.frombytes("L", (w, h), data)
  noise = noise.filter(ImageFilter.GaussianBlur(0.8))
  # 0.92~1.0 범위로 스케일
  return noise.point(lambda v: int(235 + (v / 255) * 20))


def paperdoll(src: Image.Image, border: int, max_side: int, shadow: bool) -> Image.Image:
  img = src.convert("RGBA")
  if max(img.size) > max_side:
    img.thumbnail((max_side, max_side), Image.LANCZOS)
  # 테두리·그림자 여유
  pad = border + 6
  canvas = Image.new("RGBA", (img.width + pad * 2, img.height + pad * 2), (0, 0, 0, 0))
  canvas.paste(img, (pad, pad), img)
  alpha = canvas.split()[3]

  # 흰 종이 테두리 = 알파를 팽창한 흰 실루엣을 아래 깐다
  dil = alpha.filter(ImageFilter.MaxFilter(border * 2 + 1))
  white = Image.new("RGBA", canvas.size, (246, 240, 226, 255))
  white.putalpha(dil)

  # 종이 질감을 컬러 채널에 곱한다
  tex = paper_texture(canvas.size).convert("RGB")
  rgb = ImageChops.multiply(canvas.convert("RGB"), tex)
  textured = rgb.convert("RGBA")
  textured.putalpha(alpha)

  out = Image.alpha_composite(white, textured)

  if shadow:
    sh_alpha = dil.filter(ImageFilter.GaussianBlur(4)).point(lambda v: int(v * 0.45))
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 255))
    sh.putalpha(sh_alpha)
    base = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    base.paste(sh, (2, 4), sh)
    out = Image.alpha_composite(base, out)
  return out


def main() -> None:
  ap = argparse.ArgumentParser()
  ap.add_argument("src")
  ap.add_argument("dst")
  ap.add_argument("--border", type=int, default=3)
  ap.add_argument("--max", type=int, default=1024)
  ap.add_argument("--no-shadow", action="store_true")
  a = ap.parse_args()
  out = paperdoll(Image.open(a.src), a.border, a.max, not a.no_shadow)
  out.save(a.dst, "WEBP", quality=88, method=6)
  print(f"{a.dst} {out.width}x{out.height}")


if __name__ == "__main__":
  main()
