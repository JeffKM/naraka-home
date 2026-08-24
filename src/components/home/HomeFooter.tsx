import { HOME_INFO } from "@/lib/homeConfig";

export function HomeFooter() {
  return (
    <footer className="mt-12 border-t border-[var(--home-line)] bg-[var(--home-surface)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-1 px-4 py-8 text-sm text-[var(--home-muted)]">
        <p className="font-semibold text-[var(--home-ink)]">{HOME_INFO.name}</p>
        <p>{HOME_INFO.addressLine}</p>
        <p>{HOME_INFO.hoursNote}</p>
        <a
          href={HOME_INFO.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          instagram @{HOME_INFO.instagramHandle}
        </a>
      </div>
    </footer>
  );
}
