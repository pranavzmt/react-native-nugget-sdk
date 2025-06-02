import Foundation
import NuggetSDK
import React

struct ClientSideNuggetChatBusinessContext: NuggetChatBusinessContext {
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
  
  func chatSupportBusingessContext() -> NuggetChatBusinessContext {
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
  func canOpenDeeplink(_ deeplink: String, callback: @escaping RCTResponseSenderBlock) {
    let canOpenDeeplink = NuggetFactory.canOpenDeeplink(deeplink: deeplink)
    callback([["canOpenDeeplink": canOpenDeeplink]])
  }
  
  var clientSideNuggetChatBusinessContextDelegate :ClientSideNuggetChatBusinessContextDelegate?
  var clientNuggetSDkConfiguration :NuggetSDkConfigurationDelegate = ClientNuggetSDkConfiguration(configuration: [:])
  var nuggetPushNotificationsListener: NuggetPushNotificationsListener = NuggetPushNotificationsListener()
  
  @objc
  func initializeNuggetFactory(_ sdkConfiguration: [String: Any], chatSupportBusinessContext: [String: Any]) {
    clientNuggetSDkConfiguration = ClientNuggetSDkConfiguration(configuration: sdkConfiguration)
    clientSideNuggetChatBusinessContextDelegate = ClientSideNuggetChatBusinessContextDelegate(params: chatSupportBusinessContext)
    nuggetFactory = NuggetSDK.initializeNuggetFactory(
      authDelegate: self,
      notificationDelegate: nuggetPushNotificationsListener,
      sdkConfigurationDelegate: clientNuggetSDkConfiguration,
      chatBusinessContextDelegate: nil)
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
  func openNuggetSDK(_ deeplink: String, callback: @escaping RCTResponseSenderBlock) {
    DispatchQueue.main.async {
      let viewController = self.nuggetFactory?.contentViewController(deeplink: deeplink)
      let rootViewController = UIApplication.shared.delegate?.window??.rootViewController
      
      if let rootViewController, let viewController {
        viewController.modalPresentationStyle = .fullScreen
        rootViewController.present(viewController, animated: true)
        callback([["nuggetSDKResult": true]])
        return
      }
      
      let windowSceneVC = self.getRootViewControllerFromWindowScene()
      if let windowSceneVC, let viewController {
        viewController.modalPresentationStyle = .fullScreen
        windowSceneVC.present(viewController, animated: true)
        callback([["nuggetSDKResult": true]])
        return
      }
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
            let authInfo = passesValue["success"] as? [String: Any],
            let authInfo = self.createAuthObjectFromDictionary(dictionary: authInfo) else {
        completion(nil, NSError(domain: "NuggetRN", code: 0, userInfo: nil))
        return
      }
      completion(authInfo, nil)
    }
  }
  
  func authManager(requestRefreshAuthInfo completion: @escaping ((any NuggetAuthUserInfo)?, (any Error)?) -> Void) {
    requestValueFromJS(method: "requestRefreshAuthInfo", payload: [:]) { result in
      guard let passesValue = result as? [String: Any],
            let authInfo = passesValue["success"] as? [String: Any],
            let authInfo = self.createAuthObjectFromDictionary(dictionary: authInfo) else {
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
private struct ClientNuggetSDkConfiguration: NuggetSDkConfigurationDelegate {
  
  private let configuration: [String: Any]?
  init(configuration: [String: Any]) {
    self.configuration = configuration
  }
  
  private func createSDKConfigObjectFromDictionary( dictionary: [String: Any]?) -> NuggetJumborConfiguration {
    let nameSpace = dictionary?["nameSpace"] as? String ?? ""
    let jumboUrl = dictionary?["jumboUrl"] as? String
    return NuggetJumborConfiguration(nameSpace: nameSpace, jumboUrl: jumboUrl)
  }
  
  func jumboConfiguration(completion: @escaping (NuggetJumborConfiguration) -> Void) {
    let configObject = self.createSDKConfigObjectFromDictionary(dictionary: configuration)
    completion(configObject)
  }
}
