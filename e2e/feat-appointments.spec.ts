import { test, expect } from "@playwright/test";
import { gotoReady, assertContent, PID, AID } from "./helpers";

test.describe("Appointments / records", () => {
  test("create a new record with vitals", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/add-record`);
    await assertContent(page, "add record");

    await page
      .locator('textarea[placeholder="What is the chief complaint?"]')
      .fill("E2E test visit — routine checkup");
    await page.locator('input[placeholder="Height in cm"]').fill("110");
    await page.locator('input[placeholder="Weight in kg"]').fill("22");

    // Submit WITHOUT touching the AI "Generate" button.
    await page.getByRole("main").getByRole("button", { name: /^Add Record$/i }).click();
    await page.waitForTimeout(3000);
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
    // Should navigate back to the patient (records list) or the new record.
    expect(new URL(page.url()).pathname).toContain(`/user/patients/${PID}`);
  });

  test("appointment detail shows clinical sections", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/${AID}`);
    await assertContent(page, "appointment detail");
    await expect(
      page.getByText(/Signs and Symptoms|Diagnostic|Prescription|Lab exams|Record of/i).first(),
    ).toBeVisible({ timeout: 12000 });
  });

  test("edit appointment form loads", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/${AID}/edit-appointment`);
    await assertContent(page, "edit appointment");
    await expect(
      page.getByText(/Update Record|chief complaint/i).first(),
    ).toBeVisible({ timeout: 12000 });
  });
});
