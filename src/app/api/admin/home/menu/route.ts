import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { createMenuItem, listMenu } from "@/services/homeContentService";

export async function GET() {
  try {
    await requireAdmin();
    return apiOk({ items: await listMenu() });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  category: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(60),
  price: z.number().int().min(0),
  description: z.string().max(300).optional(),
  imageUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION", parsed.error.issues[0].message);
    }
    const id = await createMenuItem(parsed.data);
    return apiOk({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
