declare const process: any;

let initialCreatorId = 1;
if (typeof process !== 'undefined' && process.env && process.env.CREATOR_ID) {
  const parsed = typeof process.env.CREATOR_ID === 'number'
    ? process.env.CREATOR_ID
    : parseInt(String(process.env.CREATOR_ID), 10);
  if (!isNaN(parsed) && parsed > 0) {
    initialCreatorId = parsed;
  }
}

let currentCreatorId: number = initialCreatorId;
let onCreatorIdChangeListener: ((newId: number) => void) | null = null;

export function registerCreatorIdListener(listener: (newId: number) => void): void {
  onCreatorIdChangeListener = listener;
}

export const API_BASE_URL = 'http://138.68.140.83:8000';
export const DEFAULT_AUTH_TOKEN = 'talentsea_secret_api_key_2026';
export const RAZORPAY_KEY_ID = 'rzp_test_TZdrjdhyuxCuaR';

export function getCreatorId(): number {
  return currentCreatorId;
}

export const CREATOR_ID = getCreatorId();

export function setCreatorId(id: number): void {
  if (typeof id === 'number' && !isNaN(id) && id > 0 && id !== currentCreatorId) {
    currentCreatorId = id;
    if (onCreatorIdChangeListener) {
      onCreatorIdChangeListener(id);
    }
  }
}

/**
 * Default ad tag URL (set to undefined so only adTagUrls explicitly returned by backend API are used).
 */
export const DEFAULT_AD_TAG_URL = undefined;