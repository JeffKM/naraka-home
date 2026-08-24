import { HomeDeco } from "@/components/home/HomeDeco";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "소개" };

const CAST = [
  { name: "옥자", role: "마녀 · 나라카의 주인", desc: "한 번도 화내지 않는다. 노려보고, 도장을 찍을 뿐이다." },
  { name: "미호", role: "구미호", desc: "꼬리 아홉 개를 살랑이며 노래한다. 사고를 쳐도 본인만 모른다." },
  { name: "멜", role: "강시", desc: "이마의 부적이 트레이드마크. 돈 이야기에 눈이 커진다." },
  { name: "바나", role: "뱀파이어", desc: "창가 티타임을 좋아한다. 박쥐와 함께 다닌다." },
] as const;

export default function AboutPage() {
  return (
    <>
      <HomeDeco />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="home-paper p-5 sm:p-8">
      <h1 className="text-2xl font-bold">나라카 이야기</h1>
      <p className="mt-4 leading-7">
        나라카(奈落)는 지옥을 뜻합니다. 이 카페는 지옥이고, 감옥이고, 직장입니다.
        셋은 같은 곳입니다 — 그게 이 가게의 유일한 농담이자 전부입니다.
      </p>
      <p className="mt-2 leading-7 text-[var(--home-muted)]">
        마녀 사장이 이력서 세 장을 심사했습니다. 지원자들은 전부 사고를 치고
        붙잡혀 감옥에 갇혔는데, 그게 바로 채용이었습니다. 오늘도 요괴들은
        형기를 근속으로 바꿔가며 손님을 맞이합니다.
      </p>
      <h2 className="mt-8 text-xl font-bold">요괴들</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {CAST.map((c) => (
          <div
            key={c.name}
            className="rounded-lg border border-[var(--home-line)] bg-[var(--home-surface)] p-4"
          >
            <p className="font-semibold">{c.name}</p>
            <p className="text-xs text-[var(--home-burgundy)]">{c.role}</p>
            <p className="mt-2 text-sm text-[var(--home-muted)]">{c.desc}</p>
          </div>
        ))}
      </div>
        </div>
      </main>
    </>
  );
}
