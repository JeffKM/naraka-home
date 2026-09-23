import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { deleteMenuItem, updateMenuItem } from "@/services/homeContentService";
import { parseId } from "../../parseId";

const patchSchema = z.object({
  category: z.string().trim().min(1).max(30).optional(),
  name: z.string().trim().min(1).max(60).optional(),
  price: z.number().int().min(0).optional(),
  description: z.string().max(300).optional(),
  imageUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isSoldOut: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const menuId = parseId(id);
    if (menuId === null) {
      return apiError("VALIDATION", "잘못된 id입니다.");
    }
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION", parsed.error.issues[0].message);
    }
    await updateMenuItem(menuId, parsed.data);
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const menuId = parseId(id);
    if (menuId === null) {
      return apiError("VALIDATION", "잘못된 id입니다.");
    }
    await deleteMenuItem(menuId);
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
