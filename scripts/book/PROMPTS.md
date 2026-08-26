# 팝업북 무대 에셋 — 힉스필드 프롬프트 원장

모든 무대 에셋 공통 머리말 (STYLE):

```
Antique retro storybook illustration, ink outlines with warm flat painted fills, aged paper texture.
Palette: near-black violet #131117, dark rosewood #3a2a26 and #6b4a44, parchment #d1b89d, cream #e6d4b8,
muted brick red #a34c37 accent, chalk #dfdfdf highlights. Night scene lit by warm orange candle and bulb light.
Single isolated object on a plain flat mid-grey background, no cast shadow outside the object, no text, no border.
Chunky readable shapes, front view, straight-on. Ultra high resolution.
```

생성 후 `remove_background` → `paperdoll.py` → `public/home/book/<면>/<id>.webp`.
글자는 절대 넣지 않는다(간판·명패도 HTML).

## 표지 (cover/)
| id | 프롬프트 (STYLE + ) |
|---|---|
| cover-leather | `a closed antique leather book cover, dark rosewood leather with worn gold corner ornaments, an empty rectangular gold-framed title area in the upper center, a small empty brass nameplate near the bottom` |
| cover-still | (폴백·LCP용) 면 1을 완성한 뒤 Playwright 1600×900 스크린샷으로 대체 |

## 면 1 (p1/) — 프롤로그·1막
| id | 프롬프트 (STYLE + ) |
|---|---|
| p1-sky | `a wide night sky backdrop with a thin crescent moon, soft mist near the bottom, distant rooftop silhouettes, 16:9` |
| p1-ground | `a wide strip of cobblestone street at night with a low stone curb, 4:1 aspect, seamless left to right` |
| p1-office | `a small two-story witch's office building, open front like a dollhouse showing a heavy rosewood desk with three paper scrolls and a red seal stamp, cluttered shelves, a crooked chimney, candle glow in the window` |
| p1-vault | `a squat stone bank vault building with an open round iron door, gold coins and money sacks spilling out, iron bars on a small window` |
| p1-props | `a cluster of small props: a crooked street lamp, a wooden crate, a stack of coins` |
| jail-5 | `a small stone jail cell, open front, iron bars, a wooden bench, five tally marks scratched on the back wall in one group` |

## 면 2 (p2/) — 2막
| id | 프롬프트 (STYLE + ) |
|---|---|
| p2-sky | `a wide night sky backdrop with small bat silhouettes, a few stars, thin clouds, 16:9` |
| p2-ground | `a wide strip of cobblestone street at night, puddles reflecting warm light, 4:1, seamless` |
| p2-street | `a row of three narrow antique shop facades at night with a large empty wooden sign board hanging over the middle door, lanterns, closed shutters` |
| p2-house | `a small crooked witch's cottage, open front like a dollhouse showing a bedroom with a four-poster bed, a nightstand with a candle, a wooden cross hanging on the wall` |
| p2-props | `a cluster of small props: a wooden fence piece, a mailbox on a post, a sleeping black cat silhouette` |
| jail-10 | `a small stone jail cell, open front, iron bars, a wooden bench, ten tally marks scratched on the back wall in two groups of five` |

## 면 3 (p3/) — 3막·피날레
| id | 프롬프트 (STYLE + ) |
|---|---|
| p3-sky | `a wide dusk sky backdrop, deep violet fading to warm amber near the horizon, a few drifting embers, 16:9` |
| p3-ground | `a wide strip of dirt path with grass tufts and pumpkin vines, 4:1, seamless` |
| p3-field | `a pumpkin patch with large orange pumpkins, tangled vines, a wooden scarecrow post, a small wisp of flame on one vine` |
| jail-15 | `a small stone jail cell, open front, iron bars, a low table with playing cards, a teapot, fifteen tally marks scratched on the back wall in three groups of five` |
| p3-cafe | `a two-story antique cafe building, open front like a dollhouse showing a hall with three round tables on the ground floor and a kitchen with a big iron cauldron upstairs, warm light, an empty sign board above the door` |
| p3-plaza | `a small town square corner with a large ornate empty picture frame standing on an easel, a brass nameplate on a short post, cobblestones` |

## 방 내부 겹 (rooms/<room>/) — 방마다 5장
겹 순서: window(창밖) · wall(뒷벽) · furniture(가구) · figure(인물 — 원화, 생성 안 함) · frame(앞 문틀)

공통: `interior layer for a tunnel book, <내용>, flat front view, cut-out shape`
| room | window | wall | furniture | frame |
|---|---|---|---|---|
| office | `night sky through a round window` | `dark wood-panel wall with cluttered shelves of jars and books` | `a heavy rosewood desk with three scrolls, a red seal stamp, an inkwell, a fat sleeping cat on the corner` | `an arched doorway frame of dark wood with a brass plate area left empty` |
| vault | `dark stone` | `stone vault wall with a round iron door ajar` | `sacks of money and a spilling pile of coins and banknotes` | `a heavy iron-banded doorway frame` |
| street | `deep night sky with bats` | `a row of shuttered shop fronts` | `a hanging empty wooden sign board, two lanterns` | `a stone archway frame` |
| house | `moonlit window with curtains` | `bedroom wall with a hanging wooden cross` | `a four-poster bed with rumpled blankets, a nightstand with a candle` | `a cottage doorway frame with a crooked lintel` |
| field | `dusk sky with drifting embers` | `distant rolling hills with a scarecrow` | `large pumpkins and tangled vines, a water cannon on a cart` | `a wooden fence gate frame` |
| jail | `tiny barred window with night sky` | `stone wall with fifteen tally marks in three groups` | `a low table with playing cards, a teapot, a bench` | `iron bars doorway frame` |
| cafe | `warm kitchen glow through a serving hatch` | `cafe wall with a chalkboard area left empty and shelves of cups` | `three round tables with chairs, a counter with a big cauldron` | `a cafe doorway frame with an empty sign board above` |
| plaza | `night sky with a crescent moon` | `stone town-square wall with a lamp` | `a large ornate empty picture frame on an easel, a brass nameplate post` | `a stone archway frame with hanging bunting` |

## 인물·펫 (원화에서 추출 — 생성하지 않는다)
`extract_character.py`로 `~/Desktop/naraka/story/{n}.png`에서 오려낸다. 작가 웹 사용 동의 확인 후.
| id | 원화 | 쓰이는 곳 |
|---|---|---|
| okja-sit | 13 | office figure |
| okja-sleep | 6 | house figure |
| mell-cry | 4 | jail-5, jail figure |
| mell-mop | 14 | cafe figure |
| bana-drool | 6 | house (작게) |
| bana-dust | 15 | cafe figure |
| miho-sing | 9 | field figure |
| miho-dish | 16 | cafe figure |
| ghost-money | 1 | vault figure |
| group | 17 | plaza figure |
| cats | 13 | office (시온·코코) |
