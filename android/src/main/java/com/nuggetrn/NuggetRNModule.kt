package com.nuggetrn

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.Callback

class NuggetRNModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  init {
    // NuggetRNManager.registerNuggetModule(this) // Likely not needed for HelloWorld
    // reactContext.addActivityEventListener(this) // Likely not needed for HelloWorld unless specific activity results are handled
  }

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun helloWorld(promise: Promise) {
    promise.resolve("Hello World from NuggetRN Android Native Module!")
  }

  @ReactMethod
  fun initialize(appId: String, loginUri: String?) {
    // No-op for Hello World
  }
  
  @ReactMethod
  fun start(data: ReadableMap) {
    // No-op for Hello World
  }

  @ReactMethod
  fun setResponseCallback() {
    // No-op for Hello World
  }

  @ReactMethod
  fun cleanup() {
    // No-op for Hello World
  }

  @ReactMethod
  fun isWhatsappInstalled(callback: Callback) {
    callback.invoke(false)
  }
  
  @ReactMethod
  fun commitResponse(data: ReadableMap?) {
    // No-op for Hello World
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Keep: Required for RN built in Event Emitter Calls.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Keep: Required for RN built in Event Emitter Calls.
  }

  companion object {
    const val NAME = "NuggetRN"
  }
}