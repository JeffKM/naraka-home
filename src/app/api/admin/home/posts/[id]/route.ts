import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { deletePost, updatePost } from "@/services/homeContentService";
import { parseId } from "../../parseId";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const patchSchema = z.object({
  type: z.enum(["notice", "event"]).optional(),
  title: z.string().trim().min(1).max(120).optional(),
  bodyMd: z.string().max(20000).optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  pinned: z.boolean().optional(),
  published: z.boolean().optional(),
  eventStartDate: dateStr.nullable().optional(),
  eventEndDate: dateStr.nullable().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const postId = parseId(id);
    if (postId === null) {
      return apiError("VALIDATION", "잘못된 id입니다.");
    }
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION", parsed.error.issues[0].message);
    }
    await updatePost(postId, parsed.data);
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const postId = parseId(id);
    if (postId === null) {
      return apiError("VALIDATION", "잘못된 id입니다.");
    }
    await deletePost(postId);
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
