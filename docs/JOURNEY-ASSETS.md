# 스크럽 여정 에셋 교체 가이드

## 제작 파이프라인 (분담)
1. 장면 이미지 4장 — 사장님이 Gemini/Midjourney로 생성 (앤틱 레트로 원화 4장을 스타일 레퍼런스로).
   장면: 마녀의 책상(명패·이력서·도장) → 단체사진 액자 다이브 → 카페 홀 → 게시판.
   원칙: 앞 장면의 "끝 프레임"과 다음 장면의 "시작 프레임"이 같은 구도여야 이음새가 자연스럽다.
2. 비행(dive-in) 클립 — 힉스필드 image-to-video. 장면당 3~5초, 카메라가 전진(dolly-in)하는 모션.
3. 프레임 추출 — 클립들을 순서대로 이어붙인 뒤 WebP 프레임 시퀀스로:

    # 클립 연결 (같은 해상도·fps 전제)
    ffmpeg -f concat -safe 0 -i clips.txt -c copy journey.mp4
    # 데스크톱 16:9 프레임 추출 (24fps, 1600px 폭)
    mkdir -p public/journey/desktop
    ffmpeg -i journey.mp4 -vf "fps=24,scale=1600:-2" -c:v libwebp -quality 78 public/journey/desktop/s_%04d.webp
    # 모바일 9:16 체인도 동일하게 public/journey/mobile 에

4. `public/journey/manifest.json` 갱신:
   - `"mode": "frames"`, `frames.count` = 추출된 프레임 수
   - scenes 배열의 image도 실제 장면 스틸로 교체 (정적 폴백·재방문 히어로에 사용)

## 용량 예산
- 프레임 수 = 클립 총 길이 × 24fps. 4장면 × 4초면 약 384프레임.
- WebP quality 78, 1600px 기준 프레임당 약 40~80KB → 총 15~30MB는 과하므로
  **fps=12로 낮추거나 quality 70으로 조정해 총 10MB 이하**를 목표로 한다.
  스크럽은 재생이 아니라 탐색이라 12fps도 충분히 부드럽다.
- 프레임은 지연 로드되며 첫 화면은 scenes[0].image가 즉시 보인다.

## 연결 실패 시 폴백
장면 간 프레임이 어긋나면 클립 경계에 0.3초 크로스 디졸브를 넣어 다시 추출:
    ffmpeg -i a.mp4 -i b.mp4 -filter_complex "xfade=transition=fade:duration=0.3:offset=3.7" ab.mp4
