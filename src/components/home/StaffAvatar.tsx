import type { HomeStaff } from "@/types/home";

// 출근표용 소형 아바타 — 사진 없으면 이름 첫 글자
export function StaffAvatar({ staff, size = 24 }: { staff: HomeStaff; size?: number }) {
  if (staff.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 소형 아바타, 원격 최적화 불필요
      <img
        src={staff.photoUrl}
        alt={staff.name}
        width={size}
        height={size}
        className="shrink-0 rounded-full border border-[var(--home-line)] object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-[var(--home-red)] text-[11px] font-bold text-[var(--home-on-red)]"
      style={{ width: size, height: size }}
    >
      {staff.name.slice(0, 1)}
    </span>
  );
}
