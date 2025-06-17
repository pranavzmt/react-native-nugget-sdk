import { NativeModules, Platform, NativeEventEmitter } from 'react-native';

const LINKING_ERROR =
    `The package 'nugget-rn' doesn\'t seem to be linked. Make sure: \n\n` +
    Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
    '- You rebuilt the app after installing the package\n' +
    '- You are not using Expo Go\n';

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
export interface NuggetAuthUserInfo {
    accessToken: string,
    httpCode : Int
}

export interface NuggetAuthProvider {
    getAuthInfo(): Promise<NuggetAuthUserInfo>;
    refreshAuthInfo(): Promise<NuggetAuthUserInfo>;
}

// SDK Configuration Interface
export interface NuggetJumborConfiguration {
    nameSpace: string;
}

// not used
interface NuggetSDKConfiguration {
    getJumboConfig(): Promise<{ [key: string]: any }>;
}

// Event Interface
export interface NativeRequestEvent {
    method: string;
    payload: any;
}

export interface NuggetEventBridge {
    OnNativeRequest: NativeRequestEvent;
}

export interface NuggetChatBusinessContext {
    channelHandle?: string;
    ticketGroupingId?: string;
    ticketProperties?: { [key: string]: string[] };
    botProperties?: { [key: string]: string[] };
}

export interface AccentColorData {
   type?: string;
   tint? : string;
   hex? : string;
}

export interface FontData {
  fontMapping: Map<string, string>;
}

interface DeeplinkResult {
  success: boolean;
  deeplink: string;
  error?: string;
}

export class NuggetSDK {
    private static instance: NuggetSDK | null = null;
    static #pendingNotificationToken: string | null = null;
    static #pendingNotificationPermissionStatus: boolean | null = null;
    private config: NuggetJumborConfiguration;
    private authDelegate: NuggetAuthProvider | null = null;
    private eventEmitter: NativeEventEmitter;
    private eventSubscription: any;

    private constructor(config: NuggetJumborConfiguration, chatSupportBusinessContext: NuggetChatBusinessContext, handleDeeplinkInsideApp? : boolean , accentColorData? : AccentColorData , fontData? : FontData) {
        this.config = config;
        this.eventEmitter = new NativeEventEmitter(NuggetPlugin);
        this.eventSubscription = this.eventEmitter.addListener(
            'OnNativeRequest',
            async (event: NativeRequestEvent) => {
                try {
                    const { method, payload } = event;
                    let result;

                    switch (method) {
                        case 'requiresAuthInfo':
                            result = await this.getAuthInfo();
                            break;
                        case 'requestRefreshAuthInfo':
                            result = await this.refreshAuthInfo();
                            break;
                        case 'getJumboConfig':
                            result = this.getConfiguration();
                            break;
                        case 'triggerDeeplinkInApp':
                            result = this.triggerDeeplink(payload?.deeplink ?? '');
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
        NuggetPlugin.initializeNuggetFactory(config, chatSupportBusinessContext , handleDeeplinkInsideApp , accentColorData , fontData);
    }

  private triggerDeeplink(deeplink: string) : DeeplinkResult {
      // Handle your deeplink here
      return {
        success: true,
        deeplink,
      };
  }

    private async getAuthInfo(): Promise<{ [key: string]: any }> {
        if (!this.authDelegate) {
            throw new Error('Auth delegate not set. Please call setAuthDelegate first.');
        }
        const authInfoFromDelegate: NuggetAuthUserInfo = await this.authDelegate.getAuthInfo();
        return { ...authInfoFromDelegate };
    }

    private async refreshAuthInfo(): Promise<{ [key: string]: any }> {
        if (!this.authDelegate) {
            throw new Error('Auth delegate not set. Please call setAuthDelegate first.');
        }
        const refreshedAuthInfoFromDelegate: NuggetAuthUserInfo = await this.authDelegate.refreshAuthInfo();
        return { ...refreshedAuthInfoFromDelegate };
    }

    private getConfiguration(): { [key: string]: any } {
        return { ...this.config };
    }

    public static getInstance(config: NuggetJumborConfiguration, chatSupportBusinessContext: NuggetChatBusinessContext, handleDeeplinkInsideApp? : boolean , accentColorData? : AccentColorData , fontData? : FontData): NuggetSDK {

        if (!NuggetSDK.instance) {
            NuggetSDK.instance = new NuggetSDK(config, chatSupportBusinessContext , handleDeeplinkInsideApp , accentColorData , fontData);
        }
        // If called again with a new config, the existing instance's config is not updated.
        // This is typical for basic singletons: initialize once.
        return NuggetSDK.instance;
    }

    public setAuthDelegate(delegate: NuggetAuthProvider) {
        this.authDelegate = delegate;
    }


    /**
     * Checks if the SDK can handle the given deeplink
     * @param deeplink - The deeplink URL to validate
     * @returns Promise resolving to true if the deeplink can be handled
     * @throws Error if the deeplink is invalid
     */
    public async canOpenDeeplink(deeplink: string): Promise<boolean> {

        if (!deeplink || typeof deeplink !== 'string') {
            throw new Error('Invalid deeplink parameter: deeplink must be a non-empty string');
        }

        return new Promise((resolve) => {
            try {
                NuggetPlugin.canOpenDeeplink(deeplink, (result: any) => {
                    resolve(!!result?.canOpenDeeplink);
                });
            } catch (error) {
                console.error('Error checking deeplink:', error);
                resolve(false);
            }
        });
    }

    /**
     * Opens the Nugget SDK with the specified deeplink
     * @param deeplink - The deeplink URL to open
     * @returns Promise resolving to true if SDK opened successfully
     * @throws Error if the deeplink is invalid
     */

   public openNuggetSDK(deeplink: string): Promise<boolean> {
     if (!NuggetSDK.instance) {
       return Promise.reject(new Error('NuggetSDK not initialized. Please initialize NuggetSDK first.'));
     }

     if (!deeplink || typeof deeplink !== 'string') {
       return Promise.reject(new Error('Invalid deeplink parameter: deeplink must be a non-empty string'));
     }

     return NuggetPlugin.openNuggetSDK("epifi://unified-support/builder?flowType=ticketing&omniTicketingFlow=true")
       .then((result: boolean) => {
         if (result) {
           console.log('SDK opened successfully');
           return true;
         } else {
           console.log('Failed to open SDK');
           return false;
         }
       })
       .catch((error: any) => {
         console.error('Error opening SDK:', error);
         return false;
       });
   }

}
