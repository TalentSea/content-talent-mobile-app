# Streamr Mobile App API & Integration Guide

Comprehensive guide to backend endpoints consumed by the Streamr React Native application (`http://138.68.140.83:8000`).

## Central HTTP Client (`src/services/api/client.ts`)

All requests go through `apiRequest<T>()` or `apiGet<T>()`.
- Automatically attaches `Authorization: Bearer <JWT_ACCESS_TOKEN>` header.
- Automatically appends `creator_id=${getCreatorId()}` query parameter to requests.
- Handles HTTP 401 token expiry by executing refresh flow (`/api/v1/auth/refresh`).

---

## Endpoint Reference

### 1. Authentication & Session Management
- **POST `/api/v1/auth/guest`**: Issues an anonymous application guest JWT session.
  - Body: `{ "device_id": "...", "device_info": "...", "creator_id": 2 }`
- **POST `/api/v1/auth/google`**: Authenticates user via Google OAuth ID token.
  - Body: `{ "creator_id": 2, "id_token": "...", "device_info": "..." }`
- **POST `/api/v1/auth/facebook`**: Authenticates user via Facebook Access Token.
- **POST `/api/v1/auth/refresh`**: Rotates 60-day refresh token to issue a fresh 30-minute access token.
- **GET `/api/v1/auth/me`**: Fetches current authenticated subscriber identity.

### 2. Branding & Creator Settings
- **GET `/api/v1/mobile/branding?creator_id={cid}`**: Returns creator's branding details (`studio_name`, `logo_url`, `banner_url`, `theme_color`).

### 3. Video Catalog & Playback
- **GET `/api/v1/mobile/videos?creator_id={cid}&sort=newest&page=1&limit=50`**: Returns paginated list of videos published by the creator.
- **GET `/api/v1/mobile/videos/{video_id}?creator_id={cid}`**: Retrieves video metadata, HLS stream URL, SRT/VTT caption tracks, and view/like counters.

### 4. Subscription Plans & Payments
- **GET `/api/v1/mobile/plans?creator_id={cid}`**: Retrieves creator's membership plans (e.g., *Standard with Ads* ₹99/mo, *Premium Ad-Free* ₹199/mo).
- **GET `/api/v1/mobile/subscriptions/me?creator_id={cid}`**: Retrieves user's live active subscription status, active plan name, and days remaining.
- **POST `/api/v1/mobile/payments/create-order`**: Creates a Razorpay payment order for a selected plan ID.
  - Body: `{ "plan_id": 2 }`
- **POST `/api/v1/mobile/payments/verify`**: Verifies Razorpay HMAC signature and activates subscriber account.
  - Body: `{ "razorpay_order_id": "...", "razorpay_payment_id": "...", "razorpay_signature": "...", "plan_id": "2" }`

### 5. Video Comments & Interactivity
- **GET `/api/v1/mobile/comments?video_id={id}`**: Fetches comment thread for a video.
- **POST `/api/v1/mobile/comments`**: Posts a top-level comment or nested reply.