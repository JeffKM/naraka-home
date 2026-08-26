import Link from "next/link";
import { BOOK_ROOMS } from "@/lib/homeBook";

// 3D를 못 켤 때(WebGL 불가·reduced-motion·저사양·saveData) — 표지 정지 이미지 + 8곳 목록. 정보 손실 없음.
export function BookFallback() {
  return (
    <section className="home-book-fallback">
      {/* eslint-disable-next-line @next/next/no-img-element -- LCP 정지 이미지, 최적화 파이프라인 밖 */}
      <img src="/home/book/cover/cover-still.webp" alt="" className="aspect-[16/9] h-auto w-full object-cover" width={1600} height={900} />
      {/* `.home-scope a { color: inherit }`가 .home-card의 잉크색을 이겨, 다크 바탕에선
         크림 카드 위에 백묵색 글자가 얹힌다(3.1:1). 목록에서 시트 잉크를 물려준다. */}
      <ul className="mx-auto mt-4 grid max-w-3xl grid-cols-2 gap-2 px-4 text-[var(--home-sheet-ink)] sm:grid-cols-4">
        {BOOK_ROOMS.map((r) => (
          <li key={r.id}>
            {r.href.startsWith("http") ? (
              <a href={r.href} target="_blank" rel="noreferrer" className="home-card flex min-h-11 items-center px-3 text-sm">
                {r.label}
              </a>
            ) : (
              <Link href={r.href} className="home-card flex min-h-11 items-center px-3 text-sm">
                {r.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
