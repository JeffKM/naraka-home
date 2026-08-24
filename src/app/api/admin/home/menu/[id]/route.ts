import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { deleteMenuItem, updateMenuItem } from "@/services/homeContentService";

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
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION", parsed.error.issues[0].message);
    }
    await updateMenuItem(Number(id), parsed.data);
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    await deleteMenuItem(Number(id));
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
