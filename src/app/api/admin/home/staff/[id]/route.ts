import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { deleteStaff, updateStaff } from "@/services/homeContentService";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  role: z.string().trim().max(40).optional(),
  photoUrl: z.string().url().nullable().optional(),
  intro: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
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
    await updateStaff(Number(id), parsed.data);
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    await deleteStaff(Number(id));
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
