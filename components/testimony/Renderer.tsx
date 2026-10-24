import type { ContentNode, TestimonyContent, TextNode } from "@/lib/types";

/** Single renderer for TestimonyContent, used by /preview and /u/[handle] (US-08).
 *  `mediaUrls` maps mediaId -> URL (signed while draft, public once published). */
export function TestimonyRenderer({
  content,
  mediaUrls,
}: {
  content: TestimonyContent | null | undefined;
  mediaUrls: Record<string, string>;
}) {
  const nodes = content?.content ?? [];
  return (
    <div className="space-y-4 text-base leading-relaxed text-gray-900">
      {nodes.map((node, i) => (
        <Block key={i} node={node} mediaUrls={mediaUrls} />
      ))}
    </div>
  );
}

function Inline({ nodes }: { nodes?: TextNode[] }) {
  return (
    <>
      {(nodes ?? []).map((n, i) => {
        let el: React.ReactNode = n.text;
        for (const m of n.marks ?? []) {
          if (m.type === "bold") el = <strong>{el}</strong>;
          else if (m.type === "italic") el = <em>{el}</em>;
          else if (m.type === "link") {
            const href = String(m.attrs?.href ?? "");
            if (/^https?:\/\//i.test(href))
              el = (
                <a href={href} rel="noopener noreferrer nofollow" className="text-blue-800 underline">
                  {el}
                </a>
              );
          }
        }
        return <span key={i}>{el}</span>;
      })}
    </>
  );
}

function Block({ node, mediaUrls }: { node: ContentNode; mediaUrls: Record<string, string> }) {
  switch (node.type) {
    case "heading":
      return node.attrs?.level === 3 ? (
        <h3 className="pt-2 text-xl font-semibold">
          <Inline nodes={node.content} />
        </h3>
      ) : (
        <h2 className="pt-2 text-2xl font-semibold">
          <Inline nodes={node.content} />
        </h2>
      );
    case "paragraph":
      return (
        <p>
          <Inline nodes={node.content} />
        </p>
      );
    case "image":
    case "video": {
      const src = mediaUrls[node.attrs.mediaId];
      if (!src) return null;
      const { alt, caption } = node.attrs;
      return (
        <figure className="space-y-2">
          {node.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt ?? ""} loading="lazy" className="w-full rounded-lg" />
          ) : (
            <video
              src={src}
              controls
              preload="none"
              playsInline
              aria-label={alt || "Video"}
              className="w-full rounded-lg bg-black"
            />
          )}
          {caption && <figcaption className="text-sm text-gray-700">{caption}</figcaption>}
        </figure>
      );
    }
    default:
      return null;
  }
}

export function collectMediaIds(content: TestimonyContent | null | undefined): string[] {
  const ids = new Set<string>();
  for (const n of content?.content ?? []) {
    if ((n.type === "image" || n.type === "video") && n.attrs?.mediaId) ids.add(n.attrs.mediaId);
  }
  return [...ids];
}
