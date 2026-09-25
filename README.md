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
=======
