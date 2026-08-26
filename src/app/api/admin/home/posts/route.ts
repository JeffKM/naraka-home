import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { createPost, listPosts } from "@/services/homeContentService";

// 어드민 홈 글(공지·이벤트) 관리
export async function GET() {
  try {
    await requireAdmin();
    return apiOk({ posts: await listPosts({ includeUnpublished: true }) });
  } catch (error) {
    return handleApiError(error);
  }
}

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const createSchema = z.object({
  type: z.enum(["notice", "event"]),
  title: z.string().trim().min(1).max(120),
  bodyMd: z.string().max(20000),
  coverImageUrl: z.string().url().nullable().optional(),
  pinned: z.boolean().optional(),
  published: z.boolean().optional(),
  eventStartDate: dateStr.nullable().optional(),
  eventEndDate: dateStr.nullable().optional(),
}).refine((v) => v.type === "notice" || !!v.eventStartDate, {
  message: "이벤트 글은 시작일이 필요합니다.",
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION", parsed.error.issues[0].message);
    }
    const id = await createPost(parsed.data);
    return apiOk({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
