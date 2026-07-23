import { requireNativeComponent } from 'react-native';

/**
 * Isolated in its own module so Metro HMR doesn't re-execute
 * requireNativeComponent() and trigger "two views with the same name".
 */
export const RCTNativeVideoPlayer = requireNativeComponent<any>('NativeVideoPlayer');
