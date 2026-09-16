---
name: branding-and-creator-switch
description: Developer guide for dynamic multi-tenant creator selection, branding synchronization, and runtime creator listeners.
---

# Branding & Multi-Tenant Creator Selection Guide

## Overview

Streamr supports dynamic multi-tenant creator selection. Each creator has their own catalog, subscription plans, and branding configuration.

## Creator Selection via `.env`

To set or change the creator ID:
```env
EXPO_PUBLIC_CREATOR_ID=2
REACT_APP_CREATOR_ID=2
```

## Runtime Listener (`registerCreatorIdListener`)

When `setCreatorId(newCreatorId)` is called:
1. `registerCreatorIdListener` fires in `authService.ts`.
2. Old session tokens (`user_session_v1.json`) are purged.
3. A fresh guest JWT token is requested for the new creator ID (`/api/v1/auth/guest`).
4. Branding API (`/api/v1/mobile/branding?creator_id={cid}`) fetches the creator's studio name and logo URL.
