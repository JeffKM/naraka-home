import Image from "next/image";
import { HOME_INFO } from "@/lib/homeConfig";

export function HomeFooter() {
  return (
    <footer className="home-chrome relative mt-12 border-t-2 border-[var(--home-rosewood)]">
      <div className="relative mx-auto flex max-w-3xl flex-col gap-1 px-4 py-8 text-sm text-[var(--home-muted)]">
        {/* 릴스 발췌 — @naraka_concafe 명패 (책상 위 실물) */}
        <Image
          src="/home/deco/video/v-nameplate.webp"
          alt=""
          aria-hidden
          width={210}
          height={129}
          className="pointer-events-none absolute bottom-4 right-4 hidden select-none sm:block"
        />
        <p className="home-serif font-bold text-[var(--home-chalk)]">
          {HOME_INFO.name}
          <span className="text-[var(--home-heart)]">.</span>
        </p>
        <p>{HOME_INFO.addressLine}</p>
        <p>{HOME_INFO.hoursNote}</p>
        <a
          href={HOME_INFO.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 w-fit items-center underline underline-offset-2"
        >
          instagram @{HOME_INFO.instagramHandle}
        </a>
      </div>
    </footer>
  );
}
