# Nugget React Native SDK

A React Native SDK for integrating Nugget's functionality into your mobile applications.

## Requirements

- React Native version: 0.73.2 or higher
- iOS:
  - Minimum iOS version: 14.0
  - Xcode: Supported only till XCode 16.2
- Android:
  - compileSdkVersion: 35 or higher
  - Android Gradle Plugin (AGP): 8.2.0 or higher
  - Kotlin: 1.8.20 or higher
  - Gradle: 8.3 or higher

## Installation

```bash
yarn add nugget-sdk@https://github.com/pranavzmt/react-native-nugget-sdk.git
```

## Setup

### iOS Setup
1. Add the following to your `Podfile`:
```ruby
pod 'NuggetSDK', :git => 'https://github.com/Zomato-Nugget/nugget-sdk-ios', :tag => '0.0.8'
```

2. Install the pods:
```bash
cd ios && yarn install && pod install
```

### Android Setup
Not needed as of now.

## Usage

This section guides you through integrating and using the Nugget React Native SDK in your application.

### 1. Importing the SDK

First, import the necessary components from the `nugget-sdk` package:

```typescript
import { NuggetSDK, NuggetJumborConfiguration, NuggetAuthProvider, NuggetAuthUserInfo } from 'nugget-sdk';
```

### 2. Initializing the SDK

To use the SDK, you need to obtain an instance of the `NuggetSDK`. This is done by calling the static `getInstance` method. This method takes two arguments:
1.  `sdkConfiguration`: An object of type `NuggetJumborConfiguration` which requires a `nameSpace`.
2.  `chatSupportBusinessContext`: An object of type `NuggetChatBusinessContext` which can be used to provide additional, optional context for chat interactions.

The `NuggetSDK` is a singleton; calling `getInstance` multiple times with the same initial configuration parameters will return the same instance. The configuration (including `sdkConfiguration` and `chatSupportBusinessContext`) is applied only upon the first call when the instance is created.

**NuggetJumborConfiguration Interface:**
```typescript
export interface NuggetJumborConfiguration {
  nameSpace: string; // Your application's unique namespace
}
```

**NuggetChatBusinessContext Interface (all properties are optional):**
```typescript
export interface NuggetChatBusinessContext {
    channelHandle?: string;
    ticketGroupingId?: string;
    ticketProperties?: { [key: string]: string[] };
    botProperties?: { [key: string]: string[] };
}
```
This context helps in tailoring the chat experience, for example, by routing tickets correctly or providing bots with relevant user data. If you don't need to specify any business context, you can pass an empty object `{}` for the second argument.

**Example of initializing the SDK:**

```typescript
// 1. Define your SDK configuration
const nuggetSDKConfig: NuggetJumborConfiguration = {
  nameSpace: 'your-app-namespace' // Replace with your application's unique namespace
};

// 2. Define optional chat business context
const chatContext: NuggetChatBusinessContext = {
  channelHandle: "someChannelHandleValue", // Optional: specific channel for the interaction
  ticketGroupingId: "someTicketGroupingIdValue", // Optional: identifier for grouping tickets
  ticketProperties: { // Optional: custom properties for the ticket
    "someTicketProperties": ["someTicketPropertiesValue"]
  },
  botProperties: { // Optional: custom properties for bot interactions
    "someBotProperties": ["someBotPropertiesValue"]
  }
};

// 3. Get an instance of the NuggetSDK
const nuggetSDK = NuggetSDK.getInstance(nuggetSDKConfig, chatContext);

// Alternatively, if no specific chat context is needed at initialization:
// const nuggetSDKWithNoChatContext = NuggetSDK.getInstance(nuggetSDKConfig, {});
```
Internally, `NuggetSDK.getInstance` calls `NuggetPlugin.initializeNuggetFactory(config, chatSupportBusinessContext)` on the native side during the first initialization.

### 3. Setting up Authentication

The Nugget SDK requires an authentication delegate to handle user authentication. You must provide an object that implements the `NuggetAuthProvider` interface. This interface has two methods:

*   `getAuthInfo(): Promise<NuggetAuthUserInfo>`: Called by the SDK to get the current user's authentication token.
*   `refreshAuthInfo(): Promise<NuggetAuthUserInfo>`: Called by the SDK if it needs to refresh an expired or invalid token.

