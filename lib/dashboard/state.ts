import type { TestimonyContent, TestimonyStatus, Visibility } from "@/lib/types";

export type DashboardState =
  | "not_started"
  | "draft_in_progress"
  | "published_public"
  | "published_unlisted"
  | "unpublished";

export interface DashboardInput {
  /** Null when the author has no testimony row yet. */
  testimony: {
    status: TestimonyStatus;
    visibility: Visibility;
    title: string;
    draft_content: TestimonyContent | null;
    published_at: string | null;
  } | null;
  coachMessageCount: number;
}

/** Pure: where the author's testimony stands. */
export function deriveDashboardState({ testimony: t, coachMessageCount }: DashboardInput): DashboardState {
  if (t?.status === "published") return t.visibility === "unlisted" ? "published_unlisted" : "published_public";
  if (t?.status === "unpublished") return "unpublished";
  const hasContent = (t?.draft_content?.content?.length ?? 0) > 0 || !!t?.title?.trim();
  return coachMessageCount > 0 || hasContent ? "draft_in_progress" : "not_started";
}

export interface DashboardCopy {
  heading: string;
  body: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string }[];
}

/** Plain-words copy and actions per state. `handle` builds the page link. */
export function dashboardCopy(state: DashboardState, handle: string, hasDraftContent = false): DashboardCopy {
  switch (state) {
    case "not_started":
      return {
        heading: "You haven't started your testimony yet",
        body: "The coach will ask a few gentle questions and help you tell your story in your own words.",
        primary: { label: "Start with the coach", href: "/coach" },
        secondary: [],
      };
    case "draft_in_progress":
      return {
        heading: "Your testimony is in progress",
        body: "It's saved and only you can see it. Pick up where you left off.",
        primary: hasDraftContent
          ? { label: "Keep editing", href: "/editor" }
          : { label: "Continue with the coach", href: "/coach" },
        secondary: hasDraftContent
          ? [
              { label: "Continue with the coach", href: "/coach" },
              { label: "Publish", href: "/publish" },
            ]
          : [],
      };
    case "published_public":
      return {
        heading: "Your testimony is published",
        body: "Anyone can find it, and anyone with the link can read it.",
        primary: { label: "View my page", href: `/@${handle}` },
        secondary: [
          { label: "Share", href: "/share" },
          { label: "Keep editing", href: "/editor" },
        ],
      };
    case "published_unlisted":
      return {
        heading: "Your testimony is published",
        body: "Only people who have your link can read it. It won't show up for anyone else.",
        primary: { label: "View my page", href: `/@${handle}` },
        secondary: [
          { label: "Share", href: "/share" },
          { label: "Keep editing", href: "/editor" },
        ],
      };
    case "unpublished":
      return {
        heading: "Your testimony is not public right now",
        body: "Your page is hidden and your words are saved. You can edit and publish again whenever you're ready.",
        primary: { label: "Keep editing", href: "/editor" },
        secondary: [{ label: "Publish again", href: "/publish" }],
      };
  }
}
