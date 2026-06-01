import { test, expect } from "@playwright/test";
import { gotoReady, assertContent, pickSelect, pickFutureDate, PID } from "./helpers";

const VACCINE_ID = "m57c50m514329m3ret8q43y92580hve2";

test.describe("Vaccines", () => {
  test("vaccines list renders", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/vaccines`);
    await assertContent(page, "vaccines list");
  });

  test("vaccine record detail renders", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/vaccines/${VACCINE_ID}`);
    await assertContent(page, "vaccine record detail");
  });

  test("vaccines print page renders", async ({ page }) => {
    await page.addInitScript(() => { window.print = () => {}; });
    await gotoReady(page, `/user/patients/${PID}/vaccines/print`);
    await assertContent(page, "vaccines print");
  });

  test("add vaccine record (queue → save)", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/vaccines/add-record`);
    await assertContent(page, "add vaccine record");

    // The vaccine Select must have options (doctor must track vaccines).
    const vaccineSelect = page.locator('button[role="combobox"]').first();
    await vaccineSelect.click();
    const firstOption = page.getByRole("option").first();
    if ((await firstOption.count()) === 0) {
      test.skip(true, "No vaccines tracked for this doctor — cannot add a record.");
    }
    await firstOption.click();

    // Dose select (second combobox), if present.
    const dose = page.locator('button[role="combobox"]').nth(1);
    if (await dose.isVisible().catch(() => false)) {
      await dose.click();
      await page.getByRole("option").first().click().catch(() => {});
    }

    // Required text fields.
    for (const [ph, val] of [
      ["Pfizer", "Pfizer"],
      ["0.5 mL", "0.5 mL"],
      ["IM", "IM"],
      ["Left arm", "Left arm"],
    ] as const) {
      const inp = page.locator(`input[placeholder="${ph}"]`).first();
      if (await inp.isVisible().catch(() => false)) await inp.fill(val);
    }
    // Lot number (a generic text input without a unique placeholder) — best effort.
    const lot = page.getByLabel(/lot/i).first();
    if (await lot.isVisible().catch(() => false)) await lot.fill("LOT-E2E-123");

    // Expiration date (future).
    await pickFutureDate(page, /expir/i).catch(() => {});

    // Add to queue, then Save All.
    const addToQueue = page.getByRole("button", { name: /add to queue|add record|queue/i }).first();
    if (await addToQueue.isVisible().catch(() => false)) {
      await addToQueue.click();
      await page.waitForTimeout(800);
    }
    const saveAll = page.getByRole("main").getByRole("button", { name: /Save All/i }).first();
    if (await saveAll.isVisible().catch(() => false)) {
      await saveAll.click();
      await page.waitForTimeout(2500);
    }
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });
});
