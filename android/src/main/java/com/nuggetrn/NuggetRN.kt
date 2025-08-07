package com.nuggetrn

import android.app.Activity
import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise;
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import org.json.JSONException
import org.json.JSONObject
import com.zomato.chatsdk.chatcorekit.init.ChatSdkAccessTokenData
import com.zomato.chatsdk.chatcorekit.init.ChatSdkInitConfig
import com.zomato.chatsdk.chatcorekit.network.request.BusinessContext
import com.zomato.chatsdk.init.ChatSDKInitCommunicator
import com.zomato.chatsdk.init.ChatSdk
import com.zomato.sushilib.annotations.FontWeight
import android.app.Application
import android.util.Log
import com.zomato.chatsdk.activities.ChatSDKDeepLinkRouter
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import android.os.Handler
import android.os.Looper
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.ConcurrentHashMap
import com.facebook.react.bridge.ReadableArray
import android.content.Context
import android.os.Bundle
import com.zomato.ui.atomiclib.data.ColorData

class NuggetRN(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private val pendingResponses = ConcurrentHashMap<String, CompletableDeferred<ReadableMap>>()

  private var channelHandle : String? = null
  private var ticketGroupingId : String? = null
  private var ticketProperties : HashMap<String , ArrayList<String>>? = null
  private var botProperties : HashMap<String , ArrayList<String>>? = null
  private var nameSpace : String? = null

  private var handleDeeplinkInsideTheApp : Boolean? = null
  private var lightModeAccentColorTint : String? = null
  private var lightModeAccentColorType : String? = null
  private var lightModeAccentColorHex : String? = null

  private var darkModeAccentColorTint : String? = null
  private var darkModeAccentColorType : String? = null
  private var darkModeAccentColorHex : String? = null

  private var isInitialized = false

  companion object {
    const val NAME = "NuggetRN"
  }

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun initializeNuggetFactory(
    jumboConfiguration: ReadableMap?,
    businessContext: ReadableMap?,
    handleDeeplinkInsideApp : Boolean?,
    lightModeAccentColorData : ReadableMap?,
    darkModeAccentColorData : ReadableMap?,
    fontData : ReadableMap?,
    isDarkModeEnabled : Boolean?,
    promise: Promise
  ) {
    try {
      // Call actual SDK initialization using app context
      val context = reactContext.applicationContext

      Log.i("ChatSampleApp", "Initialising NuggetSDK method called")

      nameSpace = jumboConfiguration?.getString("nameSpace") ?: ""

      channelHandle = businessContext?.getString("channelHandle")
      ticketGroupingId = businessContext?.getString("ticketGroupingId")
      botProperties = resolveCustomProperties(key = "botProperties" , map = businessContext)
      ticketProperties = resolveCustomProperties(key = "ticketProperties" , map = businessContext)

      handleDeeplinkInsideTheApp = (handleDeeplinkInsideApp == true)

      lightModeAccentColorTint = lightModeAccentColorData?.getString("tint") ?: null
      lightModeAccentColorType = lightModeAccentColorData?.getString("type") ?: null
      lightModeAccentColorHex = lightModeAccentColorData?.getString("hex") ?: null

      darkModeAccentColorTint = darkModeAccentColorData?.getString("tint") ?: null
      darkModeAccentColorType = darkModeAccentColorData?.getString("type") ?: null
      darkModeAccentColorHex = darkModeAccentColorData?.getString("hex") ?: null

      val fontMapping = fontData?.getMap("fontMapping")

//      Log.i("ChatSampleApp" , "Handle deeplink inside app : ${handleDeeplinkInsideApp} Dark mode enabled value : ${isDarkModeEnabled}")
//      Log.i("ChatSampleApp" , "Namespace : ${nameSpace} Light mode accent color hex : ${lightModeAccentColorHex}")

      if(isInitialized) return

      ChatSdk.initialize(
        context as Application, initInterface = object : ChatSDKInitCommunicator {
          override suspend fun getAccessTokenData(payloadArgs : HashMap<String, String>?): ChatSdkAccessTokenData {

            val tokenData = requestAuthInfo("requiresAuthInfo")

            Log.i("ChatSampleApp" , "Token received : ${tokenData?.accessToken}")

            return tokenData
          }

          override fun getBusinessContext(payloadArgs : HashMap<String, String>?): BusinessContext {
            return BusinessContext(
              channelHandle = channelHandle,
              ticketGroupingId = ticketGroupingId,
              ticketProperties = ticketProperties,
              botProperties = botProperties
            )
          }

          override suspend fun getRefreshToken(payloadArgs : HashMap<String, String>?): String {
            val tokenData = requestAuthInfo("requestRefreshAuthInfo")
            return tokenData?.accessToken ?: ""
          }

          override fun getTextAppearance(fontWeight: Int): Int? {

            if(fontMapping == null || currentActivity == null) return null

            val styleName = when (fontWeight) {
              100 -> fontMapping.getString("thin")
              200 -> fontMapping.getString("extralight")
              300 -> fontMapping.getString("light")
              400 -> fontMapping.getString("regular")
              500 -> fontMapping.getString("medium")
              600 -> fontMapping.getString("semibold")
              700 -> fontMapping.getString("bold")
              800 -> fontMapping.getString("extrabold")
              else -> null
            }

            Log.i("ChatSampleApp" , "Style name : ${styleName}")

            val resolvedStyle =
              getStyleResourceId(currentActivity , styleName?.replace(Regex("[^A-Za-z0-9]"), ""))
            return resolvedStyle
          }

          override fun triggerDeeplinkInApp(context: Context, url: String?, bundle: Bundle?){
            triggerDeeplinkInApp(context, url, bundle , "triggerDeeplinkInApp")
          }

          override fun isDarkModeEnabled(): Boolean {
            return isDarkModeEnabled == true
          }

        }, initConfig = ChatSdkInitConfig(
          namespace = nameSpace ?: "",
          handleDeeplinkInApp = handleDeeplinkInsideTheApp ?: false,
          lightModeAccentColorData = ColorData(
            type = lightModeAccentColorType,
            tint = lightModeAccentColorTint,
            hex = lightModeAccentColorHex
          ),
          darkModeAccentColorData = ColorData(
            type = darkModeAccentColorType,
            tint = darkModeAccentColorTint,
            hex = darkModeAccentColorHex
          )
        )
      )

      isInitialized = true
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("NUGGET_SDK_INIT_ERROR", e.message, e)
    }
  }

  private fun getStyleResourceId(context: Context?, styleName: String?): Int? {
    if (context == null || styleName == null) return null
    return context.resources.getIdentifier(styleName, "style", context.packageName)
  }

  private fun triggerDeeplinkInApp(context: Context, url: String?, bundle: Bundle?, method: String) {
    val deferred = CompletableDeferred<ReadableMap>()
    pendingResponses[method] = deferred

    val payload = Arguments.createMap().apply {
      putString("deeplink", url)
    }
    sendEventToJS(method , payload)
  }

  private suspend fun requestAuthInfo(method : String): ChatSdkAccessTokenData = withContext(Dispatchers.Main) {
    val deferred = CompletableDeferred<ReadableMap>()
    pendingResponses[method] = deferred

    sendEventToJS(method)

    try {
      val resultMap = deferred.await()
      val token = resultMap.getString("accessToken") ?: ""
      val httpCode = resultMap.getInt("httpCode") ?: -1
      Log.i("ChatSampleApp" , "Received token in requestAuthInfo : ${token}")
      ChatSdkAccessTokenData(token, 200)
    } catch (e: Exception) {
      Log.i("ChatSampleApp" , "Exception caught in requestAuthInfo : ${e.message}")
      ChatSdkAccessTokenData("", -1)
    }
  }

  private fun sendEventToJS(method: String, payload: WritableMap? = null) {
    val params = Arguments.createMap().apply {
      putString("method", method)
      if (payload != null) putMap("payload", payload)
    }

    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("OnNativeRequest", params)
  }

  @ReactMethod
  fun onJsResponse(method: String, payload: ReadableMap) {
    Log.i("ChatSampleApp", "Received response for method: ${method} and payload : ${payload}")
    pendingResponses[method]?.complete(payload)
    pendingResponses.remove(method)
  }

  @ReactMethod
  fun openNuggetSDK(deeplink: String, promise: Promise) : Unit {
    try {

      Log.i(
        "ChatSampleApp",
        "Inside try block of launching NuggetSDK, currAct. :${currentActivity}"
      )

      val activity = currentActivity ?: return

      val context = reactApplicationContext
      val intent = Intent(context, ChatSDKDeepLinkRouter::class.java).apply {
        putExtra("uri", deeplink)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      Log.i("ChatSampleApp", "Exception in opening chat : ${e.message}")
      promise.reject("OPEN_SDK_ERROR", "Failed to open Nugget SDK", e)
    }
  }

  override fun onActivityResult(
    activity: Activity?,
    requestCode: Int,
    resultCode: Int,
    data: Intent?
  ) {}

  override fun onNewIntent(intent: Intent?) {}

  private fun resolveCustomProperties(key : String , map : ReadableMap?) : HashMap<String, ArrayList<String>>{

    val outerMap: ReadableMap? = map?.getMap(key)

    if(outerMap == null) return hashMapOf()

    val iterator = outerMap.keySetIterator()
    val resultMap = hashMapOf<String, ArrayList<String>>()

    while (iterator.hasNextKey()) {
      val key = iterator.nextKey()
      val readableArray: ReadableArray? = outerMap.getArray(key)

      if (readableArray != null) {
        val list = ArrayList<String>()
        for (i in 0 until readableArray.size()) {
          val item = readableArray.getString(i)
          if (item != null) {
            list.add(item)
          }
        }
        resultMap[key] = list
      }
    }

    return resultMap

  }

}
