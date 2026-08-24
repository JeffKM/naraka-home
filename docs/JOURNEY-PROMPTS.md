# 여정 장면 이미지 — 생성 프롬프트 팩

> 사장님이 Gemini/Midjourney로 장면 4장을 생성할 때 사용. 완성된 그림에서
> 색·질감·서체 감성을 뽑아 홈페이지 디자인 시스템을 역산한다 (그림이 무드 원본).
> 제작 파이프라인·프레임 추출 절차는 `docs/JOURNEY-ASSETS.md` 참고.

## 공통 준비

- **스타일 레퍼런스**: 앤틱 레트로 순정만화풍 원화 4장(옥자·미호·멜·바나)을 함께 첨부.
  - Midjourney: `--sref <원화 이미지 URL>` (여러 장 가능), 필요시 `--sw 200`으로 스타일 강도 ↑
  - Gemini: 원화를 이미지로 첨부하고 "이 그림체·색감 그대로" 명시
- **비율 두 벌**: 데스크톱 `16:9` + 모바일 `9:16` (Midjourney `--ar 16:9` / `--ar 9:16`).
  같은 장면을 크롭이 아니라 각 비율로 따로 생성하는 쪽이 구도가 좋다.
- **밤 무드 고정**: 모든 장면 공통. 광원은 촛불·샹들리에·유령빛 불꽃(위스프)만.
- **문자 소품 주의**: AI가 글자를 뭉개기 쉽다. 명패 「@naraka_concafe」·간판 「나라카」는
  생성 후 확대해 스펠링 확인, 깨졌으면 그 부분만 인페인팅으로 재생성하거나 후보정.
- **등장 인물 제한**: 캐논 4인(옥자·미호·멜·바나)과 펫만. 새 인물·생물 창조 금지.
  홀 장면에서 얼굴이 뭉개질 것 같으면 실루엣/뒷모습 처리가 안전.

### 공통 스타일 블록 (모든 프롬프트 끝에 붙이기)

```
antique retro shoujo manga illustration style, vintage romance comic aesthetic,
delicate linework, muted burgundy and cream and amber palette, dark academia interior,
warm candlelight against deep night shadows, ornate wooden furniture, lace details,
nostalgic grainy texture, no text unless specified, no modern objects
```

## 장면 1 — 마녀의 책상 (오프닝)

카메라: 책상 위를 비스듬히 내려다보는 클로즈업. 릴스 엔딩과 대칭을 이루는 앵글.

```
A witch's antique wooden desk at night, seen from a slightly elevated angle.
On the desk: a brass name plate engraved "@naraka_concafe", a small stack of
handwritten resumes, a red ink seal stamp beside a red stamp pad, a lit candle,
and one small floating pale-blue wisp flame. In the background, slightly out of
focus, a framed group photograph stands upright — it will be the gateway of the
next scene. Cozy yet eerie mood, deep shadows beyond the candlelight.
```

- 체크: 명패 스펠링 / **액자가 화면 안에 반드시 존재** (장면 2 진입점)

## 장면 2 — 단체사진 액자 다이브

카메라: 장면 1의 액자를 정면으로, 화면 대부분을 액자가 차지하도록.

```
Extreme close-up of an ornate antique picture frame on a witch's desk, filling
most of the view. Inside the frame: a warm group photograph of four monster girls
and their pets posing together in a cozy cafe — a witch, a nine-tailed fox girl,
a jiangshi girl, a vampire girl. The photo glows faintly as if it is a doorway.
The camera feels like it is about to fly into the photograph. Candlelight edge
lighting on the gilded frame, night mood.
```

- 체크: 인물 4인 구성(추가 인물 금지) / 액자 안 장면이 **장면 3의 홀과 같은 공간**으로 보이게

## 장면 3 — 카페 홀 통과

카메라: 홀 한가운데를 낮게 전진하는 시점 (dolly-in). 장면 2의 사진 속 공간에 "들어온" 상태.

```
Flying low through the middle of an antique cafe hall at night, first-person
camera moving forward. Burgundy velvet curtains, a crystal chandelier with warm
candle bulbs, dark polished wood tables and chairs, lace tablecloths, bookshelf
walls. Monster girl staff glimpsed in passing as soft silhouettes — one wiping
a table, one carrying a tray, a fat cat sleeping on a chair. At the far end of
the hall, a large cork notice board on the wall, still small in the distance —
the camera is heading toward it. Warm pools of light, deep shadows between.
```

- 체크: **막다른 벽의 게시판이 원경에 보일 것** (장면 4 진입점) / 스태프는 실루엣 처리

## 장면 4 — 게시판 도착 (여정 종료)

카메라: 게시판 정면 클로즈업. 이 위로 실제 달력·출근표 UI가 내려앉으며 전환된다.

```
A large antique cork notice board mounted on a dark wood wall, seen straight-on
and filling the frame. Pinned on it: a hand-drawn monthly calendar sheet, small
name cards, ribbon strings, wax seals, a few polaroid photos of cafe moments.
One pale-blue wisp flame hovers at the corner like a lamp. The board is lit by
a single warm sconce above it, night mood. Slightly soft focus at the edges,
center sharp — leaving calm space for UI to overlay.
```

- 체크: 중앙부가 과하게 복잡하지 않을 것 (UI가 얹힐 여백) / 종이·핀 소품의 색이 팔레트 안일 것

## 장면 연결 원칙 (이음새)

힉스필드 image-to-video는 **생성 이미지가 클립의 시작 프레임**이 된다. 따라서:

1. 장면 1 이미지로 클립 1 생성 (액자를 향해 전진)
2. **클립 1의 마지막 프레임을 캡처**해서, 장면 2 이미지 생성 시 구도 레퍼런스로 첨부
   ("이 구도에서 시작하는 그림" — Gemini에 캡처 첨부가 가장 확실)
3. 같은 방식으로 2→3, 3→4 반복
4. 힉스필드에서 시작+끝 프레임을 함께 지정할 수 있는 모델이면 그걸 쓰는 게 이음새가 가장 좋다
5. 그래도 어긋나면 클립 경계 0.3초 크로스 디졸브 (`JOURNEY-ASSETS.md` 폴백 절차)

## 다음 단계 (그림 완성 후)

1. 힉스필드 클립 4개 → 프레임 추출 → `manifest.json` mode "frames" (`JOURNEY-ASSETS.md`)
2. 완성 그림에서 **디자인 시스템 역산**: 실제 팔레트 추출(현 크림/버건디/앰버 임시값 교체),
   그림체에 어울리는 한글 서체 선정, 버튼·카드·괘선 등 컴포넌트 질감 재정의
