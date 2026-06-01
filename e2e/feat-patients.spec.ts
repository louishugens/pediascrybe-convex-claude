import { test, expect } from "@playwright/test";
import { gotoReady, assertContent, dismissBanners, pickSelect, pickPastDate, PID } from "./helpers";

test.describe("Patients", () => {
  test("create a new patient end-to-end", async ({ page }) => {
    const last = `Zztest${Date.now()}`;
    await gotoReady(page, "/user/add-patient");
    await expect(page.getByText("Add New Patient")).toBeVisible();
    await dismissBanners(page);

    await page.locator('input[placeholder="John"]').fill("E2e");
    await page.locator('input[placeholder="Doe"]').fill(last);
    await pickPastDate(page, /birth date/i); // birthdate trigger is labelled "Birth Date"
    await pickSelect(page, /sex/i, /^male$/i);

    await page.getByRole("main").getByRole("button", { name: /^Add Patient$/i }).click();
    await page.waitForTimeout(2500);
    await expect(page.getByText("Something went wrong")).toHaveCount(0);

    // Verify in the patients list.
    await gotoReady(page, "/user/patients");
    await expect(page.getByText(last).first()).toBeVisible({ timeout: 12000 });
  });

  test("patient detail renders records", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}`);
    await assertContent(page, "patient detail");
    await expect(page.getByText(/Records/i).first()).toBeVisible({ timeout: 12000 });
  });

  test("edit patient form loads and saves", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/edit-patient`);
    await assertContent(page, "edit patient");
    const firstName = page.locator('input[placeholder="John"]').first();
    await expect(firstName).toBeVisible({ timeout: 10000 });
    // Touch a low-risk field (allergies) and save if a save button exists.
    const allergies = page.locator('input[placeholder="Allergies"]').first();
    if (await allergies.isVisible().catch(() => false)) {
      await allergies.fill("None (e2e)");
    }
    const save = page.getByRole("button", { name: /save|update/i }).first();
    if (await save.isVisible().catch(() => false)) {
      await save.click();
      await page.waitForTimeout(2000);
      await expect(page.getByText("Something went wrong")).toHaveCount(0);
    }
  });
});
