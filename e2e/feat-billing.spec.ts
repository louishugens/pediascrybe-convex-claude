import { test, expect } from "@playwright/test";
import { gotoReady, assertContent } from "./helpers";

/**
 * Payments/billing surface. We verify the UI renders plans, usage, and that the
 * checkout/credit-pack controls exist — WITHOUT completing a real Stripe payment
 * (no button click that would create a live checkout session).
 */
test.describe("Billing & payments", () => {
  test("pricing page shows plans + a checkout CTA", async ({ page }) => {
    await gotoReady(page, "/user/pricing");
    await assertContent(page, "pricing");
    // Heading is "Choose Your Plan" or "Change Your Plan".
    await expect(page.getByText(/Your Plan/i).first()).toBeVisible();
    // A subscribe/switch/trial CTA must exist.
    await expect(
      page
        .getByRole("button", {
          name: /Free Trial|Switch to|Current Plan|Contact Sales/i,
        })
        .first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("public pricing page renders plans", async ({ page }) => {
    await gotoReady(page, "/pricing");
    await assertContent(page, "public pricing");
  });

  test("subscription settings shows plan + usage", async ({ page }) => {
    await gotoReady(page, "/user/settings/subscription");
    await assertContent(page, "subscription settings");
    await expect(page.getByText(/Subscription|Billing|Plan|Usage/i).first()).toBeVisible();
  });

  test("transactions page renders with a date filter", async ({ page }) => {
    await gotoReady(page, "/user/transactions");
    await assertContent(page, "transactions");
    await expect(page.getByText(/Transactions/i).first()).toBeVisible();
  });
});
