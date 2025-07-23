import Foundation
import NuggetSDK
import React

struct ClientSideNuggetChatBusinessContext: NuggetChatBusinessContext {
  var type: String?
  var ticketID: Int?
  var channelHandle: String?
  var ticketGroupingId: String?
  var ticketProperties: [String : [String]]?
  var botProperties: [String : [String]]?
  
  init(channelHandle: String? = nil,
       ticketGroupingId: String? = nil,
       ticketProperties: [String : [String]]? = nil,
       botProperties: [String : [String]]? = nil) {
    self.channelHandle = channelHandle
    self.ticketGroupingId = ticketGroupingId
    self.ticketProperties = ticketProperties
    self.botProperties = botProperties
  }
}

class ClientSideNuggetChatBusinessContextDelegate: NuggetBusinessContextProviderDelegate {
  
  private let params: [String: Any]?
  init(params: [String: Any]?) {
    self.params = params
  }
  
  private func createChatSupportBusinessContextFromDictionary() -> NuggetChatBusinessContext {
    guard let params else { return ClientSideNuggetChatBusinessContext() }
    let channelHandle: String? = params["channelHandle"] as? String
    let ticketGroupingId: String? = params["ticketGroupingId"] as? String
    let ticketProperties: [String: [String]]? = params["ticketProperties"] as? [String: [String]]
    let botProperties: [String: [String]]? = params["botProperties"] as? [String: [String]]
    return ClientSideNuggetChatBusinessContext(channelHandle: channelHandle,
                                               ticketGroupingId: ticketGroupingId,
                                               ticketProperties: ticketProperties,
                                               botProperties: botProperties)
  }
  
  func chatSupportBusinessContext() -> NuggetChatBusinessContext {
    return createChatSupportBusinessContextFromDictionary()
  }
}


@objc(NuggetRN)
class NuggetRN: RCTEventEmitter {
  var pendingCompletions: [String: (Any) -> Void] = [:]
  var nuggetFactory: NuggetFactory?
  
  // Required for RCTEventEmitter
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  // Required override for RCTEventEmitter
  override func supportedEvents() -> [String]! {
    return ["OnNativeRequest"]
  }
  
  // Required override for RCTEventEmitter
  override init() {
    
    super.init()
  }
  
  @objc
  func canOpenDeeplink(_ deeplink: String,
   resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let canOpenDeeplink = NuggetFactory.canOpenDeeplink(deeplink: deeplink)
    resolve(["canOpenDeeplink": canOpenDeeplink])
  }
  
  var clientSideNuggetChatBusinessContextDelegate :ClientSideNuggetChatBusinessContextDelegate?
  var clientNuggetSDKConfiguration :NuggetSDKConfigurationDelegate = ClientNuggetSDKConfiguration()
  var nuggetPushNotificationsListener: NuggetPushNotificationsListener = NuggetPushNotificationsListener()
  
  @objc
  func initializeNuggetFactory(_ sdkConfiguration: [String: Any],
                               chatSupportBusinessContext: [String: Any],
                               handleDeeplinkInsideApp: NSNumber?,
                               accentColorData: [String: Any]?,
                               fontData: [String: Any]?) {
    clientNuggetSDKConfiguration = ClientNuggetSDKConfiguration(configuration: sdkConfiguration, handleDeeplinkInsideApp: handleDeeplinkInsideApp, accentColorData: accentColorData, fontData: fontData)
    clientSideNuggetChatBusinessContextDelegate = ClientSideNuggetChatBusinessContextDelegate(params: chatSupportBusinessContext)
    nuggetFactory = NuggetSDK.initializeNuggetFactory(
      authDelegate: self,
      notificationDelegate: nuggetPushNotificationsListener,
      sdkConfigurationDelegate: clientNuggetSDKConfiguration,
      chatBusinessContextDelegate: clientSideNuggetChatBusinessContextDelegate)
  }
  
  @objc
  func updateNotificationToken(_ token: String) {
    nuggetPushNotificationsListener.tokenUpdated(to: token)
  }
  
  @objc
  func updateNotificationPermissionStatus(_ notificationAllowed: Bool) {
    let notificationPermissionStatus: UNAuthorizationStatus = notificationAllowed ? .authorized : .denied
    nuggetPushNotificationsListener.permissionStatusUpdated(to: notificationPermissionStatus)
  }
  
