import { useAppTheme } from '../../context/ThemeContext';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
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
import {
  activateSubscription,
  getCurrentUser,
  getUserSubscriptionTier,
  isUserSubscribed,
} from '../../services/api/authService';
import {
  createRazorpayOrder,
  createSubscription,
  fetchSubscriptionPlans,
  fetchUserSubscriptionStatus,
  LiveSubscriptionDTO,
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
  const { theme } = useAppTheme();

  const user = getCurrentUser();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState<boolean>(false);
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);
  const [liveSub, setLiveSub] = useState<LiveSubscriptionDTO | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPlans() {
      try {
        setLoadingPlans(true);
        const [data, status] = await Promise.all([
          fetchSubscriptionPlans(),
          fetchUserSubscriptionStatus().catch(() => null),
        ]);
        if (isMounted && status?.subscription) {
          setLiveSub(status.subscription);
        }
        if (isMounted && data.length > 0) {
          setPlans(data);
          const currentUserPlanId = user?.plan_id ? String(user.plan_id) : '';
          if (currentUserPlanId && data.some(p => p.id === currentUserPlanId)) {
            setSelectedPlanId(currentUserPlanId);
          } else {
            const popular = data.find(p => p.popular) || data[0];
            setSelectedPlanId(popular.id);
          }
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

  const [latestPayload, setLatestPayload] = useState<RazorpaySuccessPayload | null>(null);

  const handleRazorpaySuccess = async (payload: RazorpaySuccessPayload) => {
    setShowRazorpayModal(false);
    setLatestPayload(payload);
    const chosenPlan = plans.find(p => p.id === selectedPlanId);
    const planName = chosenPlan ? chosenPlan.name : 'VIP Member Plan';

    // 1. Immediately activate VIP subscription locally to unlock video playback
    const isPrem = selectedPlanId === '2' || planName.toLowerCase().includes('premium');
    activateSubscription(isPrem ? 'premium' : 'subscriber', planName, selectedPlanId);
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
        `Payment verified successfully!\n\nPayment ID: ${payload.razorpay_payment_id}\n\nYou now have full access to stream all 4K videos.`,
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
        `Payment Authorized!\n\nPayment ID: ${payload.razorpay_payment_id}\n\nYou now have full access to stream all 4K videos.`,
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

  const userIsSub = Boolean(liveSub?.plan_name && liveSub.plan_name !== 'Free Plan') || isUserSubscribed();
  const subTier = getUserSubscriptionTier();
  const currentPlanName = liveSub?.plan_name || (userIsSub ? (subTier === 'premium' ? 'Premium Ad-Free' : 'Standard with Ads') : (user?.chosen_plan || 'Free Plan'));

  const matchedPlan = plans.find(p =>
    p.id === String(liveSub?.plan_id || user?.plan_id) ||
    p.name.toLowerCase() === currentPlanName.toLowerCase() ||
    (currentPlanName.toLowerCase().includes('premium') && p.name.toLowerCase().includes('premium')) ||
    (currentPlanName.toLowerCase().includes('standard') && p.name.toLowerCase().includes('standard'))
  );

  const currentFeatures: string[] = matchedPlan?.features && matchedPlan.features.length > 0
    ? matchedPlan.features
    : userIsSub
      ? [
          'Full video catalog access',
          'High definition (1080p Full HD) streaming',
          '100% Ad-free uninterrupted playback',
          'Offline mobile video downloads',
          'Up to 3 concurrent device screens',
          'Priority access to newly released content',
        ]
      : [
          'Full creator video catalog access',
          'Standard definition (720p HD) streaming',
          'Ad-supported viewing experience',
          '1 active device stream',
          'Watch history and personalized recommendations',
        ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.mainBackgroundColor }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.primaryTextColor} size={20} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>Subscription Plans</Text>
          <Text style={{ color: theme.mutedTextColor, fontSize: 11, marginTop: 2 }}>
            Choose a plan to unlock premium streaming
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.crownIconBadge}>
            <Crown size={28} color={theme.primaryTextColor} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>Unlock Premium Creator Tiers</Text>
          <Text style={[styles.heroSubtitle, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>
            Choose a tier to access exclusive content, 4K streaming, downloads, and direct Q&A.
          </Text>
        </View>

        {isSuccess ? (
          <View style={styles.successCard}>
            <CheckCircle2 size={36} color="#10B981" />
            <Text style={[styles.successTitle, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>Active VIP Subscriber</Text>
            <Text style={[styles.successSub, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>
              Your account ({user?.email || 'User'}) is active with Unlimited 4K Ultra HD access.
            </Text>

            {latestPayload ? (
              <View style={{
                width: '100%',
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderRadius: 12,
                padding: 12,
                marginTop: 14,
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.3)',
              }}>
                <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 }}>
                  🛡️ PAYMENT RECEIPT
                </Text>

                <View style={{ marginBottom: 2 }}>
                  <Text style={{ color: theme.mutedTextColor, fontSize: 10, fontWeight: '700' }}>PAYMENT ID:</Text>
                  <Text style={{ color: theme.primaryTextColor, fontSize: 13, fontWeight: '700', marginTop: 2 }}>{latestPayload.razorpay_payment_id}</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Plan Selection */}
        <Text style={[styles.sectionTitle, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>Select Your Membership Plan</Text>

        {loadingPlans ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={{ color: theme.mutedTextColor, fontSize: 12, marginTop: 8 }}>
              Loading creator subscription plans...
            </Text>
          </View>
        ) : (
          plans.map(plan => {
            const isSelected = selectedPlanId === plan.id;
            const badgeLabel = plan.badgeTag || (plan.popular ? 'Best Value' : plan.savings);

            return (
              <Pressable
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardActive]}
                onPress={() => setSelectedPlanId(plan.id)}
              >
                {/* Header Badge */}
                {badgeLabel && (
                  <View style={styles.popularBadge}>
                    <Text style={[styles.popularBadgeText, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>{badgeLabel}</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginRight: 8 }}>
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                        { marginTop: 2 },
                      ]}
                    >
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.planName, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>{plan.name}</Text>
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
                        <Text style={{ color: theme.mutedTextColor, fontSize: 11, marginTop: 2 }} numberOfLines={2}>
                          {plan.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                    <View style={styles.priceRow}>
                      {plan.originalPrice ? (
                        <Text style={{
                          color: '#6B7280',
                          fontSize: 13,
                          textDecorationLine: 'line-through',
                          marginRight: 4,
                          fontWeight: '600',
                        }}>
                          {plan.originalPrice}
                        </Text>
                      ) : null}
                      <Text style={[styles.planPrice, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>{plan.price}</Text>
                      <Text style={[styles.planPeriod, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>{plan.period}</Text>
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

                {/* Features List */}
                {plan.features && plan.features.length > 0 && (
                  <View style={{ marginTop: 6, gap: 4 }}>
                    <Text style={{ color: '#818CF8', fontSize: 11, fontWeight: '700', marginBottom: 2 }}>
                      Included Features:
                    </Text>
                    {plan.features.map((feat, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Check size={14} color="#10B981" />
                        <Text style={{ color: '#D1D5DB', fontSize: 12, flex: 1 }}>{feat}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })
        )}

        {/* Current Plan : Plan Features */}
        <Text style={[styles.sectionTitle, { marginTop: 18, color: theme.primaryTextColor }]}>
          Current Plan : Plan features
        </Text>

        <View
          style={[
            styles.currentPlanCard,
            {
              backgroundColor: theme.cardBackgroundColor,
              borderColor: userIsSub ? '#10B981' : 'rgba(255,255,255,0.08)',
            },
          ]}
        >
          <View style={styles.currentPlanHeader}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={[styles.currentPlanName, { color: theme.primaryTextColor }]}>
                  {currentPlanName}
                </Text>
                <View
                  style={[
                    styles.currentPlanBadge,
                    {
                      backgroundColor: userIsSub ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                      borderColor: userIsSub ? '#10B981' : '#6366F1',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: userIsSub ? '#10B981' : '#818CF8',
                      fontSize: 10,
                      fontWeight: '800',
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {userIsSub ? 'ACTIVE SUBSCRIBER' : 'FREE TIER'}
                  </Text>
                </View>
              </View>

              {liveSub?.days_remaining ? (
                <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                  ⏳ {liveSub.days_remaining} days remaining in current billing cycle
                </Text>
              ) : (
                <Text style={{ color: theme.mutedTextColor, fontSize: 12, marginTop: 4 }}>
                  {userIsSub ? 'Auto-renewing membership active' : 'Ad-supported free access'}
                </Text>
              )}
            </View>

            <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
              <Text style={[styles.currentPlanPrice, { color: theme.primaryTextColor }]}>
                {matchedPlan?.price || (userIsSub ? '₹199' : '₹0')}
              </Text>
              <Text style={{ color: theme.mutedTextColor, fontSize: 11 }}>
                {matchedPlan?.period || (userIsSub ? '/month' : 'Free Forever')}
              </Text>
            </View>
          </View>

          <View style={[styles.currentPlanDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />

          <Text style={{ color: theme.primaryTextColor, fontSize: 13, fontWeight: '700', marginBottom: 10 }}>
            Plan Features:
          </Text>

          <View style={{ gap: 8 }}>
            {currentFeatures.map((feat, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={16} color={userIsSub ? '#10B981' : '#6366F1'} />
                <Text style={{ color: theme.primaryTextColor, fontSize: 13, flex: 1, lineHeight: 18 }}>
                  {feat}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upgrade Action Button */}
        <Pressable
          style={[styles.subscribeBtn, (isSubscribing || loadingPlans) && styles.subscribeBtnDisabled]}
          onPress={handleSubscribe}
          disabled={isSubscribing || loadingPlans}
        >
          <Crown size={20} color={theme.primaryTextColor} />
          <Text style={[styles.subscribeBtnText, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>
            {isSubscribing
              ? 'Processing Payment...'
              : (user?.plan_id && String(user.plan_id) !== selectedPlanId
                  ? `Upgrade to ${activePlan?.name || 'Plan'} • ${activePlan?.price || ''}`
                  : `Subscribe to ${activePlan?.name || 'Plan'} • ${activePlan?.price || ''}`)}
          </Text>
        </Pressable>

        <Text style={[styles.guaranteeText, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>
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
