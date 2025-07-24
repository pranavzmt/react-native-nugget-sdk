import React, { createContext, useContext, useMemo } from 'react';
import { NuggetSDK } from 'nugget-rn';
import type { NuggetAuthProvider, NuggetAuthUserInfo, NuggetChatBusinessContext, NuggetJumborConfiguration , AccentColorData , FontData } from 'nugget-rn';

// Define the context shape
interface NuggetSDKContextType {
    sdk: NuggetSDK;
    isInitialized: boolean;
}

// Create the context
const NuggetSDKContext = createContext<NuggetSDKContextType | null>(null);

// Auth Provider Implementation
class NuggetAuthProviderImpl implements NuggetAuthProvider {
    private accessToken: string = 'accessToken-goes-here';

    constructor(initialToken: string = '') {
        this.accessToken = initialToken;
        console.log('This.accesstoken ' + this.accessToken)
    }

    async getAuthInfo(): Promise<NuggetAuthUserInfo> {
      // call your access token API here, set this.accessToken = received token anf return token as well as http code
      console.log('Returning access token from getAuthInfo: ' + this.accessToken)
        return {
            accessToken: this.accessToken,
            httpCode : 200 // return the actual http code received after calling API
        };
    }

    async refreshAuthInfo(): Promise<NuggetAuthUserInfo> {
      // call your refresh token API here , set this.accessToken = received token and return token as well as http code
        return {
            accessToken: this.accessToken,
            httpCode : 200 // return the actual http code received after calling API
        };
    }
}

interface NuggetSDKProviderProps {
    children: React.ReactNode;
    nameSpace: string; // nameSpace is required by NuggetJumborConfiguration
    initialAuthToken?: string;
}

export const NuggetSDKProvider: React.FC<NuggetSDKProviderProps> = ({
    children,
    nameSpace,
    initialAuthToken = 'accessToken-goes-here'
}) => {
    const sdk = useMemo(() => {
        const sdkConfig: NuggetJumborConfiguration = { nameSpace };
        const chatSupportBusinessContext: NuggetChatBusinessContext = {
            // channelHandle: 'channelHandle',
            // ticketGroupingId: 'ticketGroupingId-goes-here',
            // ticketProperties: {
            //     'ticketProperty1': ['value1', 'value2'],
            //     'ticketProperty2': ['value3', 'value4']
            // },
            // botProperties: {
            //     'botProperty1': ['value5', 'value6'],
            //     'botProperty2': ['value7', 'value8']
            // }
        };
       const accentColorData : AccentColorData = {
          hex : '#FFF000'
       }
        const fontData : FontData = {
             fontMapping : new Map<string, string>([
                 ['regular' , 'pixarRegular']
             ])
         }
        const nuggetSDKInstance = NuggetSDK.getInstance(sdkConfig, chatSupportBusinessContext , false , accentColorData , fontData);
        const authDelegate = new NuggetAuthProviderImpl('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBWZXJzaW9uIjoiIiwiYnVzaW5lc3NJZCI6MSwiY2xpZW50SWQiOjksImNsaWVudF9uYW1lIjoiZ29raXdpIiwiZGlzcGxheU5hbWUiOiJQcmFuYXYgc3Rhc2hmaW4gdGVzdCIsImVtYWlsIjoiIiwiZXhwIjoxNzUzNDI0Mjc0LCJob3N0TmFtZSI6Imdva2l3aS5udWdnZXQuY29tIiwiaWF0IjoxNzUzMzM3ODc0LCJsYW5ndWFnZSI6IiIsInBob25lTnVtYmVyIjoiNzg5NzU3MDY5NSIsInBob3RvVVJMIjoiIiwic291cmNlIjoiYW5kcm9pZCIsInRlbmFudElEIjoyMywidWlkIjoia3VuYWwtdGVzdCJ9.owMzAAbV9VS2GIxgOrN8os0F3PcyW_ur6EIkRMnor7M');
        nuggetSDKInstance.setAuthDelegate(authDelegate);
        return nuggetSDKInstance;
    }, [nameSpace, initialAuthToken]);

    const contextValue = useMemo(() => ({
        sdk,
        isInitialized: true
    }), [sdk]);

    return (
        <NuggetSDKContext.Provider value={contextValue}>
            {children}
        </NuggetSDKContext.Provider>
    );
};

export const useNuggetSDK = () => {
    const context = useContext(NuggetSDKContext);
    if (!context) {
        throw new Error('useNuggetSDK must be used within a NuggetSDKProvider');
    }
    return context;
};
