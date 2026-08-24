import ReactMarkdown from "react-markdown";

// 어드민 작성 마크다운 본문 렌더 (플러그인 없음 — 기본 문법만)
export function PostBody({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-sm mt-4 max-w-none prose-headings:text-[var(--home-ink)] prose-p:text-[var(--home-ink)]">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
