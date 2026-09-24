# 책 홈페이지 — 그림 목록 + Gemini 프롬프트 원장

2026-09-23 브레인스토밍에서 확정. 3D 팝업북(`scripts/book/PROMPTS.md`)은 폐기되며 이 문서가 대체한다.

## 원칙

- **그림체는 스토리 원화(`~/Desktop/naraka/story/1~17.png`)에 맞춘다** — 굵은 검정 외곽선, 평면 채색, 치비 비율. 앤틱함은 화풍이 아니라 소재(고딕 가구·양피지)와 색(적갈·먹·크림)으로 낸다.
- 그림 안에 글자를 넣지 않는다. 책 제목·명패·지도 지명은 전부 HTML 텍스트.
- 인물은 원화로만 등장한다. 옥자님은 인트로·책 교체 연출에서 **손과 그림자만**(C안).
- 캐논 인물·펫만 쓴다: 옥자·미호·멜·바나·주방요괴·방문자 / 시온·코코·규종·선아·수아.

## Gemini 사용법

- 모든 프롬프트에 **원화 `13.png`, `17.png`를 참조 이미지로 첨부**한다(1번 지옥문은 `5.png`도 추가).
- 오려 쓸 그림(4·14·15·16)은 **초록 단색 배경 #00FF00** — 원화 팔레트에 초록이 거의 없어 키잉이 쉽다.
- 모든 프롬프트 앞에 아래 공통 스타일 블록을 붙인다(`[STYLE]` 자리).
- 결과물은 아래 표의 파일명으로 `~/Desktop/naraka/book-art/raw/`에 저장한다. 리테이크는 `-v2`, `-v3` 접미사.

```
STYLE: Match the attached reference images exactly — chibi webtoon illustration,
thick uniform black outlines, flat cel coloring with at most one soft shadow tone,
no gradients, no painterly or realistic rendering. Palette: dark maroon-brown,
charcoal gray, parchment cream, orange-red, muted teal-blue, glowing cyan-blue
flames. Antique gothic furniture and props. No text, no letters, no numbers,
no symbols, no logos, no watermark.
```

## 원화로 쓰는 곳 (생성 불필요)

| 쓰임 | 원화 |
|---|---|
| 소개 책 본문 (펼친 양면에 2장씩) | 프롤로그 13 → 1막 1~4 → 2막 5~8 → 3막 9~12 → 피날레 14~17 |
| 목차 머리 삽화 — 홈 | 13 |
| 목차 머리 삽화 — 소개 | 12 |
| 목차 머리 삽화 — 요괴 | 17 |
| 목차 머리 삽화 — 공지 | 5 |
| 목차 머리 삽화 — 이벤트 | 9 |
| 목차 머리 삽화 — 메뉴 | 16 |
| 방 컷아웃 | 시온(13·7), 코코(13·16), 위스프(13·9), 박쥐(5·7) |
| 인트로 문 여는 그림자 | 3 (옥자 실루엣) |
| 빈 상태 | 14 |

원화엔 인스타 캐러셀 UI(하단 점·좌우 화살표·프로필 아이콘)가 구워져 있어 크롭 또는 인페인트가 필요하다.

## 새로 그릴 그림 — 18장 + 모바일 세로판 3장

| # | 파일명 | 그림 | 비율 | 배경 |
|---|---|---|---|---|
| 1 | `01-gate.png` | 지옥문 | 16:9 | 장면 |
| 2 | `02-office.png` | 옥자의 집무실 전경 | 16:9 | 장면 |
| 3 | `03-shelf.png` | 책장 클로즈업 | 4:5 | 장면 |
| 4 | `04-spines.png` | 책등 8종 시트 | 16:9 | 초록 |
| 5~12 | `05-cover-home.png` … `12-cover-games.png` | 책 표지 8종 | 3:4 | 장면 |
| 13 | `13-desk.png` | 책상 (책 펼칠 자리) | 16:9 | 장면 |
| 14 | `14-hand-pull.png` | 옥자의 손 — 책 꺼내기 | 1:1 | 초록 |
| 15 | `15-hand-open.png` | 옥자의 손 — 표지 펼치기 | 1:1 | 초록 |
| 16 | `16-ornaments.png` | 책 쪽 장식 시트 | 1:1 | 초록 |
| 17 | `17-mahjong.png` | 게임 목차 삽화 — 마작 | 4:3 | 장면 |
| 18 | `18-map.png` | 오시는 길 손그림 지도 | 4:3 | 장면 |
| M1 | `01-gate-m.png` | 지옥문 세로판 | 9:16 | 장면 |
| M2 | `02-office-m.png` | 집무실 세로판 | 9:16 | 장면 |
| M3 | `13-desk-m.png` | 책상 세로판 | 9:16 | 장면 |

