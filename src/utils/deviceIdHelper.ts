import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

let DeviceInfo: any = null;
try {
  const mod = require('react-native-device-info');
  DeviceInfo = mod?.default || mod;
} catch (e) {
  // Safe fallback if native module is not linked
}

const DEVICE_ID_FILE_PATH = `${RNFS.DocumentDirectoryPath}/device_id_v1.txt`;
let cachedDeviceId: string | null = null;
let cachedDeviceInfo: string | null = null;

function generateRandomUUID(): string {
  // Simple RFC4122 v4 compliant UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns an anonymous, privacy-compliant unique device_id using react-native-device-info:
 * - On Android: ANDROID_ID (e.g. "f123456789abcdef")
 * - On iOS: Apple's IDFV (Identifier for Vendor, e.g. "2C7507B3-85FF-45AC-B139-44F491ACBF13")
 * - Fallback: Persisted UUID in app documents directory
 */
export async function getOrCreateDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  // 1. Primary: react-native-device-info getUniqueId()
  try {
    if (typeof DeviceInfo.getUniqueId === 'function') {
      const uniqueId = await DeviceInfo.getUniqueId();
      if (uniqueId && typeof uniqueId === 'string' && uniqueId.trim().length > 0 && uniqueId !== 'unknown') {
        cachedDeviceId = uniqueId.trim();
        return cachedDeviceId;
      }
    }
  } catch (err) {
    console.warn('[deviceIdHelper] DeviceInfo.getUniqueId notice:', err);
  }

  // 2. Try synchronous version if available
  try {
    if (typeof (DeviceInfo as any).getUniqueIdSync === 'function') {
      const syncId = (DeviceInfo as any).getUniqueIdSync();
      if (syncId && typeof syncId === 'string' && syncId.trim().length > 0 && syncId !== 'unknown') {
        cachedDeviceId = syncId.trim();
        return cachedDeviceId;
      }
    }
  } catch (err) {
    // ignore
  }

  // 3. Fallback: Read previously persisted ID
  try {
    const exists = await RNFS.exists(DEVICE_ID_FILE_PATH);
    if (exists) {
      const storedId = await RNFS.readFile(DEVICE_ID_FILE_PATH, 'utf8');
      if (storedId && storedId.trim().length > 0) {
        cachedDeviceId = storedId.trim();
        return cachedDeviceId;
      }
    }
  } catch (err) {
    console.warn('[deviceIdHelper] Failed to read fallback device_id file:', err);
  }

  // 4. Generate persistent UUID fallback if native API is unavailable
  const newDeviceId = generateRandomUUID();
  cachedDeviceId = newDeviceId;

  try {
    await RNFS.writeFile(DEVICE_ID_FILE_PATH, newDeviceId, 'utf8');
  } catch (err) {
    console.warn('[deviceIdHelper] Failed to persist fallback device_id file:', err);
  }

  return newDeviceId;
}

/**
 * Synchronous device_id getter
 */
export function getDeviceIdSync(): string {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }
  try {
    if (typeof (DeviceInfo as any).getUniqueIdSync === 'function') {
      const syncId = (DeviceInfo as any).getUniqueIdSync();
      if (syncId && typeof syncId === 'string' && syncId.trim().length > 0 && syncId !== 'unknown') {
        cachedDeviceId = syncId.trim();
        return cachedDeviceId;
      }
    }
  } catch (e) {
    // ignore
  }
  return 'unknown-device';
}

/**
 * Returns formatted device info string using react-native-device-info:
 * e.g. "Google Pixel 7 (Android 14)" or "Apple iPhone 15 Pro (iOS 17.2)"
 */
export function getDeviceInfo(): string {
  if (cachedDeviceInfo) {
    return cachedDeviceInfo;
  }

  try {
    const brand = typeof (DeviceInfo as any).getBrand === 'function' ? (DeviceInfo as any).getBrand() : '';
    const model = typeof (DeviceInfo as any).getModel === 'function' ? (DeviceInfo as any).getModel() : '';
    const systemName = typeof (DeviceInfo as any).getSystemName === 'function'
      ? (DeviceInfo as any).getSystemName()
      : (Platform.OS === 'ios' ? 'iOS' : 'Android');
    const systemVersion = typeof (DeviceInfo as any).getSystemVersion === 'function'
      ? (DeviceInfo as any).getSystemVersion()
      : Platform.Version;

    const brandStr = brand && brand.toLowerCase() !== 'unknown' ? brand : '';
    const modelStr = model && model.toLowerCase() !== 'unknown'
      ? model
      : (Platform.OS === 'ios' ? 'iPhone' : 'Android Device');

    // Combine brand + model without duplicating brand name
    const deviceName = brandStr && !modelStr.toLowerCase().includes(brandStr.toLowerCase())
      ? `${brandStr} ${modelStr}`.trim()
      : modelStr.trim();

    cachedDeviceInfo = `${deviceName} (${systemName} ${systemVersion})`;
    return cachedDeviceInfo;
  } catch (err) {
    console.warn('[deviceIdHelper] getDeviceInfo notice:', err);
    const osName = Platform.OS === 'ios' ? 'iOS' : 'Android';
    const osVersion = Platform.Version;
    const deviceModel = Platform.OS === 'ios' ? 'iPhone Mobile' : 'Android Mobile';
    return `${deviceModel} (${osName} ${osVersion})`;
  }
}

