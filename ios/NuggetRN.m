#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(NuggetRN, RCTEventEmitter)

RCT_EXTERN_METHOD(canOpenDeeplink:(NSString *)deeplink callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(openNuggetSDK:(NSString *)deeplink callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(initializeNuggetFactory:(NSDictionary *)chatBusinessContext)

RCT_EXTERN_METHOD(onJsResponse:(NSString *)method result:(id)result)

@end
