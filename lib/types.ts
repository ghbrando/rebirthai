// Shared contract for all feature areas (SDD §5.3). Changes go through the lead.

export type Visibility = "public" | "unlisted";
export type TestimonyStatus = "draft" | "published" | "unpublished";
export type CoachSection = "before" | "turning_point" | "after" | "other";

export interface Profile {
  id: string;
  user_id: string;
  handle: string; // 3-30 [a-z0-9_]
  display_name: string;
  bio: string | null;
  photo_path: string | null; // path in media-public bucket
  church: string | null;
  contact_phone: string | null; // opt-in (RC-12)
  contact_email: string | null; // opt-in (RC-12)
  share_contact: boolean;
  created_at: string;
}

// ---- Testimony content: TipTap/ProseMirror JSON with custom media nodes ----

export interface TextMark {
  type: "bold" | "italic" | "link";
  attrs?: Record<string, unknown>;
}

export interface TextNode {
  type: "text";
  text: string;
  marks?: TextMark[];
}

export interface ParagraphNode {
  type: "paragraph";
  content?: TextNode[];
}

export interface HeadingNode {
  type: "heading";
  attrs: { level: 2 | 3 };
  content?: TextNode[];
}

/** Image/video block. `mediaId` refers to media.id; renderers resolve the URL
 *  (signed URL while draft, public URL once published). `alt` is required (RC-11). */
export interface MediaNode {
  type: "image" | "video";
  attrs: { mediaId: string; alt: string; caption: string | null };
}

export type ContentNode = ParagraphNode | HeadingNode | MediaNode;

export interface TestimonyContent {
  type: "doc";
  content: ContentNode[];
}

export const EMPTY_CONTENT: TestimonyContent = { type: "doc", content: [] };

export interface Testimony {
  id: string;
  profile_id: string;
  title: string;
  draft_content: TestimonyContent;
  published_content: TestimonyContent | null;
  published_title: string | null;
  status: TestimonyStatus;
  visibility: Visibility;
  published_at: string | null;
  updated_at: string;
}

export interface CoachMessage {
  id: string;
  testimony_id: string;
  role: "user" | "assistant";
  content: string;
  section: CoachSection | null;
  created_at: string;
}

export interface Media {
  id: string;
  testimony_id: string;
  kind: "image" | "video";
  storage_path: string; // media-private path while draft
  public_path: string | null; // media-public path once published
  mime: string;
  bytes: number;
  alt_text: string | null;
  caption: string | null;
}

export interface HandleRedirect {
  old_handle: string;
  profile_id: string;
}

export interface Report {
  id: string;
  testimony_id: string;
  reason: string;
  created_at: string;
  status: "open" | "reviewed" | "dismissed";
}

// ---- API contracts (agents B <-> C) ----

/** One proposed AI edit. Never applied automatically (RC-04, US-06).
 *  `original` is an exact text excerpt from the draft ("" = pure insertion
 *  after the block at `blockIndex`); `proposed` replaces it if accepted. */
export interface CoachSuggestion {
  id: string;
  blockIndex: number; // index into TestimonyContent.content
  original: string;
  proposed: string;
  reason: string;
}

/** POST /api/coach/suggest */
export interface SuggestRequest {
  testimonyId: string;
  instruction: string; // e.g. "make this shorter", "what's missing?"
}
export interface SuggestResponse {
  suggestions: CoachSuggestion[];
  note?: string; // free-text answer for questions like "what's missing?"
}

/** POST /api/coach/draft -> writes testimonies.draft_content */
export interface DraftRequest {
  testimonyId: string;
}
export interface DraftResponse {
  title: string;
  content: TestimonyContent;
}

/** POST /api/upload-url */
export interface UploadUrlRequest {
  testimonyId: string;
  kind: "image" | "video";
  mime: string;
  bytes: number;
}
export interface UploadUrlResponse {
  mediaId: string;
  bucket: "media-private";
  path: string;
  token: string; // Supabase signed upload token
}

export const MEDIA_LIMITS = {
  image: {
    maxBytes: 10 * 1024 * 1024,
    mimes: ["image/jpeg", "image/png", "image/webp"],
  },
  video: {
    maxBytes: 100 * 1024 * 1024,
    mimes: ["video/mp4", "video/quicktime"],
  },
} as const;

export const HANDLE_REGEX = /^[a-z0-9_]{3,30}$/;
