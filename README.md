# Nugget React Native SDK

A React Native SDK for integrating Nugget's chat and support functionality into your mobile applications.

## Table of Contents
- [Requirements](#requirements)
- [Installation](#installation)
- [Setup](#setup)
  - [iOS Setup](#ios-setup)
  - [Android Setup](#android-setup)
- [Usage](#usage)
  - [Basic Implementation](#basic-implementation)
  - [Authentication](#authentication)
  - [Deep Linking](#deep-linking)
  - [Event Handling](#event-handling)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Requirements

- React Native version: 0.73.2 or higher
- iOS:
  - Minimum iOS version: 14.0
  - Xcode: Latest stable version
- Android:
  - compileSdkVersion: 35 or higher
  - Android Gradle Plugin (AGP): 8.2.0 or higher
  - Kotlin: 1.8.20 or higher
  - Gradle: 8.3 or higher

## Installation

```bash
npm install @nugget/react-native-sdk
# or
yarn add @nugget/react-native-sdk
```

## Setup

### iOS Setup
1. Add the following to your `Podfile`:
```ruby
pod 'NuggetRN', :path => '../node_modules/@nugget/react-native-sdk'
```

2. Install the pods:
```bash
cd ios && pod install
```

### Android Setup
No additional setup required for Android.

## Usage

### Basic Implementation

1. Initialize the NuggetModule:

```typescript
import { NuggetModule, NuggetPlugin, NativeEventEmitter } from '@nugget/react-native-sdk';

const nuggetModule = new NuggetModule();

// Initialize with default configuration
nuggetModule.initialize();
```

2. Configure SDK Settings:

```typescript
const defaultContext = {
  channelHandle: "your-channel",
  ticketGroupingId: "your-group-id",
  ticketProperties: {
    priority: ["high"],
    category: ["support"]
  },
  botProperties: {
    cp_device_id: ["device-id"],
    cp_auth_token: ["auth-token"]
  }
};

NuggetPlugin.initializeNuggetFactory(defaultContext);
```

### Authentication

Implement authentication by extending the NuggetModule class:

```typescript
class MyNuggetModule extends NuggetModule {
  async getAuthInfo(): Promise<{ [key: string]: any }> {
    return {
      clientID: YOUR_CLIENT_ID,
      accessToken: YOUR_ACCESS_TOKEN,
      userID: USER_ID,
      userName: USER_NAME,
      photoURL: USER_PHOTO_URL
    };
  }

  async refreshAuthInfo(): Promise<{ [key: string]: any }> {
    // Implement your token refresh logic here
    return this.getAuthInfo();
  }
}
```

### Deep Linking

The SDK supports deep linking functionality:

```typescript
// Check if a deeplink can be opened
const canOpen = await nuggetModule.canOpenDeeplink(deeplinkUrl);

// Open the SDK with a deeplink
if (canOpen) {
  const result = await nuggetModule.openNuggetSDK(deeplinkUrl);
}
```

### Event Handling

Subscribe to SDK events:

```typescript
const eventSubscription = nuggetModule.addListener('OnNativeRequest', 
  async (event) => {
    // Handle events
  }
);

// Clean up when component unmounts
nuggetModule.cleanup();
```

## API Reference

### NuggetModule Methods

| Method | Description | Parameters | Return Type |
|--------|-------------|------------|-------------|
| `initialize()` | Initializes the SDK | None | void |
| `getAuthInfo()` | Provides authentication information | None | Promise<Object> |
| `refreshAuthInfo()` | Refreshes authentication tokens | None | Promise<Object> |
| `canOpenDeeplink()` | Checks if a deeplink can be opened | `deeplink: string` | Promise<boolean> |
| `openNuggetSDK()` | Opens the SDK with a deeplink | `deeplink: string` | Promise<string> |
| `cleanup()` | Removes event listeners | None | void |

### Events

| Event Name | Description | Payload |
|------------|-------------|---------|
| `OnNativeRequest` | Triggered when native code requests data | `{ method: string, payload: any }` |

## Troubleshooting

Common issues and their solutions:

1. Module not found
   - Ensure proper installation
   - Clean and rebuild project

2. Authentication Errors
   - Verify clientID and accessToken
   - Check implementation of getAuthInfo()

3. Deep Linking Issues
   - Verify URL format
   - Check canOpenDeeplink() before opening

For additional support, please contact our support team or visit our documentation portal.

