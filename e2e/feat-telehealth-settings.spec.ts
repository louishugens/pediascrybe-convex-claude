import { test, expect } from "@playwright/test";
import { gotoReady, assertContent } from "./helpers";

test.describe("Telehealth", () => {
  test("availability page renders weekly schedule", async ({ page }) => {
    await gotoReady(page, "/user/telehealth/availability");
    await assertContent(page, "telehealth availability");
    await expect(page.getByText(/Availability|Weekly Schedule/i).first()).toBeVisible();
    // Day rows present.
    await expect(page.getByText(/Monday|Mon/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("appointments page renders", async ({ page }) => {
    await gotoReady(page, "/user/telehealth/appointments");
    await assertContent(page, "telehealth appointments");
  });
});

test.describe("Settings & profile", () => {
  test("whatsapp settings render connection status", async ({ page }) => {
    await gotoReady(page, "/user/settings/whatsapp");
    await assertContent(page, "whatsapp settings");
    await expect(page.getByText(/WhatsApp/i).first()).toBeVisible();
  });

  test("profile page renders", async ({ page }) => {
    await gotoReady(page, "/user/profile");
    await assertContent(page, "profile");
  });

  test("edit profile page renders a form", async ({ page }) => {
    await gotoReady(page, "/user/edit-profile");
    await assertContent(page, "edit profile");
    await expect(page.locator("input").first()).toBeVisible({ timeout: 10000 });
  });
});
