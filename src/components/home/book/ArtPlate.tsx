import { ART, type ArtKey } from "@/lib/book/art";

// 그림이 있으면 img, 아직 없으면 라벨 붙은 빗금 판 (에셋 전에도 구조 검증 가능)
export function ArtPlate({
  art,
  className = "",
  alt = "",
}: {
  art: ArtKey;
  className?: string;
  alt?: string;
}) {
  const def = ART[art];
  if (def.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 책 무대 정적 WebP
      <img src={def.src} alt={alt} className={className} draggable={false} />
    );
  }
  return (
    <div
      className={`book-art-placeholder ${className}`}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <span>{def.label}</span>
    </div>
  );
}

// 화면 폭에 따라 가로/세로 그림 중 한 벌만 받는다 — 숨긴 img 두 벌을 두면 둘 다 내려받으므로
// <picture>의 media 분기로 고른다(768px 이상 = 가로). 그림이 아직 없으면 라벨 판 두 벌로 대신한다
export function ArtPicture({
  desktop,
  mobile,
  className = "",
}: {
  desktop: ArtKey;
  mobile: ArtKey;
  className?: string;
}) {
  const d = ART[desktop].src;
  const m = ART[mobile].src;
  if (d && m) {
    return (
      <picture className="contents">
        <source media="(min-width: 768px)" srcSet={d} />
        <img src={m} alt="" className={className} draggable={false} />
      </picture>
    );
  }
  return (
    <>
      <ArtPlate art={desktop} className={`${className} hidden md:flex`} />
      <ArtPlate art={mobile} className={`${className} md:hidden`} />
    </>
  );
}
