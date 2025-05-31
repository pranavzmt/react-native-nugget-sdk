import { NativeModules, Platform, NativeEventEmitter } from 'react-native';

const LINKING_ERROR =
  `The package 'nugget-rn' doesn\'t seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBWZXJzaW9uIjoiIiwiYnVzaW5lc3NJZCI6MSwiY2xpZW50SWQiOjEsImNsaWVudF9uYW1lIjoiem9tYXRvIiwiZGlzcGxheU5hbWUiOiJQcmFuYXYiLCJlbWFpbCI6InByYW5hdkBudWdnZXQuY29tIiwiZXhwIjoxNzQ4NzgxODEwLCJob3N0TmFtZSI6ImRhc2hib2FyZC5udWdnZXQuY29tIiwiaWF0IjoxNzQ4Njk1NDEwLCJwaG9uZU51bWJlciI6IiIsInBob3RvVVJMIjoiIiwic291cmNlIjoiZGVza3RvcCIsInRlbmFudElEIjoxLCJ1aWQiOiJwcmFuYXYtanVtYm8tdGVzdC0xMDAifQ.UaMF3hFxNnQEmFslMmkuTQdN3crhYPBVktgKiwatLIs';
const userID = '350072074';
const NuggetPlugin = NativeModules.NuggetRN
  ? NativeModules.NuggetRN
  : new Proxy(
      {},
      {
        get() { 
          throw new Error(LINKING_ERROR);
        },
      }
    );

// Auth Provider Interface
interface NuggetAuthUserInfo {
  clientID: number;
  accessToken: string;
  userName?: string;
  userID: string;
  photoURL?: string;
}

interface NuggetAuthProvider {
  getAuthInfo(): Promise<NuggetAuthUserInfo>;
  refreshAuthInfo(): Promise<NuggetAuthUserInfo>;
}

class DefaultAuthProvider implements NuggetAuthProvider {
  async getAuthInfo(): Promise<NuggetAuthUserInfo> {
    return {
      clientID: 1,
      accessToken: accessToken,
      userID: userID,
      userName: '',
      photoURL: '',
    };
  }

  async refreshAuthInfo(): Promise<NuggetAuthUserInfo> {
    return this.getAuthInfo();
  }
}

// SDK Configuration Interface
interface NuggetJumborConfiguration {
  nameSpace: string;
}

interface NuggetSDKConfiguration {
  getJumboConfig(): Promise<{ [key: string]: any }>;
}

class DefaultSDKConfiguration implements NuggetSDKConfiguration {
  async getJumboConfig(): Promise<{ [key: string]: any }> {
    return {
      nameSpace: 'rn-namespace',
    };
  }
}

// Notification Interface
interface NuggetNotificationInfo {
  notificationID: string;
}

interface NuggetNotificationProvider {
  getNotificationInfo(): Promise<NuggetNotificationInfo>;
}

class DefaultNotificationProvider implements NuggetNotificationProvider {
  async getNotificationInfo(): Promise<NuggetNotificationInfo> {
    return {
      notificationID: 'your-default-notification-id',
    };
  }
}

// Add these interfaces after the existing interfaces
interface NativeRequestEvent {
  method: string;
  payload: any;
}

interface NuggetEventBridge {
  OnNativeRequest: NativeRequestEvent;
}

// Add this interface after your existing interfaces
interface ChatBusinessContext {
  channelHandle?: string;
  ticketGroupingId?: string;
  ticketProperties?: { [key: string]: string[] };
  botProperties?: { [key: string]: string[] };
}

class NuggetModule {
  private eventEmitter: NativeEventEmitter;
  private sdkConfigurationDelegate: NuggetSDKConfiguration;
  private eventSubscription: any;

  constructor() {
    this.eventEmitter = new NativeEventEmitter(NuggetPlugin);

    this.sdkConfigurationDelegate = new DefaultSDKConfiguration();

    this.eventSubscription = this.eventEmitter.addListener(
      'OnNativeRequest',
      async (event: NativeRequestEvent) => {
        try {
          const { method, payload } = event;
          let result;

          switch (method) {
            case 'requiresAuthInfo':
              result = { success: await this.getAuthInfo() };
              break;
            case 'requestRefreshAuthInfo':
              result = { success: await this.refreshAuthInfo() };
              break;
            case 'getJumboConfig':
              result = await this.sdkConfigurationDelegate.getJumboConfig();
              break;
            default:
              console.warn(`Unknown method received: ${method}`);
              result = { error: 'Unknown method' };
          }

          NuggetPlugin.onJsResponse(method, result);
        } catch (error) {
          console.error('Error handling native request:', error);
          NuggetPlugin.onJsResponse(event.method, { 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    );

    // Initialize with configuration and chat business context
    this.initialize();
  }

  private initialize() {
    if (typeof NuggetPlugin.initializeNuggetFactory === 'function') {
      const defaultContext = {
        channelHandle: "default-channel",
        ticketGroupingId: "default-group",
        ticketProperties: {
          "priority": ["high"],
          "category": ["support"]
        },
        botProperties: {
          "cp_device_id": ["default-device"],
          "cp_auth_token": ["default-token"]
        }
      };
      NuggetPlugin.initializeNuggetFactory(defaultContext);
    } else {
      console.error(
        'Failed to initialize NuggetModule: initializeNuggetFactory is not a function'
      );
    }
  }

  // Add cleanup method
  public cleanup() {
    if (this.eventSubscription) {
      this.eventSubscription.remove();
      this.eventSubscription = null;
    }
  }

  async canOpenDeeplink(deeplink: string): Promise<boolean> {
    return new Promise((resolve) => {
      NuggetPlugin.canOpenDeeplink(deeplink, (result: any) => {
        console.log('canOpenDeeplink-result', result);
        resolve(result.canOpenDeeplink === true);
      });
    });
  }

  async openNuggetSDK(deeplink: string): Promise<string> {
    return new Promise((resolve) => {
      NuggetPlugin.openNuggetSDK(deeplink, (result: any) => {
        console.log('openNuggetSDK-result', result);
        resolve(result.nuggetSDKResult);
      });
    });
  }

  // Auth Provider
  async getAuthInfo(): Promise<{ [key: string]: any }> {
    try {
      const nuggetAuthUserInfo: NuggetAuthUserInfo = {
        clientID: 1,
        accessToken: accessToken,
        userID: userID,
        userName: '',
        photoURL: '',
      };

      return { ...nuggetAuthUserInfo };
    } catch (error) {
      console.error('Error in getAuthInfo:', error);
      throw error;
    }
  }

  async refreshAuthInfo(): Promise<{ [key: string]: any }> {
    return this.getAuthInfo();
  }

  public addListener<K extends keyof NuggetEventBridge>(
    eventType: K,
    listener: (event: NuggetEventBridge[K]) => void
  ) {
    return this.eventEmitter.addListener(eventType, listener);
  }
}

export { NuggetModule, DefaultAuthProvider, DefaultSDKConfiguration };

export type {
  NuggetAuthProvider,
  NuggetSDKConfiguration,
  NuggetAuthUserInfo,
  NuggetJumborConfiguration,
  ChatBusinessContext,
};
