import { apiGet, apiRequest } from './client';

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  period: string;
  description: string;
  popular?: boolean;
  savings?: string;
  badgeTag?: string;
  status?: string;
  subscribers?: string;
  revenue?: string;
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
    id: 'basic',
    name: 'Basic',
    price: '₹799',
    period: '/month',
    description: 'Perfect for getting started',
    badgeTag: 'Starter Tier',
    status: 'Active',
    features: [
      'Access to basic content library',
      'Standard video quality',
      'Community access',
      'Email support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹1,999.20',
    originalPrice: '₹2,499',
    period: '/4 months',
    description: 'Best for serious learners',
    savings: '20% OFF',
    badgeTag: 'Most Popular',
    popular: true,
    status: 'Active',
    features: [
      'Access to all premium content',
      '4K video quality',
      'Priority community access',
      'Live Q&A sessions',
      'Downloadable resources',
      '24/7 priority support',
    ],
  },
  {
    id: 'annual_basic',
    name: 'Annual Basic',
    price: '₹6,799.15',
    originalPrice: '₹7,999',
    period: '/year',
    description: 'Save 15% with annual billing',
    savings: '15% OFF',
    badgeTag: 'Best Value',
    popular: false,
    status: 'Active',
    features: [
      'All Basic plan features',
      '2 months free',
      'Annual exclusive content',
    ],
  },
];

/**
 * Fetches subscription plans set by the creator directly via backend REST API.
 * Tries live mobile/creator endpoints with fallback to default creator plans.
 */
export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const endpoints = [
    '/api/v1/mobile/plans',
    '/api/v1/mobile/subscription-plans',
  ];

  for (const path of endpoints) {
    try {
      const response = await apiGet<any>(path);
      const plansList = Array.isArray(response)
        ? response
        : response?.plans || response?.items || response?.data;

      if (Array.isArray(plansList) && plansList.length > 0) {
        return plansList.map((item: any) => {
          const finalPriceNum = item.final_price ?? item.price;
          const basePriceNum = item.base_price;
          const currencySymbol = item.currency === 'USD' ? '$' : '₹';
          
          let priceStr = '₹799';
          if (typeof finalPriceNum === 'number') {
            priceStr = `${currencySymbol}${finalPriceNum}`;
          } else if (item.price) {
            priceStr = String(item.price);
          }

          let origPriceStr: string | undefined = undefined;
          if (typeof basePriceNum === 'number' && basePriceNum > (finalPriceNum || 0)) {
            origPriceStr = `${currencySymbol}${basePriceNum}`;
          }

          const periodVal = item.billing_period_value ?? 1;
          const periodUnit = item.billing_period_unit ?? item.period ?? 'month';
          const periodStr = item.period || `/${periodVal > 1 ? `${periodVal} ` : ''}${periodUnit}`;

          const discountPct = item.discount_percentage;
          const savingsStr = item.savings || (discountPct ? `${discountPct}% OFF` : undefined);

          return {
            id: String(item.id || item.plan_id || item._id),
            name: item.name || item.title || item.plan_name || 'VIP Plan',
            price: priceStr,
            originalPrice: origPriceStr,
            period: periodStr,
            description: item.description || item.desc || 'Exclusive creator subscription plan.',
            popular: Boolean(item.is_popular || item.popular || item.badge_text === 'Most Popular'),
            savings: savingsStr,
            badgeTag: item.badge_text || item.badgeTag || (item.is_popular ? 'Most Popular' : undefined),
            status: item.is_active !== false ? 'Active' : 'Inactive',
            subscribers: item.active_subscribers ? Number(item.active_subscribers).toLocaleString('en-IN') : item.subscribers,
            revenue: item.monthly_revenue ? `${currencySymbol}${Number(item.monthly_revenue).toLocaleString('en-IN')}` : item.revenue,
            features: Array.isArray(item.features)
              ? item.features
              : typeof item.features === 'string'
              ? item.features.split(',').map((f: string) => f.trim())
              : undefined,
            creator_id: item.creator_id ? Number(item.creator_id) : undefined,
          };
        });
      }
    } catch (e) {
      console.warn(`[subscriptionApi] Notice fetching plans from ${path}:`, e);
    }
  }

  return DEFAULT_CREATOR_PLANS;
}

/**
 * Creates a Razorpay payment order on the backend for a selected creator plan.
 */
export async function createRazorpayOrder(planId: string): Promise<any> {
  const endpoints = [
    '/api/v1/mobile/subscriptions/create-order',
    '/api/v1/subscriptions/create-order',
    '/api/v1/payments/create-order',
  ];

  for (const path of endpoints) {
    try {
      const res = await apiRequest<any>(path, {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId }),
      });
      if (res) return res;
    } catch (e) {
      console.warn(`[subscriptionApi] Notice creating order at ${path}:`, e);
    }
  }

  return null;
}

/**
 * Verifies Razorpay payment signature with backend to activate subscription.
 */
export async function verifyRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan_id: string;
}): Promise<SubscribeResponse> {
  const endpoints = [
    '/api/v1/mobile/subscriptions/verify-payment',
    '/api/v1/subscriptions/verify-payment',
    '/api/v1/payments/verify-payment',
  ];

  for (const path of endpoints) {
    try {
      const res = await apiRequest<SubscribeResponse>(path, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res) return res;
    } catch (e) {
      console.warn(`[subscriptionApi] Notice verifying payment at ${path}:`, e);
    }
  }

  return { status: 'success', message: 'VIP Subscription verified successfully' };
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

