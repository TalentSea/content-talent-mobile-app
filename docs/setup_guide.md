# Streamr Mobile App Setup Guide

This guide outlines setup, environment configuration, and execution instructions for the Streamr React Native Mobile App.

## Prerequisites

- **Node.js**: `v18.x` or higher
- **Java Development Kit (JDK)**: JDK 17
- **Android Studio & SDK**: Android 14 (API Level 34)
- **React Native CLI**: installed globally or executed via `npx`

## Environment Configuration

Create a `.env` file in the root directory `projectvideo-frontend/.env`:

```env
# Selected Creator ID (Default: 2)
EXPO_PUBLIC_CREATOR_ID=2
REACT_APP_CREATOR_ID=2

# FastAPI Backend Base URL
REACT_APP_API_BASE_URL=http://138.68.140.83:8000

# Razorpay Test Key ID
REACT_APP_RAZORPAY_KEY_ID=rzp_test_TZdrjdhyuxCuaR
```

To switch creators, update `EXPO_PUBLIC_CREATOR_ID=1` or `EXPO_PUBLIC_CREATOR_ID=2` in `.env`.

## Installation & Launch

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Metro Bundler**:
   ```bash
   npm start
   ```

3. **Launch on Android Emulator / Physical Device**:
   ```bash
   npm run android
   # or
   npx react-native run-android
   ```

4. **Building Android APK / Release Bundle**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

## Useful Helper Scripts

- `emulator.bat`: Run from Windows Command Prompt to interactively pick and launch installed Android AVD emulators.