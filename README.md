<<<<<<< HEAD
This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.



=======
# projectvideo-frontend
>>>>>>> ddcaf0e9e75590a67581141a7045d4d4d888676e



projectvideo-frontend/
├── __tests__/                         # Frontend test files
│   └── App.test.tsx                   # Default React Native test for the app
├── android/                           # Native Android project files
│                                      # Contains Gradle config, Kotlin/Java files, AndroidManifest
│                             
├── ios/                               # Native iOS project files
│                                      # Xcode project and iOS native configuration
│
├── node_modules/                      # Installed npm packages
│                                      # Generated after npm install, should not be edited manually
│
├── docs/                              # Project documentation
│   ├── api_guide.md                   # Explains API endpoints used by the app
│   ├── architecture.md                # Explains folder structure and app architecture
│   ├── setup_guide.md                 # Explains how to install and run the app
│   └── testing_guide.md               # Explains how to run and write frontend tests
│
├── src/                               # Main application source code
│   │
│   ├── app/                           # Application root setup
│   │   ├── App.tsx                    # Main app component, loads navigation/providers
│   │   │
│   │   └── skills/                    # AI assistant instruction files
│   │       ├── adding-new-feature/
│   │       │   └── SKILL.md           # Checklist/rules for adding a new feature
│   │       ├── architecture/
│   │       │   └── SKILL.md           # Architecture rules and folder usage
│   │       ├── docker-workflow/
│   │       │   └── SKILL.md           # Docker build/run/debug instructions
│   │       └── testing-conventions/
│   │           └── SKILL.md           # Testing rules and naming conventions
│   │
│   ├── components/                    # Reusable UI components
│   │   │
│   │   ├── NativeVideoPlayer/          # Custom native video player wrapper
│   │   │   ├── index.ts               # Re-export file for cleaner imports
│   │   │   └── NativeVideoPlayer.tsx  # React Native wrapper around Android native player
│   │   │
│   │   ├── VideoCard/                 # Single video card UI
│   │   │   ├── index.ts               # Re-export file
│   │   │   ├── styles.ts              # Styles for VideoCard
│   │   │   └── VideoCard.tsx          # Displays thumbnail, title, category, status
│   │   │
│   │   └── VideoSection/              # Horizontal video list section
│   │       ├── index.ts               # Re-export file
│   │       ├── styles.ts              # Styles for VideoSection
│   │       └── VideoSection.tsx       # Shows section title, See all button, video row
│   │
│   ├── constants/                     # Shared app constants
│   │   ├── colors.ts                  # App color palette/theme values
│   │   └── config.ts                  # API base URL and app configuration
│   │
│   ├── hooks/                         # Reusable React hooks
│   │   ├── useVideo.ts                # Loads videos, refreshes list, separates ready/processing
│   │   └── useVideoPlayback.ts        # Handles selected video, play request, player modal state
│   │
│   ├── navigation/                    # Navigation configuration
│   │   ├── RootNavigator.tsx          # Defines app screens and stack navigator
│   │   └── types.ts                   # TypeScript navigation route types
│   │
│   ├── screens/                       # Full app screens/pages
│   │   │
│   │   ├── HomeScreen/                # Main home screen
│   │   │   ├── HomeScreen.tsx         # Shows app header, video sections, loading/error state
│   │   │   └── styles.ts              # Styles for HomeScreen
│   │   │
│   │   ├── PlayerScreen/              # Video player modal/screen
│   │   │   ├── PlayerModal.tsx        # Full-screen video modal using NativeVideoPlayer
│   │   │   └── styles.ts              # Styles for player screen/modal
│   │   │
│   │   └── VideoGridScreen/           # “See all” grid screen
│   │       ├── styles.ts              # Styles for grid screen
│   │       └── VideoGridScreen.tsx    # Displays all videos in selected section as a grid
│   │
│   ├── services/                      # External service and API logic
│   │   └── api/                       # Backend API client layer
│   │       ├── client.ts              # Shared fetch wrapper and error handling
│   │       └── video.ts               # Video API calls: list videos, get play URL
│   │
│   ├── types/                         # Shared TypeScript types
│   │   └── video.ts                   # ApiVideo, PlayInfo, video section types
│   │
│   └── utils/                         # Shared helper functions
│                                      # Example: formatTime, status formatting, validation helpers
│
├── .env.example                       # Example environment variables
├── .gitignore                         # Files/folders ignored by Git
├── App.tsx                            # Root export file, points to src/app/App.tsx
├── emulator.bat                       # Helper script to start Android emulator
├── index.js                           # React Native JavaScript entry point
├── package-lock.json                  # Exact installed npm dependency versions
├── package.json                       # Project dependencies and npm scripts
├── tsconfig.json                      # TypeScript configuration
├── docker-compose.yml                 
└── Dockerfile