import { test, expect, type Page } from "@playwright/test";

// Demo path smoke test (#14). Needs the app running with DEMO_MODE=1 and the seeded Maria.
const HANDLE = "maria_g";
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/${name}.png`, fullPage: true });

test.describe.configure({ mode: "serial" });

let page: Page;
const consoleErrors: string[] = [];

test.beforeAll(async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } });
  page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`${page.url()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleErrors.push(`${page.url()}: ${e.message}`));
});
test.afterAll(async () => {
  await page.context().close();
});

test("1. landing page loads", async () => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1").first()).toBeVisible();
  await shot(page, "01-landing");
});

test("2. /demo signs in and the dashboard shows published", async () => {
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/published/i).first()).toBeVisible();
  await shot(page, "02-dashboard");
});

for (const path of ["coach", "editor", "preview", "publish", "share", "contact", "settings"]) {
  test(`3. /${path} returns 200 with no console errors`, async () => {
    consoleErrors.length = 0;
    const res = await page.goto(`/${path}`);
    expect(res?.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`/${path}$`)); // not bounced to sign-in
    await page.waitForLoadState("networkidle");
    await shot(page, `03-${path}`);
    expect(consoleErrors, `console errors on /${path}`).toEqual([]);
  });
}

test("4. /@maria_g shows her story", async () => {
  const res = await page.goto(`/@${HANDLE}`);
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "You don't have to carry that alone" })).toBeVisible();
  await shot(page, "04-public-page");
});

test("5. vCard download is valid 3.0 and has the /@maria_g URL", async () => {
  const res = await page.request.get(`/api/vcard/${HANDLE}`);
  expect(res.status()).toBe(200);
  const lines = (await res.text()).split(/\r?\n/).filter(Boolean);
  expect(lines[0]).toBe("BEGIN:VCARD");
  expect(lines).toContain("VERSION:3.0");
  expect(lines.at(-1)).toBe("END:VCARD");
  expect(lines.some((l) => l.startsWith("FN:"))).toBe(true);
  expect(lines.some((l) => /^URL:https?:\/\/.+\/@maria_g$/.test(l))).toBe(true);
});

test("6. QR image is present on /share", async () => {
  await page.goto("/share");
  const qr = page.getByRole("img", { name: /QR code/i });
  await expect(qr).toBeVisible();
  const width = await qr.evaluate((el) => (el as HTMLImageElement).naturalWidth);
  expect(width).toBeGreaterThan(0);
  await shot(page, "06-share-qr");
});
