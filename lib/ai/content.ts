import { z } from "zod";
import type { TestimonyContent } from "@/lib/types";

/** Flat block schema the model fills in (simple for structured outputs). */
export const DraftOutputSchema = z.object({
  title: z.string(),
  blocks: z.array(z.object({ kind: z.enum(["h2", "h3", "p"]), text: z.string() })),
});

const TextNodeSchema = z.object({ type: z.literal("text"), text: z.string().min(1) });
const ContentSchema = z.object({
  type: z.literal("doc"),
  content: z
    .array(
      z.union([
        z.object({ type: z.literal("paragraph"), content: z.array(TextNodeSchema).optional() }),
        z.object({
          type: z.literal("heading"),
          attrs: z.object({ level: z.union([z.literal(2), z.literal(3)]) }),
          content: z.array(TextNodeSchema).optional(),
        }),
      ]),
    )
    .min(1),
});

/** Converts model output to TestimonyContent and validates it against the shared shape. */
export function toTestimonyContent(
  blocks: z.infer<typeof DraftOutputSchema>["blocks"],
): TestimonyContent {
  const content = blocks
    .map((b) => ({ ...b, text: b.text.trim() }))
    .filter((b) => b.text.length > 0)
    .map((b) =>
      b.kind === "p"
        ? { type: "paragraph" as const, content: [{ type: "text" as const, text: b.text }] }
        : {
            type: "heading" as const,
            attrs: { level: (b.kind === "h2" ? 2 : 3) as 2 | 3 },
            content: [{ type: "text" as const, text: b.text }],
          },
    );
  return ContentSchema.parse({ type: "doc", content }) as TestimonyContent;
}
