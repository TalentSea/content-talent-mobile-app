---
name: app-overview
description: Comprehensive overview of Streamr React Native Mobile App architecture, backend API integration, auth session handling, dynamic creator switching, and video playback.
---

# Streamr App Developer Overview

This skill provides an operational guide to understanding, debugging, and extending the Streamr React Native mobile application codebase.

## Core Capabilities & Architecture

1. **Multi-Tenant Creator Engine**:
   - Creator ID is read from `.env` (`EXPO_PUBLIC_CREATOR_ID` / `REACT_APP_CREATOR_ID`).
   - Changing `creator_id` automatically triggers `registerCreatorIdListener` in `authService.ts`, clearing stale sessions and auto-issuing a new guest token.

2. **Branding Synchronization**:
   - `src/services/api/brandingApi.ts` fetches studio name and logo URL from `/api/v1/mobile/branding`.
   - `HomeScreen.tsx` and `ProfileScreen.tsx` display the creator's studio name and logo.

3. **Authentication Flows**:
   - Supports Google Sign-In, Facebook Login, Auth0, and Guest Login.
   - Session tokens are stored in `user_session_v1.json` via React Native FileSystem (`RNFS`).
   - Subscription states are cached in `user_subscriptions_db.json`.

4. **Razorpay Payments & Subscription Gate**:
   - Live plans loaded from `/api/v1/mobile/plans`.
   - Payment checkout via `react-native-razorpay` SDK or fallback modal `RazorpayModal`.
   - Playback gating syncs with live backend `/api/v1/mobile/subscriptions/me`.
   - Ad-supported plans (*Standard with Ads*) show VAST ads (`DEFAULT_AD_TAG_URL`), while ad-free plans (*Premium Ad-Free*) disable ads.

5. **HLS Video Player & Subtitles**:
   - `NativeVideoPlayer.tsx` handles `.m3u8` HLS streams, MP4 downloads, VAST ad tags, and VTT/SRT subtitles.
   - Orientation changes handled seamlessly with `react-native-orientation-locker`.
