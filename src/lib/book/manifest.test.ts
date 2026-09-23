import { describe, expect, it } from "vitest";
import type { HomeMenuItem, HomePost, HomeStaff } from "@/types/home";
import {
  buildErrorPage, buildEventManifest, buildGamesManifest, buildMenuManifest, buildNoticeManifest,
  buildStaffManifest, clampPage, eventPhase, listPageOf, orderEvents,
} from "./manifest";

function post(id: number, over: Partial<HomePost> = {}): HomePost {
  return {
    id, type: "event", title: `글${id}`, bodyMd: "", coverImageUrl: null, pinned: false,
    published: true, publishedAt: "2026-09-01T00:00:00Z", eventStartDate: null,
    eventEndDate: null, ...over,
  };
}

describe("buildNoticeManifest", () => {
  it("8개씩 목록 쪽을 만들고 상세 쪽을 뒤에 붙인다", () => {
    const posts = Array.from({ length: 10 }, (_, i) => post(i + 1, { type: "notice" }));
    const m = buildNoticeManifest(posts);
    expect(m.slice(0, 2).map((r) => r.key)).toEqual(["/notice", "/notice?page=2"]);
    expect(m.slice(0, 2).every((r) => r.kind === "list")).toBe(true);
    expect(m).toHaveLength(12);
    expect(m[2]).toMatchObject({ key: "/notice/1", kind: "detail", tab: "글1" });
  });
  it("공지가 없어도 목록 한 쪽은 있다", () => {
    expect(buildNoticeManifest([]).map((r) => r.key)).toEqual(["/notice"]);
  });
});

describe("이벤트", () => {
  const today = "2026-09-23";
  it("eventPhase — 끝난 날이 없으면 시작일 하루짜리", () => {
    expect(eventPhase(post(1, { eventStartDate: "2026-09-23" }), today)).toBe("ongoing");
    expect(eventPhase(post(1, { eventStartDate: "2026-09-22" }), today)).toBe("past");
    expect(eventPhase(post(1, { eventStartDate: "2026-09-24" }), today)).toBe("upcoming");
    expect(eventPhase(post(1, { eventStartDate: "2026-09-01", eventEndDate: "2026-09-30" }), today)).toBe("ongoing");
  });
  it("orderEvents — 진행 중 → 예정(가까운 순) → 지난(최근 순)", () => {
    const ordered = orderEvents([
      post(1, { eventStartDate: "2026-08-01", eventEndDate: "2026-08-30" }),
      post(2, { eventStartDate: "2026-10-10" }),
      post(3, { eventStartDate: "2026-09-20", eventEndDate: "2026-09-30" }),
      post(4, { eventStartDate: "2026-09-25" }),
      post(5, { eventStartDate: "2026-09-10" }),
    ], today);
    expect(ordered.map((p) => p.id)).toEqual([3, 4, 2, 5, 1]);
  });
  it("buildEventManifest — 달력 → 목록 → 상세", () => {
    const m = buildEventManifest([post(7), post(8)]);
    expect(m.map((r) => r.key)).toEqual(["/events", "/events?page=1", "/events/7", "/events/8"]);
    expect(m[0].kind).toBe("content");
  });
});

describe("메뉴·요괴·게임", () => {
  it("메뉴 분류는 처음 나온 순서, 중복 없이, 인코딩된 href", () => {
    const item = (id: number, category: string): HomeMenuItem => ({
      id, category, name: `m${id}`, price: 1000, description: "", imageUrl: null, sortOrder: 0, isSoldOut: false,
    });
    const m = buildMenuManifest([item(1, "음료"), item(2, "디저트"), item(3, "음료")]);
    expect(m.map((r) => r.tab)).toEqual(["목차", "음료", "디저트"]);
    expect(m[1].href).toBe(`/menu?c=${encodeURIComponent("음료")}`);
  });
  it("요괴 명단 → 요괴마다 이력서", () => {
    const s: HomeStaff = { id: 3, name: "미호", role: "", photoUrl: null, intro: "", sortOrder: 0, isActive: true };
    expect(buildStaffManifest([s]).map((r) => r.key)).toEqual(["/staff", "/staff/3"]);
  });
  it("게임 목차가 첫 쪽", () => {
    expect(buildGamesManifest()[0]).toMatchObject({ key: "/games", kind: "toc" });
  });
});

describe("쪽 번호", () => {
  it("clampPage — 숫자가 아니거나 범위 밖이면 1~끝으로", () => {
    expect(clampPage(undefined, 3)).toBe(1);
    expect(clampPage("2", 3)).toBe(2);
    expect(clampPage("9", 3)).toBe(3);
    expect(clampPage("abc", 3)).toBe(1);
    expect(clampPage("0", 3)).toBe(1);
  });
  it("listPageOf — n번째 글이 몇 번째 목록 쪽에 있나", () => {
    expect(listPageOf(0)).toBe(1);
    expect(listPageOf(7)).toBe(1);
    expect(listPageOf(8)).toBe(2);
  });
});

describe("buildErrorPage", () => {
  it("책 첫 쪽 오류는 한 쪽짜리 순서표", () => {
    expect(buildErrorPage("/staff", "")).toEqual({
      book: "staff",
      key: "/staff",
      manifest: [{ key: "/staff", href: "/staff", tab: "이 쪽", kind: "content" }],
    });
  });
  it("안쪽 쪽 오류는 그 책 첫 쪽 + 이 쪽 — 다른 책으로 넘기지 않는다", () => {
    const page = buildErrorPage("/notice/7", "");
    expect(page?.book).toBe("notice");
    expect(page?.key).toBe("/notice/7");
    expect(page?.manifest.map((r) => r.key)).toEqual(["/notice", "/notice/7"]);
  });
  it("쪽을 가르는 쿼리는 키에 남기고 쪽 안 상태 쿼리는 버린다", () => {
    const page = buildErrorPage("/", "p=calendar&month=2026-09");
    expect(page?.book).toBe("home");
    expect(page?.key).toBe("/?p=calendar");
    expect(page?.manifest[0].key).toBe("/");
    expect(page?.manifest[1].href).toBe("/?p=calendar&month=2026-09");
  });
  it("책 밖 경로는 null", () => {
    expect(buildErrorPage("/event/stocks", "")).toBeNull();
  });
});
