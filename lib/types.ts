export type SchoolStatus = "active" | "inactive" | "archived";
export type ActivityType = "school" | "community";
// 활동 성격 구분: 마을학교 활동 / 아이들과 함께하는 공동활동 / 대표자·관계자 네트워크 활동
export type ActivityCategory = "school" | "joint_program" | "network";
export type ActivityStatus = "draft" | "published" | "archived";
export type MediaType = "image" | "video" | "document" | "external_video" | "external_link";
export type MediaVisibility = "public" | "admin_only";
export type MediaCategory =
  | "education"
  | "business"
  | "promotion"
  | "result"
  | "operation"
  | "other";

export interface School {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  area: string | null;
  location_name: string | null;
  address: string | null;
  representative_name: string | null;
  representative_photo: string | null;
  representative_bio: string | null;
  phone: string | null;
  email: string | null;
  has_activists: boolean;
  activist_photo: string | null;
  contact_image: string | null;
  program_name: string | null;
  program_description: string | null;
  program_schedule: string | null;
  target_group: string | null;
  hero_image: string | null;
  status: SchoolStatus;
  is_visible: boolean;
  display_order: number;
  show_representative_name: boolean;
  show_phone: boolean;
  show_email: boolean;
  address_visibility: "full" | "area_only" | "hidden";
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
  // 예전 구조 (더 이상 화면에서 사용하지 않지만, 데이터 보존을 위해 남겨둡니다)
  team_intro?: string | null;
  specialties?: string | null;
  main_activities?: string | null;
  programs?: string | null;
  external_link?: string | null;
}

export type SchoolContactLinkType =
  | "instagram"
  | "naver_blog"
  | "kakao_channel"
  | "youtube"
  | "facebook"
  | "website"
  | "other";

export interface SchoolContactLink {
  id: string;
  school_id: string;
  link_type: SchoolContactLinkType;
  label: string | null;
  url: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export const SCHOOL_CONTACT_LINK_LABEL: Record<SchoolContactLinkType, string> = {
  instagram: "Instagram",
  naver_blog: "네이버 블로그",
  kakao_channel: "카카오 채널",
  youtube: "YouTube",
  facebook: "Facebook",
  website: "홈페이지",
  other: "기타",
};

export interface Activity {
  id: string;
  activity_type: ActivityType;
  activity_category: ActivityCategory;
  school_id: string | null;
  title: string;
  activity_date: string | null;
  description: string | null;
  cover_image: string | null;
  status: ActivityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MediaAsset {
  id: string;
  activity_id: string | null;
  school_id: string | null;
  media_type: MediaType;
  category: MediaCategory | null;
  title: string | null;
  description: string | null;
  file_url: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  original_file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  display_order: number;
  visibility: MediaVisibility;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AdminLog {
  id: string;
  occurred_at: string;
  editor_name: string | null;
  editor_org: string | null;
  target_type: string;
  target_id: string | null;
  target_label: string | null;
  action: string;
  detail: string | null;
}

export const FILE_SIZE_LIMITS = {
  image: 15 * 1024 * 1024,
  document: 30 * 1024 * 1024,
  presentation: 50 * 1024 * 1024,
  video: 200 * 1024 * 1024,
};

// 한 번에 선택할 수 있는 사진 개수 (여러 장 업로드 화면 공통 설정)
export const MAX_GALLERY_UPLOAD_BATCH = 20;

export const DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx", "hwp", "xls", "xlsx"];
export const PRESENTATION_EXTENSIONS = ["ppt", "pptx"];
export const ALL_DOCUMENT_EXTENSIONS = [...DOCUMENT_EXTENSIONS, ...PRESENTATION_EXTENSIONS];

export const MEDIA_CATEGORY_LABEL: Record<MediaCategory, string> = {
  education: "교육자료",
  business: "사업자료",
  promotion: "홍보자료",
  result: "결과자료",
  operation: "운영자료",
  other: "기타",
};

// 전체활동 필터/카드 라벨에 쓰는 활동 성격 구분 표시명
export const ACTIVITY_CATEGORY_LABEL: Record<ActivityCategory, string> = {
  school: "마을학교 활동",
  joint_program: "함께하는 공동활동",
  network: "역량강화네트워크",
};
