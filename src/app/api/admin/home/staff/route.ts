import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { createStaff, listStaff } from "@/services/homeContentService";

export async function GET() {
  try {
    await requireAdmin();
    return apiOk({ staff: await listStaff(false) });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(40),
  role: z.string().trim().max(40).optional(),
  photoUrl: z.string().url().nullable().optional(),
  intro: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION", parsed.error.issues[0].message);
    }
    const id = await createStaff(parsed.data);
    return apiOk({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
