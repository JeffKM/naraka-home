import Image from "next/image";

// 원화·릴스 컷아웃 장식 레이어 — position:relative 부모(콘텐츠 영역)에 깔린다.
// 여정(릴스) 칸에는 콘텐츠가 꽉 차므로 이 레이어를 여정 위에 두지 않는다.
// tall: 홈·소개처럼 긴 페이지에서만 하단 확장 소품까지 렌더 (짧은 페이지는 잘림 방지)
export function HomeDeco({ tall = false }: { tall?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 hidden select-none xl:block">
      <div className="home-hang absolute left-[4vw] top-0">
        <Image src="/home/deco/hanging-tassel.webp" alt="" width={140} height={190} />
      </div>
      <Image
        src="/home/deco/wisp-a.webp"
        alt=""
        width={44}
        height={55}
        className="home-wisp-float absolute left-[calc(4vw+120px)] top-[150px]"
      />
      <Image
        src="/home/deco/deco-bat.webp"
        alt=""
        width={94}
        height={57}
        className="home-wisp-float absolute right-[5vw] top-[130px] [animation-delay:0.8s]"
      />
      <Image
        src="/home/deco/wisp-b.webp"
        alt=""
        width={50}
        height={75}
        className="home-wisp-float absolute right-[4vw] top-[360px] [animation-delay:1.6s]"
      />
      {/* 릴스 발췌 소품 — 밤의 책상 위 물건들 (긴 페이지 전용) */}
      {tall && (
        <>
          <Image
            src="/home/deco/video/v-note.webp"
            alt=""
            width={44}
            height={76}
            className="home-wisp-float absolute right-[7vw] top-[560px] [animation-delay:2.4s]"
          />
          <Image
            src="/home/deco/video/v-cushion.webp"
            alt=""
            width={150}
            height={151}
            className="absolute left-[3vw] top-[680px] -rotate-6"
          />
          <Image
            src="/home/deco/video/v-cross.webp"
            alt=""
            width={120}
            height={64}
            className="absolute right-[4vw] top-[940px] rotate-12"
          />
          <Image
            src="/home/deco/video/v-inkwell.webp"
            alt=""
            width={84}
            height={150}
            className="absolute left-[4vw] top-[1220px]"
          />
        </>
      )}
    </div>
  );
}