  @objc
  func openNuggetSDK(_ deeplink: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
        let viewController = self.nuggetFactory?.contentViewController(deeplink: deeplink)
        let rootViewController = UIApplication.shared.delegate?.window??.rootViewController
        if let rootViewController, let viewController {
            viewController.modalPresentationStyle = .fullScreen
            let chatNavigationController = UINavigationController(rootViewController: viewController)
            rootViewController.present(chatNavigationController, animated: true)
            resolve(["nuggetSDKResult": true])
            return
        }
        let windowSceneVC = self.getRootViewControllerFromWindowScene()
        if let windowSceneVC, let viewController {
            viewController.modalPresentationStyle = .fullScreen
            let chatNavigationController = UINavigationController(rootViewController: viewController)
            windowSceneVC.present(chatNavigationController, animated: true)
            resolve(["nuggetSDKResult": true])
            return
        }
        // If we reach here, presentation failed
        reject("NO_VIEW_CONTROLLER", "Could not present Nugget SDK view controller", nil)
    }
}
  
  @MainActor @available(iOS 13.0, *)
  private func getRootViewControllerFromWindowScene() -> UIViewController? {
    guard
      let windowScene = UIApplication.shared.connectedScenes
        .filter({ $0.activationState == .foregroundActive })
        .first as? UIWindowScene
    else {
      return nil
    }
    
    if #available(iOS 15.0, *) {
      let keyWindowVC = windowScene.windows.first?.windowScene?.keyWindow?.rootViewController
      if keyWindowVC != nil {
        return keyWindowVC
      }
    }
    
    return windowScene.windows.first?.rootViewController
  }
  
  func requestValueFromJS(
    method: String, payload: [String: Any], completion: @escaping (Any) -> Void
  ) {
    pendingCompletions[method] = completion
    sendEvent(
      withName: "OnNativeRequest",
      body: [
        "method": method,
        "payload": payload,
      ])
  }
  
  @objc
  func onJsResponse(_ method: String, result: Any) {
    if let completion = pendingCompletions[method] {
      completion(result)
      pendingCompletions.removeValue(forKey: method)
    }
  }
}

// MARK: Auth requirements
extension NuggetRN: NuggetAuthProviderDelegate {
  
  private func createAuthObjectFromDictionary(dictionary: [String: Any]) -> NuggetAuthUserInfo? {
    print("createAuthObjectFromDictionary", dictionary)
    guard let accessToken = dictionary["accessToken"] as? String else { return nil }
    return ClientAuthToken(accessToken: accessToken)
  }
  
  func authManager(requiresAuthInfo completion: @escaping ((NuggetAuthUserInfo)?, (Error)?) -> Void) {
    requestValueFromJS(method: "requiresAuthInfo", payload: [:]) { result in
      guard let passesValue = result as? [String: Any],
            let authInfo = self.createAuthObjectFromDictionary(dictionary: passesValue) else {
        completion(nil, NSError(domain: "NuggetRN", code: 0, userInfo: nil))
        return
      }
      completion(authInfo, nil)
    }
  }
  
  func authManager(requestRefreshAuthInfo completion: @escaping ((any NuggetAuthUserInfo)?, (any Error)?) -> Void) {
    requestValueFromJS(method: "requestRefreshAuthInfo", payload: [:]) { result in
      guard let passesValue = result as? [String: Any],
            let authInfo = self.createAuthObjectFromDictionary(dictionary: passesValue) else {
        completion(nil, NSError(domain: "NuggetRN", code: 0, userInfo: nil))
        return
      }
      completion(authInfo, nil)
    }
  }
  
  struct ClientAuthToken: NuggetAuthUserInfo {
    var clientID: Int = 1
    var accessToken: String
    var userName: String? = nil
    var userID: String = .init()
    var photoURL: String = .init()
    
    init(accessToken: String) {
      self.accessToken = accessToken
    }
  }
}

// MARK: SDK config requirements
private struct ClientNuggetSDKConfiguration: NuggetSDKConfigurationDelegate {
  func chatScreenClosedCallback() {
    print("chat screen closed")
  }
  
  init() { }
  
  private var configuration: [String: Any]?
  private var handleDeeplinkInsideApp: NSNumber?
  private var accentColorData: [String: Any]?
  private var fontData: [String: Any]?

  init(configuration: [String: Any], handleDeeplinkInsideApp: NSNumber?, accentColorData: [String: Any]?, fontData: [String: Any]?) {
    self.configuration = configuration
    self.handleDeeplinkInsideApp = handleDeeplinkInsideApp
    self.accentColorData = accentColorData
    self.fontData = fontData
  }
  
  private func createSDKConfigObjectFromDictionary( dictionary: [String: Any]?) -> NuggetJumboConfiguration {
    let nameSpace = dictionary?["nameSpace"] as? String ?? ""
    let jumboUrl = dictionary?["jumboUrl"] as? String
    return NuggetJumboConfiguration(nameSpace: nameSpace, jumboUrl: jumboUrl)
  }
  
  func jumboConfiguration(completion: @escaping (NuggetJumboConfiguration) -> Void) {
    let configObject = self.createSDKConfigObjectFromDictionary(dictionary: configuration)
    completion(configObject)
  }

  func getHandleDeeplinkInsideApp() -> Bool? {
      return handleDeeplinkInsideApp?.boolValue
  }

  func getAccentColorData() -> [String: Any]? {
      return accentColorData
  }

  func getFontData() -> [String: Any]? {
      return fontData
  }

}
