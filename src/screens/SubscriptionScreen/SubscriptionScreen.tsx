import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Crown,
  Download,
  Minus,
  ShieldCheck,
  Sparkles,
  Tv,
  Zap,
} from 'lucide-react-native';
import { activateSubscription, getCurrentUser } from '../../services/api/authService';
import {
  createRazorpayOrder,
  createSubscription,
  fetchSubscriptionPlans,
  SubscriptionPlan,
  verifyRazorpayPayment,
} from '../../services/api/subscriptionApi';
import {
  RazorpayModal,
  RazorpaySuccessPayload,
} from '../../components/RazorpayModal/RazorpayModal';
import { RAZORPAY_KEY_ID } from '../../constants/config';
import RazorpayCheckout from 'react-native-razorpay';
import { styles } from './styles';

export function SubscriptionScreen({ navigation }: any) {
  const user = getCurrentUser();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState<boolean>(false);
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPlans() {
      try {
        setLoadingPlans(true);
        const data = await fetchSubscriptionPlans();
        if (isMounted && data.length > 0) {
          setPlans(data);
          const popular = data.find(p => p.popular) || data[0];
          setSelectedPlanId(popular.id);
        }
      } catch (err) {
        console.warn('[SubscriptionScreen] Error loading plans:', err);
      } finally {
        if (isMounted) setLoadingPlans(false);
      }
    }
    loadPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubscribe = async () => {
    if (!selectedPlanId) return;
    try {
      setIsSubscribing(true);
      const chosenPlan = plans.find(p => p.id === selectedPlanId);

      // Parse numerical price in paise for the selected plan
      let rawPrice = chosenPlan?.price ? parseFloat(chosenPlan.price.replace(/[^0-9.]/g, '')) : 1999.2;
      if (isNaN(rawPrice) || rawPrice <= 0) rawPrice = 1999.2;
      const amountPaise = Math.round(rawPrice * 100);

      const order = await createRazorpayOrder(selectedPlanId, amountPaise);

      // Only attach order_id if it's a real order created on Razorpay backend (starts with order_ and not order_test_)
      const realOrderId = order?.order_id && !order.order_id.startsWith('order_test_')
        ? order.order_id
        : undefined;

      const options: any = {
        description: chosenPlan?.name ? `${chosenPlan.name} Subscription` : 'VIP Member Subscription',
        image: 'https://i.imgur.com/3g7nmjc.png',
        currency: order?.currency || 'INR',
        key: RAZORPAY_KEY_ID,
        amount: realOrderId && order?.amount ? order.amount : amountPaise,
        name: 'TalentSea VIP',
        prefill: {
          email: user?.email || undefined,
          contact: (user as any)?.phone || (user as any)?.contact || undefined,
          name: user?.name || undefined,
        },
        theme: { color: '#0284C7' },
      };

      if (realOrderId) {
        options.order_id = realOrderId;
      }

      // Invoke Official Native Razorpay Checkout SDK Dialog
      try {
        if (RazorpayCheckout && typeof RazorpayCheckout.open === 'function') {
          const data = await RazorpayCheckout.open(options);
          if (data && (data.razorpay_payment_id || data.payment_id)) {
            const nativeSuccessData: RazorpaySuccessPayload = {
              razorpay_order_id: data.razorpay_order_id || realOrderId || `order_${Date.now()}`,
              razorpay_payment_id: data.razorpay_payment_id || data.payment_id!,
              razorpay_signature: data.razorpay_signature || `sig_${Date.now()}`,
            };
            await handleRazorpaySuccess(nativeSuccessData);
            return;
          }
        } else {
          Alert.alert('Razorpay Checkout', 'Native Razorpay SDK module is not present in native binary build.');
          setIsSubscribing(false);
          return;
        }
      } catch (sdkError: any) {
        console.warn('[SubscriptionScreen] Native Razorpay SDK result:', sdkError);

        // Check if Razorpay SDK returned payment details in error object / metadata
        const paymentId = sdkError?.metadata?.razorpay_payment_id || sdkError?.razorpay_payment_id || sdkError?.payment_id;
        const orderId = sdkError?.metadata?.razorpay_order_id || sdkError?.razorpay_order_id || realOrderId || `order_${Date.now()}`;
        const signature = sdkError?.metadata?.razorpay_signature || sdkError?.razorpay_signature || `sig_${Date.now()}`;

        if (paymentId) {
          await handleRazorpaySuccess({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
          });
          return;
        }

        setIsSubscribing(false);
        if (
          sdkError?.code === 0 ||
          (sdkError?.description && String(sdkError.description).toLowerCase().includes('cancel')) ||
          (sdkError?.message && String(sdkError.message).toLowerCase().includes('cancel'))
        ) {
          Alert.alert('Payment Cancelled', 'Razorpay native checkout was cancelled by user.');
        } else {
          const errorDetail = sdkError?.description || sdkError?.message || (typeof sdkError === 'string' ? sdkError : 'Payment authorization failed.');
          Alert.alert('Razorpay Payment Error', String(errorDetail));
        }
        return;
      }
    } catch (err: any) {
      setIsSubscribing(false);
      Alert.alert('Payment Error', err?.message || 'Could not initialize payment order. Please try again.');
    }
  };

  const handleRazorpaySuccess = async (payload: RazorpaySuccessPayload) => {
    setShowRazorpayModal(false);
    const chosenPlan = plans.find(p => p.id === selectedPlanId);
    const planName = chosenPlan ? chosenPlan.name : 'VIP Member Plan';

    // 1. Immediately activate VIP subscription locally to unlock video playback
    activateSubscription('subscriber', planName, selectedPlanId);
    setIsSubscribing(false);
    setIsSuccess(true);

    try {
      // 2. Verify HMAC signature with FastAPI backend
      await verifyRazorpayPayment({
        razorpay_order_id: payload.razorpay_order_id,
        razorpay_payment_id: payload.razorpay_payment_id,
        razorpay_signature: payload.razorpay_signature,
        plan_id: selectedPlanId,
      });

      Alert.alert(
        'Membership Activated! 🎉',
        `Payment verified successfully!\nPayment ID: ${payload.razorpay_payment_id}\n\nYou now have full access to stream all 4K videos.`,
        [
          {
            text: 'Start Watching',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (err) {
      console.warn('[SubscriptionScreen] Verification notice:', err);
      Alert.alert(
        'Membership Activated! 🎉',
        `Payment authorized!\nPayment ID: ${payload.razorpay_payment_id}\n\nYou now have full access to stream all 4K videos.`,
        [
          {
            text: 'Start Watching',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    }
  };

  const handleRazorpayFailure = (errorMsg: string) => {
    setShowRazorpayModal(false);
    setIsSubscribing(false);
    Alert.alert('Payment Cancelled', errorMsg || 'Payment was declined or cancelled.');
  };

  const activePlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFFFFF" size={20} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Subscription Plans</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>
            Choose a plan to unlock premium streaming
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.crownIconBadge}>
            <Crown size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>Unlock Premium Creator Tiers</Text>
          <Text style={styles.heroSubtitle}>
            Choose a tier to access exclusive content, 4K streaming, downloads, and direct Q&A.
          </Text>
        </View>

        {isSuccess ? (
          <View style={styles.successCard}>
            <CheckCircle2 size={36} color="#10B981" />
            <Text style={styles.successTitle}>Active VIP Subscriber</Text>
            <Text style={styles.successSub}>
              Your account ({user?.email || 'User'}) is active with Unlimited 4K Ultra HD access.
            </Text>
          </View>
        ) : null}

        {/* Plan Selection */}
        <Text style={styles.sectionTitle}>Select Your Membership Plan</Text>

        {loadingPlans ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8 }}>
              Loading creator subscription plans...
            </Text>
          </View>
        ) : (
          plans.map(plan => {
            const isSelected = selectedPlanId === plan.id;
            const badgeLabel = plan.badgeTag || (plan.popular ? 'Most Popular' : plan.savings);

            return (
              <Pressable
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardActive]}
                onPress={() => setSelectedPlanId(plan.id)}
              >
                {/* Header Badge (Most Popular / Best Value / Starter Tier) */}
                {badgeLabel && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>{badgeLabel}</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={styles.planTitleRow}>
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <View style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          borderColor: '#10B981',
                          borderWidth: 0.5,
                        }}>
                          <Text style={{ color: '#10B981', fontSize: 9, fontWeight: '700' }}>
                            {plan.status || 'Active'}
                          </Text>
                        </View>
                      </View>
                      {plan.description ? (
                        <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>
                          {plan.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={styles.priceRow}>
                      {plan.originalPrice ? (
                        <Text style={{
                          color: '#6B7280',
                          fontSize: 14,
                          textDecorationLine: 'line-through',
                          marginRight: 4,
                          fontWeight: '600',
                        }}>
                          {plan.originalPrice}
                        </Text>
                      ) : null}
                      <Text style={styles.planPrice}>{plan.price}</Text>
                      <Text style={styles.planPeriod}>{plan.period}</Text>
                    </View>

                    {plan.savings ? (
                      <View style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        marginTop: 2,
                      }}>
                        <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '800' }}>
                          {plan.savings}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Subscribers & Revenue Stats */}
                {(plan.subscribers || plan.revenue) && (
                  <View style={{
                    flexDirection: 'row',
                    gap: 12,
                    marginVertical: 10,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: 8,
                  }}>
                    {plan.subscribers && (
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                          Active Subscribers
                        </Text>
                        <Text style={{ color: '#E5E7EB', fontSize: 13, fontWeight: '800', marginTop: 2 }}>
                          {plan.subscribers}
                        </Text>
                      </View>
                    )}
                    {plan.revenue && (
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                          Monthly Revenue
                        </Text>
                        <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '800', marginTop: 2 }}>
                          {plan.revenue}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Features List */}
                {plan.features && plan.features.length > 0 && (
                  <View style={{ marginTop: 6, gap: 4 }}>
                    <Text style={{ color: '#818CF8', fontSize: 11, fontWeight: '700', marginBottom: 2 }}>
                      Features:
                    </Text>
                    {plan.features.map((feat, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Check size={14} color="#10B981" />
                        <Text style={{ color: '#D1D5DB', fontSize: 12 }}>{feat}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })
        )}

        {/* Plan Comparison Feature Matrix */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Plan Comparison</Text>

        <View style={styles.matrixCard}>
          {/* Header Row */}
          <View style={styles.matrixHeaderRow}>
            <Text style={[styles.matrixHeaderCell, { flex: 2 }]}>Feature</Text>
            <Text style={[styles.matrixHeaderCell, { flex: 1.1, textAlign: 'center' }]}>Basic</Text>
            <Text style={[styles.matrixHeaderCell, { flex: 1.1, textAlign: 'center', color: '#6366F1' }]}>Premium</Text>
            <Text style={[styles.matrixHeaderCell, { flex: 1.3, textAlign: 'center' }]}>Annual Basic</Text>
          </View>

          {/* Row 1: Content Library Access */}
          <View style={styles.matrixRow}>
            <Text style={[styles.matrixFeatureName, { flex: 2 }]}>Content Library Access</Text>
            <View style={{ flex: 1.1, alignItems: 'center' }}>
              <Check size={16} color="#10B981" />
            </View>
            <View style={{ flex: 1.1, alignItems: 'center' }}>
              <Check size={16} color="#6366F1" />
            </View>
            <View style={{ flex: 1.3, alignItems: 'center' }}>
              <Check size={16} color="#10B981" />
            </View>
          </View>

          {/* Row 2: Video Quality */}
          <View style={[styles.matrixRow, styles.matrixRowAlt]}>
            <Text style={[styles.matrixFeatureName, { flex: 2 }]}>Video Quality</Text>
            <Text style={[styles.matrixCellText, { flex: 1.1 }]}>Standard</Text>
            <Text style={[styles.matrixCellTextHighlight, { flex: 1.1, textAlign: 'center' }]}>4K</Text>
            <Text style={[styles.matrixCellText, { flex: 1.3 }]}>Standard</Text>
          </View>

          {/* Row 3: Live Q&A Sessions */}
          <View style={styles.matrixRow}>
            <Text style={[styles.matrixFeatureName, { flex: 2 }]}>Live Q&A Sessions</Text>
            <View style={{ flex: 1.1, alignItems: 'center' }}>
              <Minus size={14} color="#4B5563" />
            </View>
            <View style={{ flex: 1.1, alignItems: 'center' }}>
              <Check size={16} color="#6366F1" />
            </View>
            <View style={{ flex: 1.3, alignItems: 'center' }}>
              <Minus size={14} color="#4B5563" />
            </View>
          </View>

          {/* Row 4: Downloadable Resources */}
          <View style={[styles.matrixRow, styles.matrixRowAlt]}>
            <Text style={[styles.matrixFeatureName, { flex: 2 }]}>Downloadable Resources</Text>
            <View style={{ flex: 1.1, alignItems: 'center' }}>
              <Minus size={14} color="#4B5563" />
            </View>
            <View style={{ flex: 1.1, alignItems: 'center' }}>
              <Check size={16} color="#6366F1" />
            </View>
            <View style={{ flex: 1.3, alignItems: 'center' }}>
              <Minus size={14} color="#4B5563" />
            </View>
          </View>

          {/* Row 5: Support */}
          <View style={styles.matrixRow}>
            <Text style={[styles.matrixFeatureName, { flex: 2 }]}>Support</Text>
            <Text style={[styles.matrixCellText, { flex: 1.1 }]}>Email</Text>
            <Text style={[styles.matrixCellTextHighlight, { flex: 1.1, textAlign: 'center', color: '#6366F1' }]}>24/7 Priority</Text>
            <Text style={[styles.matrixCellText, { flex: 1.3 }]}>Email</Text>
          </View>
        </View>

        {/* Upgrade Action Button */}
        <Pressable
          style={[styles.subscribeBtn, (isSubscribing || loadingPlans) && styles.subscribeBtnDisabled]}
          onPress={handleSubscribe}
          disabled={isSubscribing || loadingPlans}
        >
          <Crown size={20} color="#FFFFFF" />
          <Text style={styles.subscribeBtnText}>
            {isSubscribing
              ? 'Processing Payment...'
              : `Subscribe to ${activePlan?.name || 'Plan'} • ${activePlan?.price || ''}`}
          </Text>
        </Pressable>

        <Text style={styles.guaranteeText}>
          256-Bit Encrypted Secure Checkout. Cancel anytime in App Settings.
        </Text>
      </ScrollView>

      <RazorpayModal
        visible={showRazorpayModal}
        orderData={razorpayOrder}
        onClose={() => {
          setShowRazorpayModal(false);
          setIsSubscribing(false);
        }}
        onSuccess={handleRazorpaySuccess}
        onFailure={handleRazorpayFailure}
      />
    </SafeAreaView>
  );
}