The `NuggetAuthUserInfo` object should contain an `accessToken`.

Here's an example of how to implement `NuggetAuthProvider` and set the delegate:

```typescript
// 1. Implement the NuggetAuthProvider interface
class MyAppAuthProvider implements NuggetAuthProvider {
  async getAuthInfo(): Promise<NuggetAuthUserInfo> {
    // Replace with your logic to retrieve the current user's access token
    const accessToken = await getCurrentUserToken();
    return { accessToken: accessToken };
  }

  async refreshAuthInfo(): Promise<NuggetAuthUserInfo> {
    // Replace with your logic to refresh the access token
    const newAccessToken = await refreshCurrentUserToken();
    return { accessToken: newAccessToken };
  }
}

// 2. Create an instance of your auth provider
const myAuthProvider = new MyAppAuthProvider();

// 3. Set the delegate on the NuggetSDK instance
nuggetSDK.setAuthDelegate(myAuthProvider);
```
Make sure to set the authentication delegate before performing any operations that require user authentication.

### 4. DeepLink Handeling

The SDK provides methods to check if it can handle a deeplink and to open the SDK with a specific deeplink.

```typescript
const deeplinkUrl = "some-chat-deeplink"; // Replace with your deeplink

async function handleDeeplink() {
  try {
    // Check if the SDK can open the deeplink
    const canOpen = await nuggetSDK.canOpenDeeplink(deeplinkUrl);

    if (canOpen) {
      console.log("Nugget SDK can open this deeplink.");
      // Open the Nugget SDK with the deeplink
      const openedSuccessfully = await nuggetSDK.openNuggetSDK(deeplinkUrl);
      if (openedSuccessfully) {
        console.log("Nugget SDK opened successfully with deeplink.");
      } else {
        console.log("Failed to open Nugget SDK with deeplink.");
      }
    } else {
      console.log("Nugget SDK cannot open this deeplink.");
    }
  } catch (error) {
    console.error("Error handling deeplink with Nugget SDK:", error);
  }
}

handleDeeplink();
```

## API Reference

This section details the main classes, interfaces, and methods provided by the Nugget React Native SDK.

### `NuggetSDK`

The primary class for interacting with the SDK.

#### Methods

| Method                                      | Description                                                                                                | Parameters                                         | Return Type                            |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| `static getInstance(config: NuggetJumborConfiguration, chatSupportBusinessContext: NuggetChatBusinessContext)` | Gets the singleton instance of the `NuggetSDK`. Initializes it if it's the first call.                 | `config: NuggetJumborConfiguration`, `chatSupportBusinessContext: NuggetChatBusinessContext`              | `NuggetSDK`                            |
| `setAuthDelegate(delegate: NuggetAuthProvider)` | Sets the authentication delegate responsible for providing and refreshing user authentication tokens.    | `delegate: NuggetAuthProvider`                   | `void`                                 |
| `canOpenDeeplink(deeplink: string)`         | Checks if the Nugget SDK can handle the given deeplink.                                                    | `deeplink: string`                               | `Promise<boolean>`                     |
| `openNuggetSDK(deeplink: string)`           | Opens the Nugget SDK with the specified deeplink.                                                          | `deeplink: string`                               | `Promise<boolean>`                     |

### Interfaces

#### `NuggetJumborConfiguration`
Configuration object required when initializing the `NuggetSDK`.

| Property    | Type     | Description                       |
| ----------- | -------- | --------------------------------- |
| `nameSpace` | `string` | Your application's unique namespace. |

#### `NuggetAuthProvider`
Interface for the authentication delegate your app must provide.

| Method              | Description                                                         | Parameters | Return Type                          |
| ------------------- | ------------------------------------------------------------------- | ---------- | ------------------------------------ |
| `getAuthInfo()`     | Provides current user authentication information (access token).    | None       | `Promise<NuggetAuthUserInfo>`        |
| `refreshAuthInfo()` | Called by the SDK to refresh authentication information.             | None       | `Promise<NuggetAuthUserInfo>`        |

#### `NuggetAuthUserInfo`
Object representing user authentication information.

| Property      | Type     | Description                |
| ------------- | -------- | -------------------------- |
| `accessToken` | `string` | The user's access token.   |

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

For additional support, please contact nugget team.

