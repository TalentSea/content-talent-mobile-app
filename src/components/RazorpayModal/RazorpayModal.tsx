import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CreditCard, QrCode, Shield, X } from 'lucide-react-native';
import { styles } from './styles';

export type RazorpaySuccessPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayModalProps = {
  visible: boolean;
  orderData: {
    order_id: string;
    amount: number;
    currency: string;
    key_id: string;
    plan_name?: string;
  } | null;
  onClose: () => void;
  onSuccess: (payload: RazorpaySuccessPayload) => void;
  onFailure: (errorMsg: string) => void;
};

export function RazorpayModal({
  visible,
  orderData,
  onClose,
  onSuccess,
  onFailure,
}: RazorpayModalProps) {
  const [activeTab, setActiveTab] = useState<'netbanking' | 'card' | 'upi'>('netbanking');
  const [selectedBank, setSelectedBank] = useState<string>('HDFC');
  const [upiId, setUpiId] = useState<string>('success@razorpay');
  const [cardNumber, setCardNumber] = useState<string>('4111 1111 1111 1111');
  const [expiry, setExpiry] = useState<string>('12/28');
  const [cvv, setCvv] = useState<string>('123');
  const [otp, setOtp] = useState<string>('123456');
  const [cardHolder, setCardHolder] = useState<string>('Test Subscriber');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!visible || !orderData) return null;

  const formattedAmount = orderData.amount
    ? (orderData.amount > 1000 ? `₹${(orderData.amount / 100).toLocaleString('en-IN')}` : `₹${orderData.amount}`)
    : '₹1,999.20';

  const handlePaySuccess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const timestamp = Date.now().toString();
      const mockPaymentId = `pay_${timestamp.slice(-10)}`;
      const mockSignature = `sig_hmac_sha256_${timestamp}_valid`;

      onSuccess({
        razorpay_order_id: orderData.order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
      });
    }, 1000);
  };

  const handlePayFailure = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onFailure('Payment failed: Bank transaction declined by user or server.');
    }, 600);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.rzpLogoBadge}>
                <Text style={styles.rzpLogoText}>Razorpay</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>Razorpay Checkout</Text>
                <View style={styles.testBadge}>
                  <Text style={styles.testBadgeText}>TEST MODE</Text>
                </View>
              </View>
            </View>

            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <View>
              <Text style={styles.orderSummaryLabel}>MEMBERSHIP PLAN</Text>
              <Text style={styles.orderPlanName}>{orderData.plan_name || 'VIP Member Subscription'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.orderAmount}>{formattedAmount}</Text>
              <Text style={styles.orderKeyId}>{orderData.key_id || 'rzp_test_TRDlW57SfahBup'}</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <Pressable
              style={[styles.tab, activeTab === 'netbanking' && styles.tabActive]}
              onPress={() => setActiveTab('netbanking')}
            >
              <Text style={[styles.tabText, activeTab === 'netbanking' && styles.tabTextActive]}>
                NetBanking
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'card' && styles.tabActive]}
              onPress={() => setActiveTab('card')}
            >
              <Text style={[styles.tabText, activeTab === 'card' && styles.tabTextActive]}>
                Card
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'upi' && styles.tabActive]}
              onPress={() => setActiveTab('upi')}
            >
              <Text style={[styles.tabText, activeTab === 'upi' && styles.tabTextActive]}>
                UPI / GPay
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {activeTab === 'netbanking' ? (
              <View>
                <Text style={styles.label}>Select Test Bank</Text>
                <View style={styles.quickOptionsContainer}>
                  {['HDFC', 'ICICI', 'SBI', 'AXIS'].map(bank => (
                    <Pressable
                      key={bank}
                      style={[styles.quickChip, selectedBank === bank && styles.quickChipActive]}
                      onPress={() => setSelectedBank(bank)}
                    >
                      <Text style={[styles.quickChipText, selectedBank === bank && styles.quickChipTextActive]}>
                        {bank} Bank
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Razorpay Test Bank Simulator Component */}
                <View style={styles.simulatorBox}>
                  <View style={styles.simulatorHeader}>
                    <Text style={styles.simulatorTitle}>🏦 Razorpay Test Bank</Text>
                    <Text style={styles.simulatorSubtext}>Simulation Page</Text>
                  </View>
                  <Text style={[styles.infoText, { marginBottom: 12 }]}>
                    Select an action below to complete authorization for {selectedBank} Bank:
                  </Text>
                  <View style={styles.simulatorActions}>
                    <Pressable
                      style={styles.successBtn}
                      onPress={handlePaySuccess}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.successBtnText}>[ Success ]</Text>
                      )}
                    </Pressable>

                    <Pressable
                      style={styles.failureBtn}
                      onPress={handlePayFailure}
                      disabled={isProcessing}
                    >
                      <Text style={styles.failureBtnText}>[ Failure ]</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : activeTab === 'card' ? (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Card Number (Test)</Text>
                  <TextInput
                    style={styles.input}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Expiry (MM/YY)</Text>
                    <TextInput
                      style={styles.input}
                      value={expiry}
                      onChangeText={setExpiry}
                      placeholder="12/28"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      value={cvv}
                      onChangeText={setCvv}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={4}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>3D-Secure OTP</Text>
                  <TextInput
                    style={styles.input}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    placeholder="Enter 123456"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <Pressable
                  style={[styles.payButton, isProcessing && styles.payButtonDisabled, { marginTop: 10 }]}
                  onPress={handlePaySuccess}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.payButtonText}>
                      Submit / Authorize {formattedAmount}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={labelStyle}>Enter Test VPA / UPI ID</Text>
                  <TextInput
                    style={styles.input}
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="e.g. success@razorpay"
                    placeholderTextColor="#64748B"
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.label}>Quick Test Credentials</Text>
                <View style={styles.quickOptionsContainer}>
                  <Pressable
                    style={[styles.quickChip, upiId === 'success@razorpay' && styles.quickChipActive]}
                    onPress={() => setUpiId('success@razorpay')}
                  >
                    <Text style={[styles.quickChipText, upiId === 'success@razorpay' && styles.quickChipTextActive]}>
                      ✓ success@razorpay
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.quickChip, upiId === 'failure@razorpay' && styles.quickChipActive]}
                    onPress={() => setUpiId('failure@razorpay')}
                  >
                    <Text style={[styles.quickChipText, upiId === 'failure@razorpay' && styles.quickChipTextActive]}>
                      ✗ failure@razorpay
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  style={[styles.payButton, isProcessing && styles.payButtonDisabled, { marginTop: 16 }]}
                  onPress={upiId === 'failure@razorpay' ? handlePayFailure : handlePaySuccess}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.payButtonText}>
                      Pay {formattedAmount} via UPI
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const labelStyle = styles.label;
