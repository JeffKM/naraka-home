# 나라카 지도 히어로 — 3D 돌하우스 구도 초안 + 생성 프롬프트

2026-08-27. 홈 첫 화면 = **3D 돌하우스 건물**. 방을 누르면 카메라가 그 방 안으로 날아 들어가고(빨려들어감), 도착하면 그 방의 정보가 뜬다. 2D 이미지 크롭·줌이 아니다(8/27 결정).

## 0. 3D 파이프라인

```
① Gemini 2D 콘셉트(§4)  →  ② 이미지→3D (higgsfield generate_3d / Tripo / hunyuan3d)
→  ③ Blender 정리·재조립·텍스처 베이크 (blender MCP)  →  ④ glTF(.glb, Draco) 내보내기
→  ⑤ Next 홈에 React Three Fiber 캔버스 — 방 클릭 → 카메라 경로 이동 → HTML 정보 패널
```

- ②는 건물 통째 1회가 아니라 **방 8개를 각각 디오라마로 생성**해 Blender에서 격자로 조립한다. 단면 건물을 한 번에 넣으면 실내가 뭉개진다.
- ③에서 반드시 손을 댄다 — AI 3D 그대로는 "AI 느낌" 반려 전례(치비 장식)와 같은 길이다. 방 경계 기둥·바닥판은 Blender에서 새로 세워 격자를 정확히 맞춘다.
- ⑤ 카메라: 방마다 "정면 멀리 → 방 문턱 → 방 안" 3점 경로. 클릭하면 경로를 따라 들어가고, 이후 스크롤은 경로의 마지막 구간 + 정보 패널 등장에 연결. 뒤로 가기·다른 방 명패 클릭으로 빠져나온다.
- 성능 가드: 총 50k 삼각형·텍스처 2048² 4장 이내, 홈에서만 dynamic import, `prefers-reduced-motion`·WebGL 불가 시 정면 렌더 정지 이미지 + 명패 목록으로 폴백.
- 예산: three + R3F + drei ≈ 150KB gz, glb 목표 3~5MB.

## 0-1. 사장님이 뽑아 올 것

1. §4 프롬프트로 **정면 단면 콘셉트 1장** (전체 구도·팔레트 확정용, 그대로 폴백 이미지로도 씀)
2. §4-3 프롬프트로 **방별 디오라마 8장** (이미지→3D 입력. 배경 없는 단독 오브젝트여야 3D 변환이 깨끗함)

결과물은 `~/Desktop/naraka/map/` 에 두면 내가 ②~⑤를 진행한다.

## 1. 지도 형식: 카페 건물 단면도(돌하우스 뷰)

평면 지도가 아니라 **건물을 세로로 잘라 방마다 들여다보는 단면도**를 쓴다. 3D에서도 같은 구도 — 앞벽이 없는 돌하우스라 카메라가 방 안으로 곧장 들어갈 수 있다.

- 이유 ①: "카페 = 감옥 = 직장"이 한 건물 안에 층·방으로 다 들어간다. 지도 자체가 농담을 설명한다.
- 이유 ②: 방 하나 = 홈 섹션 하나. 앞벽이 없어 카메라가 방 안으로 곧장 들어가고, 방이 직육면체라 카메라 경로 3점(멀리→문턱→안)이 단순하다.
- 이유 ③: 모바일은 같은 3D 씬을 세로 카메라로 보면 되므로 별도 판이 필요 없다.

콘셉트 1장은 **16:9, 가로 3840px 이상**(폴백 정지 이미지 겸용).

## 2. 방 배치 (3층 × 좌우) — 8개 방 = 홈 8섹션