책 표지 파일명: `05-cover-home` · `06-cover-about` · `07-cover-location` · `08-cover-menu` · `09-cover-staff` · `10-cover-notice` · `11-cover-events` · `12-cover-games`.

---

### 1. 지옥문 — `01-gate.png` (16:9, 참조 13·17·5)

```
[STYLE] Front view of a massive antique gothic double door — the entrance to
"Naraka", a cozy hell-themed cafe. Dark maroon-brown wood with black iron
bands, rivets and ornate hinges, two small cyan-blue flames in iron sconces on
each side, a few purple bats resting on the arch. The two door leaves meet
exactly at the vertical center line, perfectly symmetrical, closed. Night,
charcoal stone wall around it. No people. 16:9.
```

### 2. 옥자의 집무실 전경 — `02-office.png` (16:9)

```
[STYLE] Wide interior view of a witch boss's office in a hell-themed cafe,
eye-level, cozy and slightly spooky. Center: a tall antique gothic bookshelf
with exactly eight empty book slots on the middle shelf, potion bottles and a
skull bookend on other shelves. Left wall: an iron-barred jail door with warm
dim light beyond it, tally marks scratched on the wall next to it. Right wall:
a wooden rack hanging a mop, a feather duster, a scrub brush and an apron.
Back window: night city of small crooked rooftops with a faint glowing sign
shape (no letters). Foreground bottom edge: the top of a dark wooden desk.
Floating cyan-blue flame wisps. No people, no animals. 16:9.
```

### 3. 책장 클로즈업 — `03-shelf.png` (4:5)

```
[STYLE] Close-up front view of the same antique gothic bookshelf from the
reference office, centered. The middle shelf has exactly eight empty upright
book slots, evenly spaced, clearly empty. Upper shelf: potion bottles, a small
skull bookend, a candle. Lower shelf: scrolls and a small jar. Dark maroon-brown
wood, warm candle light. No books in the middle row, no people. 4:5.
```

2번 결과물이 나오면 함께 참조로 첨부해 같은 책장이 되게 한다.

### 4. 책등 8종 시트 — `04-spines.png` (16:9, 초록)

```
[STYLE] Eight antique hardcover book spines standing upright side by side,
evenly spaced with gaps, isolated on a flat solid pure green (#00FF00)
background, no shadows on the background. Left to right:
1 deep red leather with a round red seal stamp,
2 thick dark brown leather chronicle with brass corners,
3 faded blue atlas with a compass-rose emblem,
4 cream recipe book with a small teacup emblem,
5 bundle of parchment resumes tied with red string,
6 gray folded bulletin papers bound with a black clip,
7 maroon ledger with a small calendar-grid emblem,
8 dark green ledger with a mahjong tile emblem (blank tile, no characters).
No text on any spine.
```

순서 = 홈·소개·오시는 길·메뉴·요괴·공지·이벤트·게임.

### 5~12. 책 표지 8종 (각 3:4)

틀은 같고 `[COVER]`만 바꾼다. 4번 책등 시트를 참조로 첨부해 색·문양을 맞춘다.

```
[STYLE] Front cover of a closed antique hardcover book, straight-on flat view,
filling the frame with a thin dark margin. [COVER]. Worn corners, subtle
gold-brown tooled border. Leave the upper-center area plain for a title that
will be added later. No text. 3:4.
```

| # | 파일명 | 책 | [COVER] |
|---|---|---|---|
| 5 | `05-cover-home.png` | 홈 | deep red leather, a large round red wax-seal stamp in the lower center, two tiny cyan flames at the corners |
| 6 | `06-cover-about.png` | 소개 | thick dark brown leather chronicle, brass corner guards, an embossed witch hat emblem |
| 7 | `07-cover-location.png` | 오시는 길 | faded blue atlas, compass rose emblem, a dotted path winding across |
| 8 | `08-cover-menu.png` | 메뉴 | cream recipe book, teacup and fork emblem, small pumpkin doodles |
| 9 | `09-cover-staff.png` | 요괴 | parchment resume folder tied with red string, a red stamp mark on the corner |
| 10 | `10-cover-notice.png` | 공지 | gray bulletin papers clipped with a black iron clip, a small bat emblem |
| 11 | `11-cover-events.png` | 이벤트 | maroon ledger, calendar-grid emblem with one circled day, a ribbon bookmark |
| 12 | `12-cover-games.png` | 게임 | dark green ledger, a row of mahjong tiles emblem (blank or dot patterns only), a small dice |

