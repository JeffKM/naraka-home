import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  HomeMenuItem,
  HomePost,
  HomePostType,
  HomeScheduleEntry,
  HomeStaff,
} from "@/types/home";

// ── row → DTO 매핑 ──────────────────────────────────────────
interface PostRow {
  id: number; type: HomePostType; title: string; body_md: string;
  cover_image_url: string | null; pinned: boolean; published: boolean;
  published_at: string; event_start_date: string | null; event_end_date: string | null;
}
const POST_COLS =
  "id, type, title, body_md, cover_image_url, pinned, published, published_at, event_start_date, event_end_date";

function mapPost(r: PostRow): HomePost {
  return {
    id: r.id, type: r.type, title: r.title, bodyMd: r.body_md,
    coverImageUrl: r.cover_image_url, pinned: r.pinned, published: r.published,
    publishedAt: r.published_at, eventStartDate: r.event_start_date,
    eventEndDate: r.event_end_date,
  };
}

export async function listPosts(opts?: {
  type?: HomePostType; includeUnpublished?: boolean; limit?: number;
}): Promise<HomePost[]> {
  const supabase = getSupabaseAdmin();
  let q = supabase.from("home_posts").select(POST_COLS)
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });
  if (opts?.type) q = q.eq("type", opts.type);
  if (!opts?.includeUnpublished) q = q.eq("published", true);
  if (opts?.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data as PostRow[]).map(mapPost);
}

export async function getPost(
  id: number, includeUnpublished = false
): Promise<HomePost | null> {
  const supabase = getSupabaseAdmin();
  let q = supabase.from("home_posts").select(POST_COLS).eq("id", id);
  if (!includeUnpublished) q = q.eq("published", true);
  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPost(data as PostRow) : null;
}

export async function createPost(input: {
  type: HomePostType; title: string; bodyMd: string;
  coverImageUrl?: string | null; pinned?: boolean; published?: boolean;
  eventStartDate?: string | null; eventEndDate?: string | null;
}): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("home_posts").insert({
    type: input.type, title: input.title, body_md: input.bodyMd,
    cover_image_url: input.coverImageUrl ?? null,
    pinned: input.pinned ?? false, published: input.published ?? true,
    event_start_date: input.eventStartDate ?? null,
    event_end_date: input.eventEndDate ?? null,
  }).select("id").single();
  if (error) throw new Error(error.message);
  return (data as { id: number }).id;
}

