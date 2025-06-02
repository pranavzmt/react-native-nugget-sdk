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
    accessToken: string;
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

export class NuggetSDK {
    private static instance: NuggetSDK | null = null;
    static #pendingNotificationToken: string | null = null;
    static #pendingNotificationPermissionStatus: boolean | null = null;
    private config: NuggetJumborConfiguration;
    private authDelegate: NuggetAuthProvider | null = null;
    private eventEmitter: NativeEventEmitter;
    private eventSubscription: any;

    /**
     * Constructor for the NuggetSDK class
     * @param config - The configuration for the NuggetSDK
     * @param chatSupportBusinessContext - The chat support business context
     */
    private constructor(config: NuggetJumborConfiguration, chatSupportBusinessContext: NuggetChatBusinessContext) {
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
                            result = { success: await this.getAuthInfo() };
                            break;
                        case 'requestRefreshAuthInfo':
                            result = { success: await this.refreshAuthInfo() };
                            break;
                        case 'getJumboConfig':
                            result = this.getConfiguration();
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
        NuggetPlugin.initializeNuggetFactory(config, chatSupportBusinessContext);
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

    /**
     * Gets the instance of the NuggetSDK class
     * @param config - The configuration for the NuggetSDK
     * @param chatSupportBusinessContext - The chat support business context
     * @returns The instance of the NuggetSDK class
     */
    public static getInstance(config: NuggetJumborConfiguration, chatSupportBusinessContext: NuggetChatBusinessContext): NuggetSDK {

        if (!NuggetSDK.instance) {
            NuggetSDK.instance = new NuggetSDK(config, chatSupportBusinessContext);
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
    public async openNuggetSDK(deeplink: string): Promise<boolean> {

        if (!deeplink || typeof deeplink !== 'string') {
            throw new Error('Invalid deeplink parameter: deeplink must be a non-empty string');
        }

        return new Promise((resolve) => {
            try {
                NuggetPlugin.openNuggetSDK(deeplink, (result: any) => {
                    let isOpenedSuccessfully = !!result?.nuggetSDKResult;
                    if (isOpenedSuccessfully) {
                        if (NuggetSDK.#pendingNotificationToken !== null) {
                            NuggetPlugin.updateNotificationToken(NuggetSDK.#pendingNotificationToken);
                            NuggetSDK.#pendingNotificationToken = null;
                        }
                        if (NuggetSDK.#pendingNotificationPermissionStatus !== null) {
                            NuggetPlugin.updateNotificationPermissionStatus(NuggetSDK.#pendingNotificationPermissionStatus);
                            NuggetSDK.#pendingNotificationPermissionStatus = null;
                        }
                    }
                    resolve(isOpenedSuccessfully);
                });
            } catch (error) {
                console.error('Error opening Nugget SDK:', error);
                resolve(false);
            }
        });
    }

    // change them to static methods
    /**
     * Updates the notification token
     * @param token - The notification token
     */
    public static updateNotificationToken(token: string) {
        if (NuggetSDK.instance) {
            NuggetPlugin.updateNotificationToken(token);
        } else {
            NuggetSDK.#pendingNotificationToken = token;
        }
    }

    /**
     * Updates the notification permission status
     * @param notificationAllowed - The notification permission status
     */
    public static updateNotificationPermissionStatus(notificationAllowed: boolean) {
        if (NuggetSDK.instance) {
            NuggetPlugin.updateNotificationPermissionStatus(notificationAllowed);
        } else {
            NuggetSDK.#pendingNotificationPermissionStatus = notificationAllowed;
        }
    }

}