### 13. 책상 — `13-desk.png` (16:9)

```
[STYLE] View from slightly above of the witch boss's antique dark wooden desk,
the reference office behind it softly visible. The central area of the desk is
completely empty and flat — space for an open book. Around the edges: a stack
of rolled parchment resumes, a red seal stamp on an ink pad, a teacup, a
black witch hat with a red feather, a quill in an ink bottle, a small jar,
two old books. A plump white-and-calico round cat sleeping at the right edge
and a small black cat sitting at the left edge, matching the reference cats.
Cyan flame wisp floating. No people. 16:9.
```

흰 삼색 뚱냥이 = 시온, 검은 고양이 = 코코.

### 14·15. 옥자의 손 (각 1:1, 초록)

```
[STYLE] A witch's hand and forearm only, matching the reference witch: orange-
red ruffled sleeve with lace cuff, pale chibi hand. [POSE]. Isolated on a flat
solid pure green (#00FF00) background, no shadow. No face, no body. 1:1.
```

| # | 파일명 | [POSE] |
|---|---|---|
| 14 | `14-hand-pull.png` | reaching forward and gripping the top of a book spine, pulling it out, seen from the side |
| 15 | `15-hand-open.png` | palm down, gently pushing open a book cover from the right edge, seen from above |

#### 15 리테이크 — `15-hand-open-v2.png` (2026-09-24)

1차본은 손 아래에 갈색 책까지 그려져 책 표지와 겹쳐 쓸 수 없었다. [POSE]에서 "book"을 빼고, 빈손 동작만 그리게 한다. 책은 화면에서 HTML·표지 그림으로 따로 깐다.

```
[STYLE] A witch's hand and forearm only, matching the reference witch: orange-
red ruffled sleeve with lace cuff, pale chibi hand. Seen from above, the hand
enters from the right edge of the frame, palm down and fingers slightly curled,
index and middle fingertips lifted as if about to flip something open to the
left. The hand is empty and holds nothing. Nothing under or near the hand: no
book, no paper, no page, no cover, no table, no object of any kind. Isolated on
a flat solid pure green (#00FF00) background filling the whole frame, no
shadow, no floor. No face, no body. 1:1.
```

- 첨부: 원화 `13.png`, `17.png` + 1차본 `14-hand-pull.png`(소매·손 모양 통일용)
- 확인: 손 밑에 책·종이가 없고, 배경이 전부 #00FF00 한 가지 색인지 본다. 그림자가 생기면 다시 뽑는다.

#### 15-P. 손 자세 5종 — 3D 책 시험판용 (2026-09-24)

3D 책 시험판(`/lab/book-gl`)에서 손 한 장을 손가락 마디·손목에서 접어 움직이니 종이처럼 보인다. 동작마다 다른 그림으로 바꿔 끼운다(접기는 손목 쪽에만 조금 남긴다). 다섯 장이 한 손처럼 이어져야 하므로 **구도를 다섯 장 모두 같게** 고정한다: 팔은 오른쪽 가장자리 세로 가운데로 들어오고, 레이스 소맷부리는 오른쪽에서 1/3 지점, 손은 왼쪽 2/3 안에 둔다.

```
[STYLE] A witch's hand and forearm only, the same hand as the attached hand
reference: orange-red ruffled sleeve with black lace cuff and teal band, pale
chibi hand, same size and line weight. Framing identical for every image in
this set: the forearm enters horizontally from the RIGHT edge of the frame at
exactly mid-height, the sleeve cut off cleanly by the right edge, the lace cuff
about one third in from the right edge, the hand in the left two thirds.
Seen from the front and slightly above, like looking across a desk. [POSE].
The hand is empty and holds nothing: no book, no paper, no page, no edge, no
object of any kind. Isolated on a flat solid pure green (#00FF00) background
filling the whole frame, no shadow, no floor. No face, no body. 4:3.
```

