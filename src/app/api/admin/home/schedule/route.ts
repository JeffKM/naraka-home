import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { listScheduleRange, replaceDaySchedule } from "@/services/homeContentService";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const parsed = z.object({ start: dateStr, end: dateStr }).safeParse({
      start: url.searchParams.get("start"),
      end: url.searchParams.get("end"),
    });
    if (!parsed.success) {
      return apiError("VALIDATION", "start·end 날짜(YYYY-MM-DD)가 필요합니다.");
    }
    return apiOk({
      entries: await listScheduleRange(parsed.data.start, parsed.data.end),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const putSchema = z.object({
  workDate: dateStr,
  entries: z.array(z.object({
    staffId: z.number().int().positive(),
    startMin: z.number().int().min(0).max(1439),
    endMin: z.number().int().min(1).max(1440),
  }).refine((e) => e.endMin > e.startMin, { message: "종료가 시작보다 빨라요." })).max(50),
});

// 하루 단위 전체 교체 저장
export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const parsed = putSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION", parsed.error.issues[0].message);
    }
    await replaceDaySchedule(parsed.data.workDate, parsed.data.entries);
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
