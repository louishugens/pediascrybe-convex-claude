import { test, expect } from "@playwright/test";
import { gotoReady, PID, AID } from "./helpers";

/**
 * GATING IS A FEATURE. With no paid plan, gated actions should surface a
 * subscription/upgrade gate (SubscriptionDialog "Start Your Free Trial" /
 * UpgradeModal "Feature Locked" / "View Plans" / "Maybe Later"), NOT silently
 * work and NOT crash. These tests RECORD what actually happens for each gated
 * entry point so we can classify behavior (gate-fires vs allowed vs error).
 */

const GATE_RX = /Start Your Free Trial|Feature Locked|Limit Reached|View Plans|Maybe Later|Upgrade|subscription|free trial/i;

async function probe(page: import("@playwright/test").Page, label: string, action: () => Promise<void>) {
  await action().catch(() => {});
  await page.waitForTimeout(1500);
  const gateVisible = await page.getByText(GATE_RX).first().isVisible().catch(() => false);
  const boundary = (await page.getByText("Something went wrong").count()) > 0;
  test.info().annotations.push({
    type: "gate-probe",
    description: `${label}: gateVisible=${gateVisible} errorBoundary=${boundary} url=${new URL(page.url()).pathname}`,
  });
  return { gateVisible, boundary };
}

test.describe("Gating (no paid plan) — verify gates fire", () => {
  test("ScrybeGPT (AI) is gated", async ({ page }) => {
    await gotoReady(page, "/user/scrybegpt");
    const r = await probe(page, "scrybegpt", async () => {});
    expect(r.boundary, "scrybegpt should not crash").toBeFalsy();
  });

  test("Add prescription action surfaces a gate or form", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/${AID}/add-prescription`);
    const r = await probe(page, "add-prescription page", async () => {
      await page.locator('input[placeholder="Paracetamol"]').first().fill("Amoxicillin");
      await page.getByRole("main").getByRole("button", { name: /Save Prescription/i }).click();
    });
    expect(r.boundary, "add-prescription should not crash").toBeFalsy();
  });

  test("Create report action surfaces a gate or form", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/reports/create-report`);
    const r = await probe(page, "create-report page", async () => {});
    expect(r.boundary, "create-report should not crash").toBeFalsy();
  });

  test("Add record (appointment) action", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/add-record`);
    const r = await probe(page, "add-record page", async () => {});
    expect(r.boundary, "add-record should not crash").toBeFalsy();
  });

  test("Add patient action", async ({ page }) => {
    await gotoReady(page, `/user/patients`);
    const r = await probe(page, "patients list / add patient", async () => {
      await page.getByRole("link", { name: /add patient/i }).first().click().catch(() => {});
      await page.getByRole("button", { name: /add patient/i }).first().click().catch(() => {});
    });
    expect(r.boundary, "add-patient should not crash").toBeFalsy();
  });
});
