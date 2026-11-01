#!/usr/bin/env python3
"""옥자 손 팔 늘이기 — hand-open.webp → hand-reach.webp (시험판 feat/book-depth-lab용)

사용: python3 scripts/book-art/hand_reach.py

hand-open은 소매가 그림 오른쪽 끝에서 잘려 있어, 책 위에 두면 팔이 허공에서 끊겨 보인다.
오른쪽 끝 한 열(위·아래 검은 윤곽선 포함)을 EXTEND px만큼 이어 붙여 소매가 화면 밖까지
이어지게 한다. 멀어질수록 조금씩 어둡게 — 화면 밖 그늘로 녹아든다. PIL만 쓴다.
"""
import pathlib

from PIL import Image

ART = pathlib.Path(__file__).resolve().parents[2] / "public/home/book/art"
EXTEND = 1400  # 늘일 길이(px) — 원본 폭(700)의 두 배
DARKEN = 0.22  # 끝에서 이만큼 어둡게


def main() -> None:
    hand = Image.open(ART / "hand-open.webp").convert("RGBA")
    w, h = hand.size
    out = Image.new("RGBA", (w + EXTEND, h), (0, 0, 0, 0))
    out.paste(hand, (0, 0))
    col = hand.crop((w - 1, 0, w, h)).load()
    px = out.load()
    for i in range(EXTEND):
        k = 1 - DARKEN * min(1.0, i / (EXTEND * 0.6))
        for y in range(h):
            r, g, b, a = col[0, y]
            px[w + i, y] = (round(r * k), round(g * k), round(b * k), a)
    out.save(ART / "hand-reach.webp", quality=88, method=6)
    print(f"hand-reach 저장 {out.size}")


if __name__ == "__main__":
    main()
