import { ImageResponse } from "@vercel/og";

/** Link-preview image: author name + testimony title (US-13). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("name") ?? "A testimony").slice(0, 80);
  const title = (searchParams.get("title") ?? "").slice(0, 120);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#111827",
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 32, color: "#fcd34d" }}>RebirthAI</div>
        <div style={{ fontSize: 72, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>{title || name}</div>
        {title && <div style={{ fontSize: 40, marginTop: 32, color: "#d1d5db" }}>by {name}</div>}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
