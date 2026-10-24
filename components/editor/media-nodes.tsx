"use client";

import { useEffect, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { getSignedUrl, saveMediaMeta } from "@/lib/media/client";

function MediaView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const kind = node.type.name as "image" | "video";
  const { mediaId, alt, caption } = node.attrs as { mediaId: string; alt: string; caption: string | null };
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    getSignedUrl(mediaId).then((u) => {
      if (!live) return;
      if (u) setUrl(u);
      else setFailed(true);
    });
    return () => {
      live = false;
    };
  }, [mediaId]);

  const persist = (nextAlt: string, nextCaption: string | null) => {
    if (nextAlt.trim()) saveMediaMeta(mediaId, nextAlt.trim(), nextCaption).catch(() => {});
  };

  return (
    <NodeViewWrapper className="my-4 rounded border p-2" data-drag-handle>
      {url ? (
        kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={alt} className="mx-auto max-h-96" />
        ) : (
          // controls visible; never autoplay (RC-11)
          <video src={url} controls preload="metadata" className="mx-auto max-h-96" aria-label={alt} />
        )
      ) : (
        <div className="flex h-24 items-center justify-center text-sm text-gray-500">
          {failed ? "Could not load media" : "Loading..."}
        </div>
      )}
      <label className="mt-2 block text-xs font-medium">
        {kind === "image" ? "Alt text (required)" : "Description (required)"}
        <input
          className={`mt-1 w-full rounded border px-2 py-1 text-sm ${alt.trim() ? "" : "border-red-500"}`}
          value={alt}
          placeholder={kind === "image" ? "Describe the image for people who can't see it" : "Describe the video"}
          onChange={(e) => updateAttributes({ alt: e.target.value })}
          onBlur={() => persist(alt, caption)}
        />
      </label>
      {!alt.trim() && <p className="text-xs text-red-600">Required. This block will not be saved until it is filled in.</p>}
      <label className="mt-2 block text-xs font-medium">
        Caption (optional)
        <input
          className="mt-1 w-full rounded border px-2 py-1 text-sm"
          value={caption ?? ""}
          onChange={(e) => updateAttributes({ caption: e.target.value || null })}
          onBlur={() => persist(alt, caption)}
        />
      </label>
      <button type="button" className="mt-2 text-xs text-red-700 underline" onClick={() => deleteNode()}>
        Remove
      </button>
    </NodeViewWrapper>
  );
}

function makeMediaNode(name: "image" | "video") {
  return Node.create({
    name,
    group: "block",
    atom: true,
    draggable: true,
    addAttributes() {
      return {
        mediaId: { default: null },
        alt: { default: "" },
        caption: { default: null },
      };
    },
    parseHTML() {
      return [{ tag: `figure[data-type="${name}"]` }];
    },
    renderHTML({ HTMLAttributes }) {
      return ["figure", mergeAttributes({ "data-type": name }, HTMLAttributes)];
    },
    addNodeView() {
      return ReactNodeViewRenderer(MediaView);
    },
  });
}

export const ImageNode = makeMediaNode("image");
export const VideoNode = makeMediaNode("video");
