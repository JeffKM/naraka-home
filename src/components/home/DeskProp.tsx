import Image from "next/image";

// 데스크 소품 — 여백에 띄우는 장식 레이어가 아니라, 콘텐츠 덩어리(양피지 시트·달력 액자·카드)의
// 모서리에 걸쳐 놓는 물건. 부모에 relative가 있어야 한다(.home-paper는 이미 relative).
// 가로 넘침을 막으려고 좌우 오프셋은 항상 콘텐츠 안쪽(양수)으로 두고, 위아래로만 모서리를 물린다.
// motion — sway: 매달린 듯 흔들림 / float: 둥실 떠오름. cord를 주면 위로 끈이 그려진다.
// 두 모션 모두 transform을 쓰므로 rotate 유틸리티와 같이 주면 안 된다.
export function DeskProp({
  src,
  width,
  height,
  className,
  motion,
  cord = false,
}: {
  src: string;
  width: number;
  height: number;
  className: string;
  motion?: "sway" | "float";
  cord?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={[
        "pointer-events-none absolute z-10 select-none",
        motion === "sway" ? "home-hang" : "",
        cord ? "home-hang-cord" : "",
        motion === "float" ? "home-wisp-float" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Image src={src} alt="" width={width} height={height} className="h-auto w-full" />
    </div>
  );
}
