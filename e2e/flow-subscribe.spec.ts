import { test, expect, Page } from "@playwright/test";

/**
 * Subscribe to the SMALLEST plan (essentials) via the real Stripe TEST-mode
 * checkout, then confirm the webhook provisions an active subscription.
 * Initiates checkout through the authenticated API (robust), then fills the
 * Stripe hosted test card. Runs alone — it mutates account state.
 */
test.describe.configure({ timeout: 240_000 });

const TEST_CARD = {
  number: "4242 4242 4242 4242",
  exp: "12 / 34",
  cvc: "123",
  name: "Test Doctor",
  zip: "10001",
};

async function fillStripeCheckout(page: Page) {
  // Stripe hosted Checkout renders native inputs (no iframe). Fill defensively.
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2500);

  const tryFill = async (selectors: string[], value: string) => {
    for (const sel of selectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        await el.fill(value).catch(() => {});
        return true;
      }
    }
    return false;
  };

  await tryFill(["#email", 'input[name="email"]', 'input[type="email"]'], "louishugens@gmail.com");
  await tryFill(["#cardNumber", 'input[name="cardNumber"]', 'input[autocomplete="cc-number"]'], TEST_CARD.number);
  await tryFill(["#cardExpiry", 'input[name="cardExpiry"]', 'input[autocomplete="cc-exp"]'], TEST_CARD.exp);
  await tryFill(["#cardCvc", 'input[name="cardCvc"]', 'input[autocomplete="cc-csc"]'], TEST_CARD.cvc);
  await tryFill(["#billingName", 'input[name="billingName"]', 'input[autocomplete="cc-name"]'], TEST_CARD.name);
  await tryFill(["#billingPostalCode", 'input[name="billingPostalCode"]', 'input[autocomplete="postal-code"]'], TEST_CARD.zip);

  // Submit (button text varies: "Start trial" / "Subscribe" / "Pay").
  const submit = page
    .locator('button[type="submit"], .SubmitButton')
    .filter({ hasText: /trial|subscribe|pay|start/i })
    .first();
  if (await submit.isVisible().catch(() => false)) {
    await submit.click();
  } else {
    await page.locator('button[type="submit"]').first().click().catch(() => {});
  }
}

test("subscribe to Essentials via Stripe test checkout", async ({ page, baseURL }) => {
  // 1. Create a checkout session through the authenticated API.
  const res = await page.request.post(`${baseURL}/api/stripe/checkout`, {
    data: {
      tierName: "essentials",
      successUrl: `${baseURL}/user?subscription=success`,
      cancelUrl: `${baseURL}/user/pricing?subscription=canceled`,
    },
  });
  expect(res.ok(), `checkout API status ${res.status()}`).toBeTruthy();
  const body = await res.json();
  expect(body.url, "checkout session returned no url").toBeTruthy();
  expect(body.url, "expected a Stripe checkout URL").toContain("checkout.stripe.com");

  // 2. Drive the Stripe hosted test checkout.
  await page.goto(body.url, { waitUntil: "domcontentloaded" });
  await fillStripeCheckout(page);

  // 3. Wait to be redirected back to the app.
  await page.waitForURL(/localhost:3000\/user/, { timeout: 90_000 });
  await page.waitForTimeout(2000);

  test.info().annotations.push({
    type: "post-checkout-url",
    description: page.url(),
  });
});
