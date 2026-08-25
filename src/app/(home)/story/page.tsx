import { HomeDeco } from "@/components/home/HomeDeco";
import type { Metadata } from "next";
import { HOME_INFO } from "@/lib/homeConfig";

export const metadata: Metadata = {
  title: "설화",
  description: "나라카 채용 설화 — 마녀 사장의 이력서 심사와 세 요괴의 입사 이야기",
};

// 3막 요약 — 같은 6비트(이력서→욕망→행동→응징→감옥→도장)의 반복
const ACTS = [
  {
    act: "1막",
    name: "멜",
    species: "강시",
    story: "돈 이야기에 눈이 커지는 강시. 금고를 노리다 발차기에 붙잡혀 걸레를 쥐었다. 도장 — 종신.",
  },
  {
    act: "2막",
    name: "바나",
    species: "뱀파이어",
    story: "갈증을 참지 못한 뱀파이어. 남의 창가에 숨어들다 십자가에 쫓겨 먼지떨이를 쥐었다. 도장 — 종신.",
  },
  {
    act: "3막",
    name: "미호",
    species: "구미호",
    story: "본인만 모르는 구미호. 불을 내고 물대포를 맞은 뒤 수세미를 쥐었다. 도장 — 종신.",
  },
] as const;

const COMIC_COUNT = 17;

export default function StoryPage() {
  return (
    <>
      <HomeDeco />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="home-paper p-5 sm:p-8">
          <h1 className="text-2xl font-bold">나라카 채용 설화</h1>
          <p className="mt-4 leading-7">
            마녀 사장이 이력서 세 장을 심사했습니다. 지원자들은 전부 사고를 치고
            붙잡혀 감옥에 갇혔는데 — 그게 바로 채용이었습니다.
          </p>

          <div className="mx-auto mt-6 w-full max-w-[420px]">
            {/* 모바일: 9:16 풀폭 플레이어 */}
            <video
              className="w-full rounded-lg sm:hidden"
              controls
              playsInline
              preload="none"
              poster="/story/poster.webp"
              src="/story/naraka-story.mp4"
              aria-label="나라카 채용 설화 애니메이션"
            />
            {/* 데스크톱: 인스타 프레임 목업 안 재생 */}
            <div className="relative hidden aspect-[9/16] sm:block">
              <video
                className="absolute left-[10.19%] top-[8.13%] h-[79.64%] w-[79.63%] object-cover"
                controls
                preload="none"
                poster="/story/poster.webp"
                src="/story/naraka-story.mp4"
                aria-label="나라카 채용 설화 애니메이션"
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- 설화 에셋 */}
              <img
                src="/story/insta-frame.webp"
                alt=""
                className="pointer-events-none absolute inset-0 size-full"
              />
            </div>
          </div>

          <h2 className="mt-10 text-xl font-bold">세 번의 채용</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {ACTS.map((a) => (
              <div
                key={a.name}
                className="rounded-lg border border-[var(--home-line)] bg-[var(--home-surface)] p-4"
              >
                <p className="text-xs text-[var(--home-red)]">
                  {a.act} · {a.species}
                </p>
                <p className="mt-1 font-semibold">{a.name}</p>
                <p className="mt-2 text-sm text-[var(--home-muted)]">{a.story}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--home-muted)]">
            붙잡히는 것이 곧 채용 — 감옥은 직원 휴게실이고, 벽의 형기 빗금은
            근속이 됩니다. 오늘도 요괴들이 손님을 맞이합니다.
          </p>

          <h2 className="mt-10 text-xl font-bold">원화 컷</h2>
          <div className="scrollbar-none -mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
            {Array.from({ length: COMIC_COUNT }, (_, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- 설화 원화
              <img
                key={i}
                src={`/story/comic/${String(i + 1).padStart(2, "0")}.webp`}
                alt={`채용 설화 원화 ${i + 1}번`}
                loading="lazy"
                className="w-4/5 max-w-[360px] shrink-0 snap-center rounded-lg border border-[var(--home-line)]"
              />
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href={HOME_INFO.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="home-btn home-btn-primary px-5 py-2"
            >
              instagram @{HOME_INFO.instagramHandle}
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
