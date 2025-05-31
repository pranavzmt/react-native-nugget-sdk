
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { NuggetSDK } from 'nugget-rn';
import type { NuggetAuthProvider, NuggetAuthUserInfo, NuggetJumborConfiguration } from 'nugget-rn';

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
    }

    async getAuthInfo(): Promise<NuggetAuthUserInfo> {
        return {
            accessToken: this.accessToken
        };
    }

    async refreshAuthInfo(): Promise<NuggetAuthUserInfo> {
        return {
            accessToken: this.accessToken
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
        console.log("NuggetSDKProvider", sdkConfig);
        const nuggetSDKInstance = NuggetSDK.getInstance(sdkConfig);
        const authDelegate = new NuggetAuthProviderImpl(initialAuthToken);
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