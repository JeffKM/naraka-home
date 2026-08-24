import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const MAX_BYTES = 5 * 1024 * 1024;

// 홈 콘텐츠 이미지 업로드 → home-assets 공개 버킷, 공개 URL 반환
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return apiError("VALIDATION", "file 필드가 필요합니다.");
    }
    const ext = ALLOWED.get(file.type);
    if (!ext) {
      return apiError("VALIDATION", "jpeg·png·webp만 업로드할 수 있습니다.");
    }
    if (file.size > MAX_BYTES) {
      return apiError("VALIDATION", "이미지는 5MB 이하여야 합니다.");
    }
    const supabase = getSupabaseAdmin();
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("home-assets")
      .upload(path, file, { contentType: file.type });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("home-assets").getPublicUrl(path);
    return apiOk({ url: data.publicUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
