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
