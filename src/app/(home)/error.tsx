"use client";

import { PageIllust, PageTitle, Spread } from "@/components/home/book/Spread";
import { storySrc } from "@/lib/book/art";

// 쪽 데이터 오류 — 그 쪽만 빈 상태로, 책·메뉴는 그대로 동작
export default function HomeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Spread
      left={
        <>
          <PageTitle>이 쪽을 펼치지 못했어요</PageTitle>
          <PageIllust src={storySrc(14)} alt="걸레질하는 멜" />
        </>
      }
      right={
        <div className="flex flex-col gap-4">
          <p className="leading-7">잠깐 문제가 생겼어요. 잠시 후 다시 펼쳐 주세요.</p>
          <button
            type="button"
            onClick={reset}
            className="home-btn home-btn-primary inline-flex min-h-11 w-fit items-center px-5"
          >
            다시 펼치기
          </button>
        </div>
      }
    />
  );
}
