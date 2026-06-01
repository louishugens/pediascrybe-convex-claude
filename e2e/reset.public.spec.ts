import { test, expect } from "@playwright/test";
test("reset request succeeds via client (no 404)", async ({ page }) => {
  const failed: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/auth/") && r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("/reset");
  await page.locator('input[type="email"]').fill("throwaway-noreal@example.com");
  await page.getByRole("button", { name: "Send Reset Link" }).click();
  // Success UI proves the client call resolved without error.
  await expect(page.getByText("Check your email")).toBeVisible({ timeout: 15000 });
  expect(failed, "auth endpoint errors:\n" + failed.join("\n")).toHaveLength(0);
});
