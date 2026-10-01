import { test, expect } from "@playwright/test";
import source from "../../src/content/source.json";

test("approved editorial copy remains visible and page does not overflow", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Your brand is boring.");
  for (const section of ["Process", "Manifesto A", "Manifesto B", "Manifesto C", "Manifesto D", "Manifesto E", "BRVE test", "Fit", "Closing", "Founders"] as const) {
    for (const text of source[section].filter(t => t !== "—" && !/^\d+$/.test(t))) {
      await expect(page.locator("main")).toContainText(text);
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
  expect(errors).toEqual([]);
});

test("hero loads full film only on click and restores focus after closing", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto("/");
  await expect(page.locator(".hero-background-video")).toBeHidden();
  expect(requests.filter(url => url.endsWith(".mp4"))).toEqual([]);
  const play = page.locator(".hero .play-trigger");
  await play.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".video-frame video")).toHaveAttribute("src", "/media/car.mp4");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(play).toBeFocused();
  await page.getByRole("button", { name: "Next slide", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Everyone has AI. Nobody has taste.");
});

test("mobile menu traps focus, closes on Escape and navigates to feed", async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await toggle.click();
  await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: /feed/ }).click();
  await expect(page).toHaveURL(/#blog$/);
  await expect(page.locator("#blog")).toBeFocused();
});

test("film and journal controls are usable without WebGL", async ({ page }) => {
  await page.goto("/");
  await page.locator("#videos").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Next film", exact: true }).click();
  await expect(page.locator(".film-caption")).toContainText("Everyone has AI. Nobody has taste.");
  await page.locator(".film-watch").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator("#blog").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Next article", exact: true }).click();
  await expect(page.locator(".journal-navigation .eyebrow")).not.toHaveText("01 / 04");
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("admin and sync reject unauthenticated writes", async ({ request, page }) => {
  expect((await request.get("/api/admin/content")).status()).toBe(401);
  expect((await request.put("/api/admin/content", { data: { kind: "settings", data: { contactFormUrl: "https://evil.example" } } })).status()).toBe(401);
  expect((await request.post("/api/sync/blogger")).status()).toBe(401);
  expect((await request.get("/api/sync/blogger")).status()).toBe(401);
  await page.goto("/admin");
  await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save settings" })).toHaveCount(0);
});
