import Image from "next/image";
import Link from "next/link";
import { HeroVideo } from "@/components/home/HeroVideo";
import { HOME_INFO } from "@/lib/homeConfig";

// 홈 첫 화면 — 릴스 마지막 장면(밤의 책상 위 인스타)을 가로로 다시 지은 히어로
// 좌: 이름·태그라인·CTA·명패 / 우: 인스타 프레임 소품 안 하이라이트 루프 / 하단: 책상 상판 + 소품
export function DeskHero() {
  return (
    <section className="relative overflow-hidden bg-[var(--home-void)]">
      {/* 책상 상판 — 로즈우드 띠 (콘텐츠 뒤, 하단 고정) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 md:h-40"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(58,42,38,0.55) 30%, var(--home-rosewood-deep) 60%, #2a1e1b)",
        }}
      />
      <div className="mx-auto grid max-w-3xl gap-8 px-4 pb-24 pt-10 md:grid-cols-[1fr_auto] md:items-center md:gap-12 md:pb-32 md:pt-14">
        {/* 인스타 프레임 — 모바일은 위, 데스크톱은 우측 */}
        <Link
          href="/about"
          aria-label="나라카 채용 설화 보러 가기"
          className="relative order-first mx-auto block w-[220px] md:order-last md:w-[260px] lg:w-[300px]"
        >
          <span className="relative block aspect-[9/16] overflow-hidden">
            <HeroVideo className="absolute left-[10.19%] top-[8.13%] h-[79.64%] w-[79.63%] object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element -- 릴스 실물 소품 */}
            <img
              src="/story/insta-frame.webp"
              alt=""
              className="pointer-events-none absolute inset-0 size-full"
            />
          </span>
        </Link>

        <div className="text-center md:text-left">
          <p className="home-tally text-sm" aria-hidden>
            {"//// //"}
          </p>
          <h1 className="mt-1 text-4xl font-extrabold text-[var(--home-chalk)] sm:text-5xl">
            {HOME_INFO.name}
            <span className="text-[var(--home-heart)]">.</span>
          </h1>
          <p className="mt-3 text-base text-[var(--home-muted)] sm:text-lg">{HOME_INFO.tagline}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link href="#calendar" className="home-btn home-btn-primary px-5 py-2 text-sm">
              달력·출근표 보기
            </Link>
            <Link href="/about" className="home-btn px-5 py-2 text-sm">
              나라카 이야기
            </Link>
          </div>
        </div>
      </div>

      {/* 책상 위 소품 — 상판 띠 위 (넓은 화면 전용).
          콘텐츠 축(max-w-3xl) 바깥에 바로 붙여 배치하고, 밝기를 눌러 배경 오브젝트로 둔다
          (흰 방석이 CTA보다 시선을 먼저 끌던 문제) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden select-none opacity-85 [filter:brightness(0.82)] xl:block"
      >
        <Image
          src="/home/deco/video/v-inkwell.webp"
          alt=""
          width={84}
          height={150}
          className="absolute bottom-6 left-[calc(50%-476px)] w-[60px]"
        />
        <Image
          src="/home/deco/video/v-cushion.webp"
          alt=""
          width={150}
          height={151}
          className="absolute bottom-2 left-[calc(50%-396px)] w-[92px] -rotate-3"
        />
        <Image
          src="/home/deco/video/v-resume.webp"
          alt=""
          width={110}
          height={255}
          className="absolute bottom-3 right-[calc(50%-470px)] w-[76px] rotate-[8deg]"
        />
        <Image
          src="/home/deco/video/v-stamp-tool.webp"
          alt=""
          width={116}
          height={164}
          className="absolute bottom-5 right-[calc(50%-386px)] w-[66px] -rotate-6"
        />
      </div>
    </section>
  );
}
