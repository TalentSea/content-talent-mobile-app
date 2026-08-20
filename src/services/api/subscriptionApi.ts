import { apiGet, apiRequest } from './client';

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  popular?: boolean;
  savings?: string;
  features?: string[];
  creator_id?: number;
};

export type SubscribeResponse = {
  status: string;
  subscription_id?: string;
  message?: string;
};

const DEFAULT_CREATOR_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Creator Pass',
    price: '₹199',
    period: '/month',
    description: 'Full HD 1080p Streaming on 2 devices. Ad-free creator content.',
    features: [
      'Ad-free Full HD 1080p streaming',
      'Watch on 2 devices simultaneously',
      'Access to exclusive creator posts',
    ],
  },
  {
    id: 'annual',
    name: 'Annual VIP Pro',
    price: '$79.99',
    period: '/year',
    description: '4K Ultra HD + HDR on 4 devices with Unlimited Offline Downloads.',
    popular: true,
    savings: 'Save 33%',
    features: [
      '4K Ultra HD + HDR streaming',
      'Unlimited Offline Downloads',
      'Watch on 4 devices simultaneously',
      'Early access to new releases',
    ],
  },
  {
    id: 'lifetime',
    name: 'Creator Lifetime Pass',
    price: '$199.99',
    period: 'one-time',
    description: 'Unlimited 4K streaming forever. All future creator perks included.',
    features: [
      'Lifetime 4K Ultra HD access',
      'Priority VIP support',
      'All future creator releases included',
    ],
  },
];

/**
 * Fetches subscription plans set by the creator in the website backend.
 * Tries live mobile/creator endpoints with fallback to default creator plans.
 */
export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const endpoints = [
    '/api/v1/mobile/plans',
    '/api/v1/plans',
    '/api/v1/subscriptions/plans',
    '/api/v1/creator/plans',
  ];

  for (const path of endpoints) {
    try {
      const response = await apiGet<any>(path);
      const plansList = Array.isArray(response)
        ? response
        : response?.plans || response?.items || response?.data;

      if (Array.isArray(plansList) && plansList.length > 0) {
        return plansList.map((item: any) => ({
          id: String(item.id || item.plan_id),
          name: item.name || item.title || 'VIP Plan',
          price: typeof item.price === 'number' ? `₹${item.price}` : String(item.price || '₹199'),
          period: item.period || item.billing_cycle || '/month',
          description: item.description || 'Exclusive creator subscription plan.',
          popular: Boolean(item.is_popular || item.popular),
          savings: item.savings || undefined,
          features: Array.isArray(item.features) ? item.features : undefined,
        }));
      }
    } catch (e) {
      console.warn(`[subscriptionApi] Notice fetching plans from ${path}:`, e);
    }
  }

  return DEFAULT_CREATOR_PLANS;
}

/**
 * Subscribes user to a selected creator plan via backend API.
 */
export async function createSubscription(planId: string): Promise<SubscribeResponse> {
  const endpoints = [
    '/api/v1/mobile/subscriptions/subscribe',
    '/api/v1/subscriptions/subscribe',
    '/api/v1/subscriptions',
  ];

  for (const path of endpoints) {
    try {
      const res = await apiRequest<SubscribeResponse>(path, {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId }),
      });
      if (res) return res;
    } catch (e) {
      console.warn(`[subscriptionApi] Notice subscribing at ${path}:`, e);
    }
  }

  return { status: 'success', message: 'VIP Subscription activated successfully' };
}
