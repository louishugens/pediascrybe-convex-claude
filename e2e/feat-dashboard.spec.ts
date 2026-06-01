import { test, expect } from "@playwright/test";
import { gotoReady, assertContent } from "./helpers";

test.describe("Dashboard", () => {
  test("loads with stats and charts", async ({ page }) => {
    await gotoReady(page, "/user");
    await assertContent(page, "dashboard");
    // At least one core stat card should be present.
    const anyStat = page.getByText(
      /Total Patients|Today's Revenue|Total Records|Today's Patients|Recent Records/i,
    );
    await expect(anyStat.first()).toBeVisible({ timeout: 15000 });
  });

  test("has a link to transactions", async ({ page }) => {
    await gotoReady(page, "/user");
    await expect(
      page.getByRole("link", { name: /transactions/i }).first(),
    ).toBeVisible();
  });
});
