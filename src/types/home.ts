export type HomePostType = "notice" | "event";
export interface HomePost {
  id: number; type: HomePostType; title: string; bodyMd: string;
  coverImageUrl: string | null; pinned: boolean; published: boolean;
  publishedAt: string; eventStartDate: string | null; eventEndDate: string | null;
}
export interface HomeStaff {
  id: number; name: string; role: string; photoUrl: string | null;
  intro: string; sortOrder: number; isActive: boolean;
}
export interface HomeScheduleEntry {
  id: number; workDate: string; staffId: number; startMin: number; endMin: number;
}
export interface HomeMenuItem {
  id: number; category: string; name: string; price: number;
  description: string; imageUrl: string | null; sortOrder: number; isSoldOut: boolean;
}
