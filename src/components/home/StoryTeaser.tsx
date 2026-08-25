import Link from "next/link";

// 홈 중단 티저 — 릴스 최종본을 /story에서 보도록 유도하는 인스타 프레임 목업
export function StoryTeaser() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-6">
      <div className="home-paper home-tape p-5 sm:p-7">
        <h2 className="home-plate text-xl font-semibold">나라카 채용 설화</h2>
        <p className="mt-2 text-sm text-[var(--home-muted)]">
          마녀 사장이 이력서 세 장을 심사했다. 지원자들은 전부 사고를 치고
          붙잡혔는데 — 그게 바로 채용이었다.
        </p>
        <Link
          href="/about"
          aria-label="채용 설화 보러 가기"
          className="group mx-auto mt-5 block w-full max-w-[260px]"
        >
          <span className="relative block aspect-[9/16] overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- 설화 에셋 */}
            <img
              src="/story/poster.webp"
              alt=""
              className="absolute left-[10.19%] top-[8.13%] h-[79.64%] w-[79.63%] object-cover"
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- 설화 에셋 */}
            <img src="/story/insta-frame.webp" alt="" className="absolute inset-0 size-full" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="home-btn home-btn-primary px-4 py-2 text-sm transition group-hover:brightness-110">
                영상 보기
              </span>
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
