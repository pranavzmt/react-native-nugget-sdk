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
        const authDelegate = new NuggetAuthProviderImpl('your-access-token-goes-here');
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
