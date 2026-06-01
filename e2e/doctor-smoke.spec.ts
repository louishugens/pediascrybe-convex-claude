import { test, expect, Page } from "@playwright/test";

/**
 * Render-smoke for EVERY authenticated doctor route. Visits each URL and asserts:
 *  - HTTP status < 500
 *  - the error boundary ("Something went wrong" / "You're offline") is NOT shown
 *  - no Next.js dev runtime/build error overlay
 *  - the page rendered non-empty content
 *
 * Dynamic routes use a real, data-rich patient (k572…) + its appointment /
 * report / receipt / vaccine record IDs. AI-triggering buttons are never clicked.
 */

// Data-rich patient owned by the test doctor (has appts, reports, receipts, vaccines, labs).
const PID = "k572xcs5y2pcvzw4zs0e19b58x7zb311";
const AID = "j97c220x8x1rwxtmkbtp61t92h7zagze"; // appointment on PID
const REPORT_ID = "kn79z3y2ja02yhgb59rhsappen7zaqay";
const RECEIPT_ID = "kh7a7d7mq40jwhb1p4pzwf1z6h7zd4yf";
const VACCINE_ID = "m57c50m514329m3ret8q43y92580hve2";

const ROUTES: { url: string; label: string }[] = [
  // Top-level
  { url: "/user", label: "Dashboard" },
  { url: "/user/patients", label: "Patients list" },
  { url: "/user/add-patient", label: "Add patient" },
  { url: "/user/labs", label: "Lab worklist" },
  { url: "/user/scrybegpt", label: "ScrybeGPT (render only)" },
  { url: "/user/profile", label: "Profile" },
  { url: "/user/profile/add-vaccines", label: "Profile · add vaccines" },
  { url: "/user/edit-profile", label: "Edit profile" },
  { url: "/user/settings/subscription", label: "Settings · subscription" },
  { url: "/user/settings/whatsapp", label: "Settings · whatsapp" },
  { url: "/user/telehealth/availability", label: "Telehealth · availability" },
  { url: "/user/telehealth/appointments", label: "Telehealth · appointments" },
  { url: "/user/transactions", label: "Transactions" },

  // Patient-level
  { url: `/user/patients/${PID}`, label: "Patient detail" },
  { url: `/user/patients/${PID}/edit-patient`, label: "Edit patient" },
  { url: `/user/patients/${PID}/add-record`, label: "New record form" },
  { url: `/user/patients/${PID}/charts`, label: "Charts hub" },
  { url: `/user/patients/${PID}/charts/wfl`, label: "Chart WFL" },
  { url: `/user/patients/${PID}/charts/hfa`, label: "Chart HFA" },
  { url: `/user/patients/${PID}/charts/hcfa`, label: "Chart HCFA" },
  { url: `/user/patients/${PID}/charts/bfa`, label: "Chart BFA" },
  { url: `/user/patients/${PID}/vaccines`, label: "Vaccines list" },
  { url: `/user/patients/${PID}/vaccines/add-record`, label: "Add vaccine record" },
  { url: `/user/patients/${PID}/vaccines/print`, label: "Vaccines print" },
  { url: `/user/patients/${PID}/reports`, label: "Reports list" },
  { url: `/user/patients/${PID}/reports/create-report`, label: "Create report" },
  { url: `/user/patients/${PID}/receipts`, label: "Receipts list" },
  { url: `/user/patients/${PID}/receipts/create-receipt`, label: "Create receipt" },

  // Appointment-level
  { url: `/user/patients/${PID}/${AID}`, label: "Appointment detail" },
  { url: `/user/patients/${PID}/${AID}/edit-appointment`, label: "Edit appointment" },
  { url: `/user/patients/${PID}/${AID}/add-exams`, label: "Add exams" },
  { url: `/user/patients/${PID}/${AID}/add-prescription`, label: "Add prescription" },
  { url: `/user/patients/${PID}/${AID}/add-recommendation`, label: "Add recommendation" },
  { url: `/user/patients/${PID}/${AID}/upload-file`, label: "Upload file" },
  { url: `/user/patients/${PID}/${AID}/print-appointment`, label: "Print appointment" },
  { url: `/user/patients/${PID}/${AID}/print-exams`, label: "Print exams" },
  { url: `/user/patients/${PID}/${AID}/print-prescription`, label: "Print prescription" },

  // Record-specific detail/edit
  { url: `/user/patients/${PID}/reports/${REPORT_ID}`, label: "Report detail" },
  { url: `/user/patients/${PID}/reports/${REPORT_ID}/edit-report`, label: "Edit report" },
  { url: `/user/patients/${PID}/receipts/${RECEIPT_ID}`, label: "Receipt detail" },
  { url: `/user/patients/${PID}/receipts/${RECEIPT_ID}/edit-receipt`, label: "Edit receipt" },
  { url: `/user/patients/${PID}/vaccines/${VACCINE_ID}`, label: "Vaccine record detail" },

  // Chart print variants
  { url: `/user/patients/${PID}/charts/print-wfl`, label: "Print WFL" },
  { url: `/user/patients/${PID}/charts/print-hfa`, label: "Print HFA" },
  { url: `/user/patients/${PID}/charts/print-hcfa`, label: "Print HCFA" },
  { url: `/user/patients/${PID}/charts/print-wfa`, label: "Print WFA" },
  { url: `/user/patients/${PID}/charts/print-bfa`, label: "Print BFA" },
];

async function assertHealthy(page: Page, url: string, label: string) {
  // Stub print so print-* pages don't block on a print dialog.
  await page.addInitScript(() => {
    window.print = () => {};
  });
  const resp = await page.goto(url, { waitUntil: "domcontentloaded" });
  // Convex data streams in — give the client a moment to render.
  await page.waitForTimeout(1200);

  if (resp) {
    expect(resp.status(), `${label}: HTTP ${resp.status()} at ${url}`).toBeLessThan(500);
  }
  // Error boundary must not be displayed.
  await expect(
    page.getByText("Something went wrong"),
    `${label}: error boundary shown at ${url}`,
  ).toHaveCount(0);
  // Next.js dev error overlay must not be present.
  const overlay = await page
    .getByText(/Unhandled Runtime Error|Build Error|Runtime Error/)
    .count();
  expect(overlay, `${label}: dev error overlay at ${url}`).toBe(0);
  // Page rendered something.
  const txt = ((await page.locator("body").innerText().catch(() => "")) || "").trim();
  expect(txt.length, `${label}: blank page at ${url}`).toBeGreaterThan(0);
}

for (const r of ROUTES) {
  test(`renders: ${r.label} (${r.url})`, async ({ page }) => {
    await assertHealthy(page, r.url, r.label);
  });
}

test("error boundary works: /user/test-error shows the boundary", async ({ page }) => {
  await page.goto("/user/test-error", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  // This page throws on purpose; the boundary should catch it.
  await expect(page.getByText(/Something went wrong|offline/i).first()).toBeVisible();
});
