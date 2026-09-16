---
name: subscription-and-payments
description: Detailed guide for subscription plans, Razorpay payment flow, backend signature verification, and ad playback rules in Streamr.
---

# Subscription & Razorpay Payment Guide

## Workflow

```
1. Fetch Plans (GET /api/v1/mobile/plans?creator_id={cid})
   ├── Standard with Ads (₹99/mo)
   └── Premium Ad-Free (₹199/mo)

2. Create Razorpay Order (POST /api/v1/mobile/payments/create-order)
   └── Returns order_id, amount (in paise), currency (INR), key_id

3. Native Razorpay Checkout (RazorpayCheckout.open(options))
   └── Receives razorpay_payment_id, razorpay_order_id, razorpay_signature

4. Verify Payment (POST /api/v1/mobile/payments/verify)
   ├── Activates VIP subscription on FastAPI backend
   └── Calls activateSubscription(...) to persist session locally
```

## Gating & Ad Rules

- `isUserSubscribed()` checks active session and `user_subscriptions_db.json`.
- `useVideoPlayback.ts` queries `/api/v1/mobile/subscriptions/me` before gating playback to avoid false subscription popups.
- `isUserAdFree()` returns `true` for "Premium Ad-Free" plans (no ads), and `false` for "Standard with Ads" plans (VAST ads enabled).
