import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

const DEVICE_ID_FILE_PATH = `${RNFS.DocumentDirectoryPath}/device_id_v1.txt`;
let cachedDeviceId: string | null = null;

function generateRandomUUID(): string {
  // Simple RFC4122 v4 compliant UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getOrCreateDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

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
    console.warn('[deviceIdHelper] Failed to read device_id file:', err);
  }

  const newDeviceId = generateRandomUUID();
  cachedDeviceId = newDeviceId;

  try {
    await RNFS.writeFile(DEVICE_ID_FILE_PATH, newDeviceId, 'utf8');
  } catch (err) {
    console.warn('[deviceIdHelper] Failed to persist device_id file:', err);
  }

  return newDeviceId;
}

export function getDeviceInfo(): string {
  const osName = Platform.OS === 'ios' ? 'iOS' : 'Android';
  const osVersion = Platform.Version;
  const deviceModel = Platform.OS === 'ios' ? 'iPhone Mobile' : 'Android Mobile';
  return `${deviceModel} (${osName} ${osVersion})`;
}
