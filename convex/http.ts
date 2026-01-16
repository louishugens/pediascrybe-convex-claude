import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { internal } from "./_generated/api";
import Stripe from "stripe";

const http = httpRouter();

// NOTE: We handle Stripe webhooks ourselves instead of using the component's registerRoutes
// because we need to sync subscriptions to our custom tables with email fallback logic.
// The @convex-dev/stripe component syncs to its own internal tables which we don't use.

// Main webhook endpoint for ALL Stripe events (configured in Stripe dashboard)
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    
    if (!signature || !webhookSecret) {
      return new Response("Missing signature or webhook secret", { status: 400 });
    }
    
    let event: Stripe.Event;
    try {
      // Use async version for Convex runtime (SubtleCryptoProvider)
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Webhook signature verification failed", { status: 400 });
    }
    
    // Handle subscription events
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await ctx.runAction(internal.stripeWebhooks.handleSubscriptionCreated, {
          subscription,
        });
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await ctx.runAction(internal.stripeWebhooks.handleSubscriptionDeleted, {
          subscription,
        });
        break;
      }
      
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          console.log("[Webhook] Checkout completed, customer email:", session.customer_email);
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await ctx.runAction(internal.stripeWebhooks.handleSubscriptionCreated, {
            subscription,
            customerEmail: session.customer_email || undefined, // Pass email for fallback lookup
          });
        }
        break;
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Payment succeeded for invoice ${invoice.id}, customer: ${invoice.customer}`);
        
        // If this is a subscription invoice, ensure subscription is synced
        // Use type assertion to access subscription property
        const invoiceSubscription = (invoice as { subscription?: string | Stripe.Subscription | null }).subscription;
        if (invoiceSubscription) {
          const subscriptionId = typeof invoiceSubscription === 'string' 
            ? invoiceSubscription 
            : invoiceSubscription.id;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Get customer email for fallback lookup
          let customerEmail: string | null = null;
          try {
            const customer = await stripe.customers.retrieve(subscription.customer as string);
            if (customer && !customer.deleted) {
              customerEmail = customer.email || null;
            }
          } catch (e) {
            console.error("[Webhook] Failed to fetch customer:", e);
          }
          
          await ctx.runAction(internal.stripeWebhooks.handleSubscriptionCreated, {
            subscription,
            customerEmail: customerEmail || undefined,
          });
        }
        break;
      }
      
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment failed for invoice ${invoice.id}, customer: ${invoice.customer}`);
        // TODO: Send email notification to user about failed payment
        break;
      }
      
      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Trial ending soon for subscription ${subscription.id}`);
        // TODO: Send email notification to user about trial ending
        break;
      }
      
      default:
        // Log unhandled events for debugging
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
    
    return new Response("OK", { status: 200 });
  }),
});

authComponent.registerRoutes(http, createAuth);

export default http;