"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { BOOKS, getBook, type BookId } from "@/lib/book/books";
import { useBookStore } from "@/lib/book/bookStore";
import { ArtPlate } from "./ArtPlate";

// 책등 8개 서랍 — 대화상자. Tab은 서랍 안에서만 돌고, Esc로 닫히며, 닫히면 토글로 포커스 복귀
export function ShelfDrawer() {
  const open = useBookStore((s) => s.drawerOpen);
  const setOpen = useBookStore((s) => s.setDrawerOpen);
  const current = useBookStore((s) => s.current);
  const requestSwap = useBookStore((s) => s.requestSwap);
  // 인트로 재생 중엔 닫혀 있든 열려 있든 서랍도 inert — 뒤 요소로 취급
  const introActive = useBookStore((s) => s.introActive);
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const search = useSearchParams().toString();

  // 뒤로·앞으로 가기 등 서랍 밖에서 쪽이 바뀌면 닫는다 (스토어 갱신은 렌더·이펙트 본문 밖 타이머에서)
  const routeKey = `${pathname}?${search}`;
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (useBookStore.getState().drawerOpen) setOpen(false);
    }, 0);
    return () => window.clearTimeout(t);
  }, [routeKey, setOpen]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const toggle = document.querySelector<HTMLElement>('[aria-controls="book-shelf-drawer"]');
    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>("button"));
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      toggle?.focus();
    };
  }, [open, setOpen]);

  const choose = (to: BookId) => {
    setOpen(false);
    const root = getBook(to).root;
    const from = current?.book;
    // 같은 책이면 첫 쪽으로 넘기기만, 다른 책이면 교체 연출을 먼저 요청하고 이동.
    // 교체 연출 도중이면 지금 펼친 책을 다시 골라도 요청을 바꾼다 — 안 바꾸면 이전 목적지를 영영 기다린다
    const pending = useBookStore.getState().swapRequest;
    if (from && (from !== to || pending)) requestSwap(from, to);
    router.push(root, { scroll: false });
  };

  return (
    <>
      <div className={`book-drawer-scrim ${open ? "is-open" : ""}`} aria-hidden onClick={() => setOpen(false)} />
      <div
        id="book-shelf-drawer"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="책장"
        className={`book-drawer ${open ? "is-open" : ""}`}
        inert={!open || introActive}
      >
        <p className="book-drawer-title home-serif">책장</p>
        <ul className="book-drawer-list">
          {BOOKS.map((b) => {
            const isCurrent = current?.book === b.id;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  className="book-drawer-item"
                  aria-current={isCurrent ? "page" : undefined}
                  onClick={() => choose(b.id)}
                >
                  <span className={`book-spine ${isCurrent ? "is-out" : ""}`} aria-hidden>
                    <ArtPlate art={`spine-${b.id}`} className="size-full object-cover" />
                  </span>
                  <span className="book-drawer-name">{b.title}</span>
                  {isCurrent && <span className="book-drawer-note">펼쳐 둔 책</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
