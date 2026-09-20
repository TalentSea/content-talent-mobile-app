# API Guide

## Get all videos

GET `/api/v1/videos`

Returns a list of videos.

## Play video

GET `/api/v1/videos/{video_id}/play`

Returns the stream URL for a video.

---

## Social Authentication — Facebook

POST `/api/v1/auth/facebook`

Authenticates a user via Facebook OAuth token. Supports creating/retrieving subscriber accounts bound to a `creator_id`, as well as upgrading anonymous guest sessions in-place.

### Headers

- `Content-Type: application/json`
- `Authorization: Bearer <guest_jwt_token>` *(OPTIONAL: Include ONLY when upgrading an active Guest session)*

### Request Body (`FacebookAuthRequest`)

```json
{
  "creator_id": 1,
  "access_token": "EAABwzLIX58YBA...",
  "device_info": "iPhone 15 Pro (iOS 17.4)"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `creator_id` | Integer | **Yes** | Multi-tenant creator studio ID |
| `access_token` | String | **Yes** | Raw Facebook access token string starting with `EAAB...` |
| `device_info` | String | No | Device info or platform user agent |

### Response Schema (`200 OK`)

```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "refresh_token": "abc123456789...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 100,
    "name": "John Doe",
    "email": "john@example.com",
    "avatar_url": "https://platform-lookaside.fbsbx.com/...",
    "provider": "facebook",
    "role": "subscriber"
  }
}
```

---

### Facebook Login Integration & Troubleshooting Guide

#### ❌ Top 6 Reasons Facebook Login Fails & Fixes

1. **HTTP 422 (Unprocessable Entity) — Missing `creator_id`**:
   - *Cause*: Sending `{ "access_token": "EAAB..." }` without `creator_id`.
   - *Fix*: Pass `creator_id` as an integer (`Number(creatorId)`) in the JSON body.

2. **HTTP 401 (Invalid/Expired Token) — Passing SDK Object**:
   - *Cause*: Sending `JSON.stringify(accessToken)` or an object instead of the raw string.
   - *Fix*: Extract raw string using `data.accessToken.toString()` (must start with `EAAB...`).

3. **HTTP 401 — Putting Facebook Token in Authorization Header**:
   - *Cause*: Passing `Authorization: Bearer <facebook_access_token>`.
   - *Fix*: `Authorization` header is strictly for the app's internal JWT (guest upgrade). The Facebook token belongs in the request JSON body.

4. **iOS "Limited Login" Token Mismatch**:
   - *Cause*: On iOS, if App Tracking Transparency (ATT) is not granted, Facebook SDK defaults to Limited Login, returning an `AuthenticationToken` (OIDC JWT) while `accessToken` is null.
   - *Fix*: Configure standard login permissions in Facebook SDK settings or request tracking authorization before login.

5. **Meta Developer Dashboard in "Development Mode"**:
   - *Cause*: Non-test accounts attempting login see "App Not Active".
   - *Fix*: Set App Mode to **Live** in Meta Dashboard, or add test accounts under *App Roles > Roles > Test Users*.

6. **Missing Key Hashes / Bundle ID**:
   - *Cause*: "Invalid Key Hash" on Android or silent failures on iOS.
   - *Fix*: Register release/debug SHA-1 key hashes in Meta Dashboard (*App Settings > Basic > Android*) and register iOS Bundle ID (*App Settings > Basic > iOS*).