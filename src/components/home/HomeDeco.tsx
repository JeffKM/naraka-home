import Image from "next/image";

// 원화 컷아웃 장식 레이어 — position:relative 부모(콘텐츠 영역)에 깔린다.
// 여정(릴스) 칸에는 콘텐츠가 꽉 차므로 이 레이어를 여정 위에 두지 않는다.
export function HomeDeco() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 hidden select-none xl:block">
      <div className="home-hang absolute left-[4vw] top-0">
        <Image src="/home/deco/hanging-tassel.webp" alt="" width={108} height={195} />
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
        width={92}
        height={54}
        className="home-wisp-float absolute right-[5vw] top-[130px] [animation-delay:0.8s]"
      />
      <Image
        src="/home/deco/wisp-b.webp"
        alt=""
        width={50}
        height={75}
        className="home-wisp-float absolute right-[4vw] top-[360px] [animation-delay:1.6s]"
      />
    </div>
  );
}
