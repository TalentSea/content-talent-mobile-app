import { Platform, Vibration } from 'react-native';

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success';

/**
 * Universal haptic vibration helper using React Native's native Vibration API.
 * Protected against missing permissions, unlinked modules, and emulator crashes.
 */
export function triggerHaptic(type: HapticType = 'light') {
  try {
    if (!Vibration || typeof Vibration.vibrate !== 'function') return;

    if (Platform.OS === 'android') {
      switch (type) {
        case 'light':
        case 'selection':
          Vibration.vibrate(10);
          break;
        case 'medium':
          Vibration.vibrate(20);
          break;
        case 'heavy':
          Vibration.vibrate(35);
          break;
        default:
          Vibration.vibrate(10);
      }
    } else {
      Vibration.vibrate(10);
    }
  } catch (err) {
    // Silently absorb to never interrupt the user experience
  }
}
