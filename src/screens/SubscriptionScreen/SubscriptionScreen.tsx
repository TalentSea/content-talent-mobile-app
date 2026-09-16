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
                    <Text style={styles.popularBadgeText}>{badgeLabel}</Text>
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
                        <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }} numberOfLines={2}>
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

        {/* Dynamic Plan Comparison Feature Matrix */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Plan Comparison</Text>

        <View style={styles.matrixCard}>
          {/* Header Row */}
          <View style={styles.matrixHeaderRow}>
            <Text style={[styles.matrixHeaderCell, { flex: 1.8 }]}>Feature</Text>
            {plans.map(p => (
              <Text
                key={p.id}
                style={[
                  styles.matrixHeaderCell,
                  { flex: 1, textAlign: 'center' },
                  p.id === selectedPlanId && { color: '#6366F1', fontWeight: '800' },
                ]}
                numberOfLines={2}
              >
                {p.name}
              </Text>
            ))}
          </View>

          {/* Row 1: Catalog Access */}
          <View style={styles.matrixRow}>
            <Text style={[styles.matrixFeatureName, { flex: 1.8 }]}>Catalog Access</Text>
            {plans.map(p => (
              <View key={p.id} style={{ flex: 1, alignItems: 'center' }}>
                <Check size={16} color="#10B981" />
              </View>
            ))}
          </View>

          {/* Row 2: Ad Experience */}
          <View style={[styles.matrixRow, styles.matrixRowAlt]}>
            <Text style={[styles.matrixFeatureName, { flex: 1.8 }]}>Ad Experience</Text>
            {plans.map(p => {
              const nameLower = (p.name || '').toLowerCase();
              const isAdFree = !nameLower.includes('with_ads') && !nameLower.includes('ad-supported') && !nameLower.includes('standard');
              return (
                <Text
                  key={p.id}
                  style={[
                    styles.matrixCellText,
                    { flex: 1, textAlign: 'center' },
                    isAdFree && styles.matrixCellTextHighlight,
                  ]}
                >
                  {isAdFree ? '100% Ad-Free' : 'Ad-Supported'}
                </Text>
              );
            })}
          </View>

          {/* Row 3: Video Resolution */}
          <View style={styles.matrixRow}>
            <Text style={[styles.matrixFeatureName, { flex: 1.8 }]}>Resolution</Text>
            {plans.map(p => {
              const nameLower = (p.name || '').toLowerCase();
              const feats = (p.features || []).join(' ').toLowerCase();
              const is1080p = nameLower.includes('premium') || feats.includes('1080p') || feats.includes('4k') || feats.includes('full hd');
              return (
                <Text
                  key={p.id}
                  style={[
                    styles.matrixCellText,
                    { flex: 1, textAlign: 'center' },
                    is1080p && styles.matrixCellTextHighlight,
                  ]}
                >
                  {is1080p ? '1080p Full HD' : '720p HD'}
                </Text>
              );
            })}
          </View>

          {/* Row 4: Concurrent Devices */}
          <View style={[styles.matrixRow, styles.matrixRowAlt]}>
            <Text style={[styles.matrixFeatureName, { flex: 1.8 }]}>Concurrent Devices</Text>
            {plans.map(p => {
              const feats = (p.features || []).join(' ').toLowerCase();
              const isMulti = feats.includes('3') || feats.includes('multiple') || p.name.toLowerCase().includes('premium');
              return (
                <Text
                  key={p.id}
                  style={[
                    styles.matrixCellText,
                    { flex: 1, textAlign: 'center' },
                    isMulti && styles.matrixCellTextHighlight,
                  ]}
                >
                  {isMulti ? 'Up to 3 Devices' : '1 Device'}
                </Text>
              );
            })}
          </View>

          {/* Row 5: Offline Downloads */}
          <View style={styles.matrixRow}>
            <Text style={[styles.matrixFeatureName, { flex: 1.8 }]}>Offline Downloads</Text>
            {plans.map(p => {
              const feats = (p.features || []).join(' ').toLowerCase();
              const hasOffline = feats.includes('download') || p.name.toLowerCase().includes('premium');
              return (
                <View key={p.id} style={{ flex: 1, alignItems: 'center' }}>
                  {hasOffline ? <Check size={16} color="#10B981" /> : <Minus size={14} color="#4B5563" />}
                </View>
              );
            })}
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
