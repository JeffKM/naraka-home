import Image from "next/image";
import { HOME_INFO } from "@/lib/homeConfig";

export function HomeFooter() {
  return (
    <footer className="home-wood relative mt-12 border-t-2 border-[var(--home-gold-deep)]">
      {/* 원화 장식 — 푸터 위를 걷는 검은 고양이(15화) */}
      <Image
        src="/home/deco/deco-cat.webp"
        alt=""
        aria-hidden
        width={86}
        height={76}
        className="pointer-events-none absolute -top-[74px] right-5 select-none"
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-1 px-4 py-8 text-sm text-[var(--home-muted)]">
        <p className="home-serif font-bold text-[var(--home-gold)]">
          {HOME_INFO.name}
          <span className="text-[var(--home-teal)]">.</span>
        </p>
        <p>{HOME_INFO.addressLine}</p>
        <p>{HOME_INFO.hoursNote}</p>
        <a
          href={HOME_INFO.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          instagram @{HOME_INFO.instagramHandle}
        </a>
      </div>
    </footer>
  );
}