```
┌────────────────────────────────────────────────────────────┐
│  [옥상]  지붕 위 굴뚝·달·박쥐 몇 마리, 멀리 동성로 간판 불빛    │  ← ⑦ 오시는 길
├──────────────────────────┬─────────────────────────────────┤
│ 2F 좌  ② 사장실           │ 2F 우  ⑤ 게시판 벽·직원 사물함      │
│  옥자의 책상, 이력서 3장,   │  벽에 형기 빗금(////), 달력,        │
│  붉은 도장, 고양이 시온·코코 │  핀 꽂힌 종이들, 사물함 3칸          │
├──────────────────────────┼─────────────────────────────────┤
│ 1F 좌  ③ 주방             │ 1F 우  ④ 홀                        │
│  주방요괴, 큰 솥, 물대포,   │  테이블 3~4개, 멜(걸레), 바나(먼지  │
│  설거지 중인 미호, 규종     │  떨이), 방문자 2~3명, 「나라카」 간판│
├──────────────────────────┼─────────────────────────────────┤
│ B1 좌  ⑥ 감옥 = 휴게실     │ B1 우  ⑧ 우편함·명패               │
│  창살, 화투 치는 선배, 우는  │  「@naraka_concafe」 명패, 편지 더미,│
│  신입, 강아지 선아·수아     │  낡은 다이얼 전화기                 │
└──────────────────────────┴─────────────────────────────────┘
      ① 정문 = 건물 정면 1F 중앙 문 + 「나라카」 간판 (홀과 겹침)
```

| # | 방 | 홈 섹션 | 목적지 | 명패 문안(HTML로 얹음) |
|---|---|---|---|---|
| ① | 정문·간판 | 릴스 영상 | 히어로 영상 재생 | 정문 |
| ② | 사장실 | 나라카란 — 설화 한 컷 | `/about` | 사장실 |
| ③ | 주방 | 메뉴 | `/menu` | 주방 |
| ④ | 홀 | 출근 요괴 | `/staff` | 홀 |
| ⑤ | 게시판 벽 | 이번 달 달력·출근표 | `#calendar` | 게시판 |
| ⑥ | 감옥(휴게실) | 놀거리·이벤트 | `/events`, `/games` | 휴게실 |
| ⑦ | 옥상 | 오시는 길 | `/location` | 옥상 |
| ⑧ | 우편함 | 공지·인스타 | `/notice`, 인스타 | 우편함 |

명패·모든 글자는 **그림에 넣지 않고 HTML로 얹는다.** 생성 모델의 한글은 깨지고, 나중에 문안을 바꿀 수 있어야 한다. 그림에 허용하는 문자는 캐논 소품 언어 2개뿐 — 「나라카」 간판, 「@naraka_concafe」 명패. 이것도 깨지면 HTML로 대체하므로 필수는 아니다.

## 3. 카메라·스타일

