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
  CheckCircle2,
  Crown,
  Download,
  ShieldCheck,
  Sparkles,
  Tv,
  Zap,
} from 'lucide-react-native';
import { activateSubscription, getCurrentUser } from '../../services/api/authService';
import {
  createSubscription,
  fetchSubscriptionPlans,
  SubscriptionPlan,
} from '../../services/api/subscriptionApi';
import { styles } from './styles';

export function SubscriptionScreen({ navigation }: any) {
  const user = getCurrentUser();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

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
      await createSubscription(selectedPlanId);
      activateSubscription('subscriber');
      setIsSubscribing(false);
      setIsSuccess(true);
      Alert.alert(
        'VIP Activated!',
        'Thank you for upgrading! You now have unrestricted 4K streaming access.',
        [
          {
            text: 'Start Watching',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (err) {
      setIsSubscribing(false);
      Alert.alert('Subscription Failed', 'Could not complete subscription. Please try again.');
    }
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
        <Text style={styles.headerTitle}>VIP Subscription</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.crownIconBadge}>
            <Crown size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>Unlock Unlimited VIP Access</Text>
          <Text style={styles.heroSubtitle}>
            Stream thousands of high-definition movies & original series with zero ads.
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
            return (
              <Pressable
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardActive]}
                onPress={() => setSelectedPlanId(plan.id)}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>
                      Best Value {plan.savings ? `• ${plan.savings}` : ''}
                    </Text>
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
                    <Text style={styles.planName}>{plan.name}</Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                </View>

                <Text style={styles.planDesc}>{plan.description}</Text>
              </Pressable>
            );
          })
        )}

        {/* Premium Features Checklist */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>What's Included</Text>

        <View style={styles.featureListContainer}>
          <View style={styles.featureRow}>
            <Sparkles size={18} color="#6366F1" />
            <Text style={styles.featureText}>Ad-free 4K Ultra HD & HDR Streaming</Text>
          </View>
          <View style={styles.featureRow}>
            <Download size={18} color="#10B981" />
            <Text style={styles.featureText}>Unlimited Offline Downloads</Text>
          </View>
          <View style={styles.featureRow}>
            <Tv size={18} color="#F59E0B" />
            <Text style={styles.featureText}>Stream on TV, Mobile, Tablet & Web</Text>
          </View>
          <View style={styles.featureRow}>
            <Zap size={18} color="#EC4899" />
            <Text style={styles.featureText}>Early access to new creator releases</Text>
          </View>
          <View style={styles.featureRow}>
            <ShieldCheck size={18} color="#818CF8" />
            <Text style={styles.featureText}>Cancel or modify subscription anytime</Text>
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
              : `Upgrade Now • ${activePlan?.price || ''}`}
          </Text>
        </Pressable>

        <Text style={styles.guaranteeText}>
          256-Bit Encrypted Secure Checkout. Cancel anytime in App Settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
