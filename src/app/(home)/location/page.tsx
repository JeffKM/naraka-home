import type { Metadata } from "next";
import { HOME_INFO } from "@/lib/homeConfig";

export const metadata: Metadata = { title: "오시는 길" };

export default function LocationPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">오시는 길</h1>
      <dl className="mt-6 flex flex-col gap-4 text-sm">
        <div>
          <dt className="font-semibold">주소</dt>
          <dd className="mt-1 text-[var(--home-muted)]">{HOME_INFO.addressLine}</dd>
        </div>
        <div>
          <dt className="font-semibold">영업시간</dt>
          <dd className="mt-1 text-[var(--home-muted)]">{HOME_INFO.hoursNote}</dd>
        </div>
        <div>
          <dt className="font-semibold">예약·문의</dt>
          <dd className="mt-1">
            <a
              href={HOME_INFO.reserveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-md bg-[var(--home-burgundy)] px-4 py-2 text-[var(--home-surface)]"
            >
              인스타그램으로 예약·문의하기
            </a>
          </dd>
        </div>
      </dl>
      <p className="mt-8 text-xs text-[var(--home-muted)]">
        지도 안내는 준비 중입니다. 인스타그램 프로필의 위치 정보를 확인해주세요.
      </p>
    </main>
  );
}