| # | 파일명 | 쓰는 곳 | [POSE] |
|---|---|---|---|
| P1 | `15-hand-p1-push.png` | 새 책 밀어 넣기 | palm down and flat, fingers together and relaxed, fingertips pressing lightly downward as if sliding something to the left along a table |
| P2 | `15-hand-p2-reach.png` | 잡으러 가기 | hand raised a little above the palm-down position, fingers straight and slightly spread, reaching forward to the left, about to take hold of something |
| P3 | `15-hand-p3-hook.png` | 쪽 사이에 손끝 넣기 | back of the hand up, knuckles raised, the four fingers curled downward like a hook, fingertips pointing down and slightly to the right, thumb tucked underneath |
| P4 | `15-hand-p4-hold.png` | 쥐고 세우기 | wrist turned so the palm faces left, thumb on the near side and the four fingers on the far side pinching together as if gripping a thin vertical sheet, wrist bent slightly upward |
| P5 | `15-hand-p5-release.png` | 놓기 | palm facing left and slightly down, all five fingers opened wide and spread apart, letting go, wrist relaxed |

- 첨부: 원화 `13.png`, `17.png` + `15-hand-open-v2.png`(손·소매 기준). P1을 먼저 뽑아 마음에 들면 **P2~P5에는 P1 결과도 함께 첨부**해 손 크기·소매를 맞춘다.
- 확인: ① 다섯 장 모두 소맷부리가 같은 자리(오른쪽에서 1/3)에 있는지 ② 손 밑에 책·종이·모서리가 그려지지 않았는지 ③ 배경이 #00FF00 한 색이고 그림자가 없는지. 셋 중 하나라도 어긋나면 그 장만 다시 뽑는다.
- 받으면: `process.py`에서 키잉 → 소맷부리 위치로 다섯 장을 정렬 → 소매를 화면 밖까지 늘인다(`hand_reach.py`와 같은 방식). 시험판은 자세가 바뀌는 구간마다 두 그림을 짧게 겹쳐 바꾼다.

### 16. 책 쪽 장식 시트 — `16-ornaments.png` (1:1, 초록)

```
[STYLE] A sprite sheet of antique book page ornaments isolated on a flat solid
pure green (#00FF00) background, well separated: four matching corner
flourishes (each corner orientation), one long thin horizontal border
flourish, one small page-number cartouche (empty), one red ribbon bookmark,
one small bat divider ornament. Dark brown ink line work with tiny red accents.
No text or numbers.
```

### 17. 게임 목차 삽화: 마작 — `17-mahjong.png` (4:3)

원화 `12.png`(감옥 휴게실)를 참조로 추가 첨부한다.

```
[STYLE] Inside the iron-barred jail break room of the reference, tally marks on
the wall. A low table with mahjong tiles laid out mid-game (tiles blank or
simple dot and bamboo patterns only, no characters), a teacup, scattered
snacks. Cozy dim warm light. No people — just the table as if the players just
left, a black cat sitting on one cushion. 4:3.
```

### 18. 오시는 길 손그림 지도 — `18-map.png` (4:3)

```
[STYLE] A hand-drawn treasure-map style street map on aged parchment, top-down.
A small downtown grid of streets, a main pedestrian street crossing the center,
a subway entrance icon, a few tiny rooftops and trees, a dotted path leading
to one building marked with a small witch hat and a cyan flame. Compass rose in
a corner. No text, no letters, no street names.
```

실제 동성로 지리는 반영하지 않는 분위기 그림이다. 정확한 위치는 아래 지도 링크와 HTML 주소로 안내한다.

### M1~M3. 모바일 세로판 (9:16)

1·2·13번 결과물을 참조로 첨부한다.

```
Recompose the attached image into a 9:16 vertical composition. Keep every
element, style and color identical; stack the layout vertically so the main
subject stays centered. No new objects, no text.
```

## 검수 체크리스트

- [ ] 글자·숫자·가짜 문자가 침입하지 않았다 (특히 책등·표지·마작 패·지도)
- [ ] 외곽선 굵기·채색 방식이 원화와 나란히 놓았을 때 튀지 않는다
- [ ] 책장 가운데 칸 8개가 비어 있다 (책등을 따로 얹기 위해)
- [ ] 초록 배경 그림은 배경이 단색이고 그림자가 없다
- [ ] 시온(흰 삼색 뚱냥이)·코코(검은 고양이)가 원화와 같은 모습이다
- [ ] 캐논 밖 인물·동물이 없다
