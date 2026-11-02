// Seeds a LOCAL Supabase with fictional demo data for reviews and demos (rules/test-data.md).
// Never run against a hosted project. Usage (keys from `npx supabase status -o env`):
//   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo.mjs
// Creates: demo@rebirthai.local (Maria, published testimony + coach history) and
// newcomer@rebirthai.local (signed up, nothing written yet). Safe to re-run.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (local only).");
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url)) throw new Error("Refusing to seed a non-local Supabase.");

const db = createClient(url, key, { auth: { persistSession: false } });

const p = (text) => ({ type: "paragraph", content: [{ type: "text", text }] });
const h = (text) => ({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] });
const story = {
  type: "doc",
  content: [
    h("Before"),
    p("For most of my twenties I worked two jobs and slept four hours a night. I told myself I was building a future, but really I was running from the quiet. When my brother stopped speaking to me after our father's funeral, I filled that silence with more work."),
    h("The turning point"),
    p("A coworker, Ana, invited me to a Thursday night meal at her church. I went for the food. An older man named Luis asked how I was, and for the first time in years I answered honestly. He didn't give advice. He just said, \"You don't have to carry that alone.\""),
    h("After"),
    p("I still work hard, but I rest on Sundays now. I called my brother last spring and we talk every few weeks. I help set up the Thursday meals, and when someone new walks in looking tired, I make sure they get a plate first."),
  ],
};

async function user(email, password = "demo-password-123") {
  const { data: list } = await db.auth.admin.listUsers({ perPage: 200 });
  const existing = list?.users.find((u) => u.email === email);
  if (existing) return existing.id;
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return data.user.id;
}

async function upsert(table, row, onConflict) {
  const { data, error } = await db.from(table).upsert(row, { onConflict }).select().single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

const mariaId = await user("demo@rebirthai.local");
const maria = await upsert(
  "profiles",
  {
    user_id: mariaId,
    handle: "maria_g",
    display_name: "Maria Gonzalez",
    bio: "Thursday-night meal volunteer. Coffee first.",
    church: "Grace Community Church",
    contact_phone: "+1 555 0100",
    contact_email: "maria@example.com",
    share_contact: true,
  },
  "user_id",
);
const t = await upsert(
  "testimonies",
  {
    profile_id: maria.id,
    title: "You don't have to carry that alone",
    draft_content: story,
    published_content: story,
    published_title: "You don't have to carry that alone",
    status: "published",
    visibility: "public",
    published_at: new Date().toISOString(),
  },
  "profile_id",
);
await db.from("coach_messages").delete().eq("testimony_id", t.id);
const msgs = [
  ["assistant", "Thanks for being here. Let's start before things changed. What did an ordinary week look like for you back then?", "before"],
  ["user", "Two jobs, four hours of sleep. I thought I was building a future but I was avoiding the quiet.", "before"],
  ["assistant", "That's honest. What was the quiet holding that you didn't want to hear?", "before"],
  ["user", "My brother stopped talking to me after our dad's funeral.", "before"],
  ["assistant", "Thank you for sharing that. Was there a moment when something started to shift?", "turning_point"],
  ["user", "Ana from work invited me to a Thursday meal at her church. An older man, Luis, asked how I was and I actually told him.", "turning_point"],
  ["assistant", "What did Luis say or do that stayed with you?", "turning_point"],
  ["user", "He said I don't have to carry that alone. No advice, just that.", "turning_point"],
  ["assistant", "And today, what's different in your week?", "after"],
  ["user", "I rest on Sundays. I call my brother every few weeks. I help set up the Thursday meals.", "after"],
];
const { error: mErr } = await db.from("coach_messages").insert(
  msgs.map(([role, content, section], i) => ({
    testimony_id: t.id,
    role,
    content,
    section,
    created_at: new Date(Date.now() - (msgs.length - i) * 60_000).toISOString(),
  })),
);
if (mErr) throw mErr;

await user("newcomer@rebirthai.local");
console.log("Seeded: demo@rebirthai.local (Maria, published at /@maria_g), newcomer@rebirthai.local (empty)");
