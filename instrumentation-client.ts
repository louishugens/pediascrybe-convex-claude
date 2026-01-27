import posthog from "posthog-js"
import { initBotId } from 'botid/client/core';

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  capture_pageview: "history_change",
  capture_pageleave: true,
  debug: process.env.NODE_ENV === "development",
  person_profiles: "identified_only",
})

// BotID protection for public and sensitive endpoints
initBotId({
  protect: [
    // Public contact form - high priority (no auth required)
    {
      path: '/api/contact',
      method: 'POST',
    },
    // Authentication endpoints
    {
      path: '/api/auth/*',
      method: 'POST',
    },
    // Stripe checkout
    {
      path: '/api/stripe/checkout',
      method: 'POST',
    },
    // AI endpoints (cost exposure)
    {
      path: '/api/ai/*',
      method: 'POST',
    },
    // Patient data endpoints
    {
      path: '/api/patients/*',
      method: 'POST',
    },
  ],
});