export async function updatePost(
  id: number,
  patch: Partial<Omit<HomePost, "id" | "publishedAt">>
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.bodyMd !== undefined) row.body_md = patch.bodyMd;
  if (patch.coverImageUrl !== undefined) row.cover_image_url = patch.coverImageUrl;
  if (patch.pinned !== undefined) row.pinned = patch.pinned;
  if (patch.published !== undefined) row.published = patch.published;
  if (patch.eventStartDate !== undefined) row.event_start_date = patch.eventStartDate;
  if (patch.eventEndDate !== undefined) row.event_end_date = patch.eventEndDate;
  const { error } = await supabase.from("home_posts").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePost(id: number): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("home_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// 해당 월(YYYY-MM)과 기간이 겹치는 공개 이벤트 — 달력용
export async function getMonthEvents(month: string): Promise<HomePost[]> {
  const supabase = getSupabaseAdmin();
  const [y, m] = month.split("-").map(Number);
  const monthStart = `${month}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const monthEnd = `${month}-${String(lastDay).padStart(2, "0")}`;
  // 겹침 조건: start <= 월말 AND coalesce(end, start) >= 월초
  const { data, error } = await supabase.from("home_posts").select(POST_COLS)
    .eq("type", "event").eq("published", true)
    .lte("event_start_date", monthEnd)
    .or(`event_end_date.gte.${monthStart},and(event_end_date.is.null,event_start_date.gte.${monthStart})`);
  if (error) throw new Error(error.message);
  return (data as PostRow[]).map(mapPost);
}

interface StaffRow {
  id: number; name: string; role: string; photo_url: string | null;
  intro: string; sort_order: number; is_active: boolean;
}
const STAFF_COLS = "id, name, role, photo_url, intro, sort_order, is_active";
function mapStaff(r: StaffRow): HomeStaff {
  return {
    id: r.id, name: r.name, role: r.role, photoUrl: r.photo_url,
    intro: r.intro, sortOrder: r.sort_order, isActive: r.is_active,
  };
}

export async function listStaff(activeOnly: boolean): Promise<HomeStaff[]> {
  const supabase = getSupabaseAdmin();
  let q = supabase.from("home_staff").select(STAFF_COLS)
    .order("sort_order").order("id");
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data as StaffRow[]).map(mapStaff);
}

export async function createStaff(input: {
  name: string; role?: string; photoUrl?: string | null;
  intro?: string; sortOrder?: number;
}): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("home_staff").insert({
    name: input.name, role: input.role ?? "", photo_url: input.photoUrl ?? null,
    intro: input.intro ?? "", sort_order: input.sortOrder ?? 0,
  }).select("id").single();
  if (error) throw new Error(error.message);
  return (data as { id: number }).id;
}

export async function updateStaff(
  id: number, patch: Partial<Omit<HomeStaff, "id">>
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.photoUrl !== undefined) row.photo_url = patch.photoUrl;
  if (patch.intro !== undefined) row.intro = patch.intro;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.isActive !== undefined) row.is_active = patch.isActive;
  const { error } = await supabase.from("home_staff").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteStaff(id: number): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("home_staff").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

interface ScheduleRow {
  id: number; work_date: string; staff_id: number; start_min: number; end_min: number;
}

export async function listScheduleRange(
  startDate: string, endDate: string
): Promise<HomeScheduleEntry[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("home_schedule")
    .select("id, work_date, staff_id, start_min, end_min")
    .gte("work_date", startDate).lte("work_date", endDate)
    .order("work_date").order("start_min");
  if (error) throw new Error(error.message);
  return (data as ScheduleRow[]).map((r) => ({
    id: r.id, workDate: r.work_date, staffId: r.staff_id,
    startMin: r.start_min, endMin: r.end_min,
  }));
}

// 그날 출근표 전체 교체 — 어드민 저장 UX가 "하루 단위 저장"이므로 삭제 후 삽입
export async function replaceDaySchedule(
  workDate: string,
  entries: { staffId: number; startMin: number; endMin: number }[]
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const del = await supabase.from("home_schedule").delete().eq("work_date", workDate);
  if (del.error) throw new Error(del.error.message);
  if (entries.length === 0) return;
  const { error } = await supabase.from("home_schedule").insert(
    entries.map((e) => ({
      work_date: workDate, staff_id: e.staffId,
      start_min: e.startMin, end_min: e.endMin,
    }))
  );
  if (error) throw new Error(error.message);
}

interface MenuRow {
  id: number; category: string; name: string; price: number;
  description: string; image_url: string | null; sort_order: number; is_sold_out: boolean;
}

export async function listMenu(): Promise<HomeMenuItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("home_menu_items")
    .select("id, category, name, price, description, image_url, sort_order, is_sold_out")
    .order("category").order("sort_order").order("id");
  if (error) throw new Error(error.message);
  return (data as MenuRow[]).map((r) => ({
    id: r.id, category: r.category, name: r.name, price: r.price,
    description: r.description, imageUrl: r.image_url,
    sortOrder: r.sort_order, isSoldOut: r.is_sold_out,
  }));
}

export async function createMenuItem(input: {
  category: string; name: string; price: number;
  description?: string; imageUrl?: string | null; sortOrder?: number;
}): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("home_menu_items").insert({
    category: input.category, name: input.name, price: input.price,
    description: input.description ?? "", image_url: input.imageUrl ?? null,
    sort_order: input.sortOrder ?? 0,
  }).select("id").single();
  if (error) throw new Error(error.message);
  return (data as { id: number }).id;
}

export async function updateMenuItem(
  id: number, patch: Partial<Omit<HomeMenuItem, "id">>
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const row: Record<string, unknown> = {};
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.isSoldOut !== undefined) row.is_sold_out = patch.isSoldOut;
  const { error } = await supabase.from("home_menu_items").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMenuItem(id: number): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("home_menu_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