- 시점: 정면 살짝 위(약 15°)에서 본 돌하우스 단면. 아이소메트릭 X — 3D 변환 시 방 벽이 축에 정렬돼야 Blender 조립이 쉽다.
- 시간: 밤. 창밖은 남보라 밤하늘, 실내는 촛불·전구 주황빛. 기존 "나라카 앤틱" 팔레트(다크 오크 #1A0F07, 앤틱 골드 #C8B16B, 양피지 #EBDFB6, 레드 래커 #A41010)를 그대로 쓴다.
- 결: 앤틱 레트로 원화. 치비 웹툰 결이 아니다(홈페이지는 앤틱 메인 확정). 인물은 작게 넣고 방·소품이 주인공.
- 여백: 각 방 상단 왼쪽에 명패가 들어갈 **빈 벽면**을 남긴다. 방 경계는 두꺼운 나무 기둥·바닥판으로 분명히.
- 인물은 캐논 그대로: 마녀 옥자(사장), 구미호 미호, 강시 멜, 뱀파이어 바나, 주방요괴, 방문자들. 펫: 시온(뚱뚱한 고양이)·코코·규종(고양이), 선아·수아(강아지). **새 인물 추가 금지.**

## 4. Gemini 프롬프트

첨부 권장: 사장님이 갖고 계신 앤틱 목업 2장(팔레트 참조) + 치비 원화 1~2장(캐릭터 생김새 참조, "스타일은 따르지 말고 캐릭터 디자인만 참조"라고 명시).

### 4-1. 메인 (영문 — 이미지 모델은 영문이 안정적)

```
A tall cutaway dollhouse cross-section illustration of a three-story antique building at night, seen straight-on from slightly above (about 15 degrees, NOT isometric). The building is a yokai-themed concept cafe called "Naraka" that is also a prison and a workplace — all the same place. Wide 16:9 composition, the building fills the frame with a little night sky above.

Layout, six rooms in a 3x2 grid plus rooftop, separated by thick dark-oak beams and floor slabs:
- Rooftop: chimney, crescent moon, a few small bats, distant neon city signs far away.
- 2F left, owner's office: a witch in a wide-brim hat sitting at a heavy rosewood desk, three resumes and a red seal stamp on the desk, one fat cat and one normal cat sleeping nearby. Cluttered shelves, candle light.
- 2F right, staff notice wall: a wall covered with tally marks scratched in groups of five, a pinned calendar, pinned papers, three small lockers. Leave the upper-left wall area empty.
- 1F left, kitchen: a large iron cauldron, a kitchen yokai cooking, a nine-tailed fox girl washing a mountain of dishes at the sink, a cat watching, a water cannon leaning in the corner.
- 1F right, main hall: three or four cafe tables with a few guests, a jiangshi girl (paper talisman on forehead) mopping the floor, a small vampire girl dusting with a feather duster, a wooden sign reading "나라카" above the front door in the center of the ground floor.
- B1 left, the jail that is actually the break room: iron bars, a senior staff playing cards on the floor, a new recruit crying in the corner, two small dogs.
- B1 right, mail room: a brass nameplate reading "@naraka_concafe", a pile of letters, an old rotary phone, a mailbox.

Style: antique retro storybook illustration, ink outlines with warm painted fills, aged paper texture, muted palette — dark oak brown #1A0F07, antique gold #C8B16B, parchment #EBDFB6, deep lacquer red #A41010 as the accent, navy-violet night sky outside the windows, warm orange candle and bulb light inside. Cozy and slightly mischievous, not scary. Characters are small; the rooms and props are the main subject. Every room must be a clean rectangle with an empty patch of wall in its upper-left corner for a label to be added later.

No text anywhere except the two signs described. No watermark, no border, no UI. Ultra high resolution.
```

### 4-2. 한글판 (Gemini 대화창에 붙일 때)

```
밤의 3층 앤틱 건물을 세로로 잘라 방마다 들여다보는 돌하우스 단면 일러스트. 정면에서 살짝 위(15도 정도, 아이소메트릭 아님)에서 본 시점. 이 건물은 요괴 컨셉카페 "나라카"인데 감옥이자 직장이기도 하다 — 전부 같은 곳. 16:9 가로, 건물이 화면을 거의 채우고 위에 밤하늘이 조금.

배치 — 두꺼운 다크 오크 기둥과 바닥판으로 나뉜 3×2 방 + 옥상:
- 옥상: 굴뚝, 초승달, 작은 박쥐 몇 마리, 멀리 도시 네온 간판.
- 2층 왼쪽 사장실: 챙 넓은 모자의 마녀가 묵직한 로즈우드 책상에 앉아 있고, 책상 위에 이력서 세 장과 붉은 도장. 뚱뚱한 고양이 한 마리와 보통 고양이 한 마리가 곁에서 잠. 어수선한 선반, 촛불.
- 2층 오른쪽 게시판 벽: 다섯 개씩 묶어 그은 빗금이 가득한 벽, 핀 꽂힌 달력과 종이들, 작은 사물함 세 칸. 벽 왼쪽 위는 비워 둘 것.
- 1층 왼쪽 주방: 큰 무쇠 솥, 요리하는 주방요괴, 싱크대에서 산더미 설거지를 하는 구미호 소녀, 지켜보는 고양이, 구석에 기대 둔 물대포.
- 1층 오른쪽 홀: 테이블 서너 개와 손님 몇 명, 이마에 부적을 붙인 강시 소녀가 걸레질, 작은 뱀파이어 소녀가 먼지떨이질, 1층 중앙 정문 위에 「나라카」 나무 간판.
- 지하 왼쪽 감옥(사실은 휴게실): 창살, 바닥에서 화투 치는 선배, 구석에서 우는 신입, 작은 강아지 두 마리.
- 지하 오른쪽 우편실: 「@naraka_concafe」 황동 명패, 편지 더미, 낡은 다이얼 전화기, 우편함.

스타일: 앤틱 레트로 동화책 삽화. 먹선 윤곽에 따뜻한 채색, 낡은 종이 질감. 팔레트 — 다크 오크 #1A0F07, 앤틱 골드 #C8B16B, 양피지 #EBDFB6, 강조색 레드 래커 #A41010, 창밖은 남보라 밤하늘, 실내는 주황 촛불·전구빛. 아늑하고 살짝 장난스럽게, 무섭지 않게. 인물은 작게, 방과 소품이 주인공. 모든 방은 깔끔한 직사각형이고 왼쪽 위 벽에 나중에 명패를 얹을 빈 자리를 남길 것.

위에 적은 간판 둘 외에 글자 없음. 워터마크·테두리·UI 없음. 최고 해상도.
```

### 4-3. 방별 디오라마 프롬프트 (이미지→3D 입력용, 8장)

공통 머리말 뒤에 방 한 줄을 바꿔 8번 뽑는다. **배경은 단색 회색, 그림자 없이, 방 하나만** — 3D 변환기가 오브젝트 경계를 잡기 위한 조건이다.

```
A single isolated miniature diorama room, an open-front dollhouse box with three walls, a floor and a ceiling, seen straight-on from slightly above (15 degrees). Antique retro storybook style, ink outlines with warm painted fills, aged wood and parchment textures, palette dark oak #1A0F07, antique gold #C8B16B, parchment #EBDFB6, lacquer red #A41010, warm orange candle light inside. Plain flat mid-grey background, no cast shadow outside the box, no text, no border. Props are chunky and readable, small characters at most one-fifth of the room height. Ultra high resolution, product-shot clarity.

Room: <아래 한 줄>
```

| # | Room 줄 |
|---|---|
| ② 사장실 | `an owner's office: a witch in a wide-brim hat at a heavy rosewood desk with three resumes and a red seal stamp, one fat cat and one normal cat sleeping, cluttered shelves` |
| ⑤ 게시판 | `a staff notice wall room: walls covered in tally marks in groups of five, a pinned calendar and papers, three small lockers, a bench` |
| ③ 주방 | `a kitchen: a large iron cauldron on fire, a kitchen yokai cooking, a nine-tailed fox girl washing a mountain of dishes at the sink, a cat watching, a water cannon in the corner` |
| ④ 홀 | `a cafe hall: three small round tables with a few guests, a jiangshi girl with a paper talisman mopping, a small vampire girl dusting with a feather duster, a wooden front door in the back wall` |
| ⑥ 휴게실 | `a jail cell used as a break room: iron bars along one side, a senior staff playing cards on the floor, a new recruit crying in the corner, two small dogs, a kettle` |
| ⑧ 우편실 | `a mail room: a brass nameplate on the wall, a pile of letters, an old rotary phone on a small desk, a wall mailbox` |
| ⑦ 옥상 | `a rooftop terrace: a chimney, a crescent moon lamp, a few small bats, a railing, distant neon signs painted on the back wall` |
| ① 정문 | `a building entrance facade: a wooden sign above a double door, two lanterns, a doormat, a small window with warm light` |

### 4-4. 리테이크 때 덧붙일 문장

- 방이 기울어 나오면: `Keep every room a perfect front-facing rectangle. No perspective tilt on room walls.`
- 캐릭터가 크게 나오면: `Characters at most one-fifth of a room's height.`
- 글자가 깨져 나오면: `Remove all text and signs entirely.` (간판·명패는 HTML로 얹는다)
- 너무 어두우면: `Brighten interior lighting; each room must be clearly readable.`

## 5. 뽑은 뒤 확인할 것

1. 콘셉트 1장: 8개 방이 직사각형 격자로 읽히는가, 팔레트가 앤틱 목업과 맞는가
2. 디오라마 8장: 배경이 단색인가, 방 앞면이 열려 있는가(앞벽이 있으면 카메라가 못 들어간다), 캐릭터가 작은가
3. 캐논 밖 인물이 섞여 있지 않은가 (특히 왕·신·저승사자류)
4. 8장의 결이 서로 맞는가 — 한 장만 다른 결이면 그 방만 리테이크

받으면 `~/Desktop/naraka/map/` 에 두고 알려 주면 이미지→3D부터 진행한다.
