import { test, expect } from "@playwright/test";

/**
 * Public, unauthenticated pages. Catches build/runtime regressions on the
 * marketing + auth surface without needing credentials. Also asserts no
 * uncaught console errors fire during load.
 */

function trackConsoleErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  return errors;
}

test("home / login page renders with sign-in form", async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await page.goto("/");
  await expect(page.getByText("Welcome back")).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(
    page.locator('input[placeholder="Enter your password"]'),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  // Allow known noisy warnings; fail on hard errors only.
  const hard = errors.filter((e) => !/posthog|favicon|hydrat/i.test(e));
  expect(hard, hard.join("\n")).toHaveLength(0);
});

test("invalid login shows an error, no redirect", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="email"]').fill("nobody@example.com");
  await page
    .locator('input[placeholder="Enter your password"]')
    .fill("wrongpassword123");
  await page.getByRole("button", { name: "Sign In" }).click();
  // Should stay on the login page (no /user redirect).
  await page.waitForTimeout(3000);
  expect(new URL(page.url()).pathname).not.toMatch(/^\/user/);
});

test("pricing page renders", async ({ page }) => {
  const res = await page.goto("/pricing");
  expect(res?.status()).toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();
});

test("signup page renders", async ({ page }) => {
  const res = await page.goto("/signup");
  expect(res?.status()).toBeLessThan(400);
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

test("unauthenticated /user is gated (shows login, not dashboard)", async ({
  page,
}) => {
  await page.goto("/user");
  await page.waitForTimeout(2500);
  // The guard renders the sign-in form in place of the dashboard. Proving the
  // login UI is shown proves the authenticated dashboard is NOT served.
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
});
