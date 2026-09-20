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

export const API_BASE_URL =
  typeof process !== 'undefined' && process.env && process.env.API_BASE_URL
    ? process.env.API_BASE_URL
    : 'https://mc-8b2il1t9co.bunny.run';
export const DEFAULT_AUTH_TOKEN = 'talentsea_secret_api_key_2026';
export const RAZORPAY_KEY_ID = 'rzp_test_TZdrjdhyuxCuaR';
export const FACEBOOK_APP_ID = '3169763853213963';
export const FACEBOOK_APP_SECRET = 'bd826b0a4867d0c7033c8f40cc5737dc';

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