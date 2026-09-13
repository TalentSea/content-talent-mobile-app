import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonItem({
  width = '100%',
  height = 20,
  borderRadius = 6,
  style,
}: SkeletonProps) {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: '#1E293B',
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

/**
 * Hotstar Hero Banner Skeleton Placeholder
 */
export function HeroSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 20 }}>
      <SkeletonItem width="100%" height={210} borderRadius={16} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 12 }}>
        <SkeletonItem width={80} height={32} borderRadius={20} />
        <SkeletonItem width={120} height={32} borderRadius={20} />
        <SkeletonItem width={80} height={32} borderRadius={20} />
      </View>
    </View>
  );
}

/**
 * Hotstar Horizontal Section Row Skeleton (e.g. Recently Added, Popular)
 */
export function HorizontalRowSkeleton({ titleWidth = 140 }: { titleWidth?: number }) {
  return (
    <View style={{ marginBottom: 24, paddingLeft: 16 }}>
      <SkeletonItem width={titleWidth} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 140 }}>
          <SkeletonItem width={140} height={190} borderRadius={10} />
          <SkeletonItem width={110} height={14} borderRadius={4} style={{ marginTop: 8 }} />
          <SkeletonItem width={70} height={10} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View style={{ width: 140 }}>
          <SkeletonItem width={140} height={190} borderRadius={10} />
          <SkeletonItem width={120} height={14} borderRadius={4} style={{ marginTop: 8 }} />
          <SkeletonItem width={80} height={10} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View style={{ width: 140 }}>
          <SkeletonItem width={140} height={190} borderRadius={10} />
          <SkeletonItem width={100} height={14} borderRadius={4} style={{ marginTop: 8 }} />
          <SkeletonItem width={60} height={10} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
}

/**
 * Hotstar Categories Grid Skeleton (2-column cards)
 */
export function CategoryGridSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
        <SkeletonItem width="48%" height={90} borderRadius={12} />
        <SkeletonItem width="48%" height={90} borderRadius={12} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
        <SkeletonItem width="48%" height={90} borderRadius={12} />
        <SkeletonItem width="48%" height={90} borderRadius={12} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
        <SkeletonItem width="48%" height={90} borderRadius={12} />
        <SkeletonItem width="48%" height={90} borderRadius={12} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
        <SkeletonItem width="48%" height={90} borderRadius={12} />
        <SkeletonItem width="48%" height={90} borderRadius={12} />
      </View>
    </View>
  );
}
