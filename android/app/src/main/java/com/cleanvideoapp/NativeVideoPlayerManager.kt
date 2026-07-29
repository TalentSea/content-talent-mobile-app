package com.cleanvideoapp

import android.util.Log
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class NativeVideoPlayerManager : SimpleViewManager<NativeVideoPlayerView>() {
    override fun getName(): String = "NativeVideoPlayer"

    override fun createViewInstance(reactContext: ThemedReactContext): NativeVideoPlayerView {
        Log.d("NativeVideoPlayer", "createViewInstance called")
        return NativeVideoPlayerView(reactContext)
    }

    @ReactProp(name = "source")
    fun setSource(view: NativeVideoPlayerView, source: ReadableMap?) {
        view.setSource(source)
    }

    @ReactProp(name = "paused", defaultBoolean = true)
    fun setPaused(view: NativeVideoPlayerView, paused: Boolean) {
        Log.d("NativeVideoPlayer", "setPaused called with paused: $paused")
        view.setPaused(paused)
    }

    @ReactProp(name = "muted", defaultBoolean = false)
    fun setMuted(view: NativeVideoPlayerView, muted: Boolean) {
        view.setMuted(muted)
    }

    @ReactProp(name = "loop", defaultBoolean = false)
    fun setLoop(view: NativeVideoPlayerView, loop: Boolean) {
        view.setLoop(loop)
    }

    @ReactProp(name = "volume", defaultFloat = 1.0f)
    fun setVolume(view: NativeVideoPlayerView, volume: Float) {
        view.setVolume(volume)
    }

    @ReactProp(name = "playbackRate", defaultFloat = 1.0f)
    fun setPlaybackRate(view: NativeVideoPlayerView, rate: Float) {
        view.setPlaybackRate(rate)
    }

    @ReactProp(name = "resizeMode")
    fun setResizeMode(view: NativeVideoPlayerView, resizeMode: String?) {
        view.setResizeMode(resizeMode ?: "contain")
    }


    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
        return MapBuilder.of(
                "onLoadStart", MapBuilder.of("registrationName", "onLoadStart"),
                "onLoad", MapBuilder.of("registrationName", "onLoad"),
                "onError", MapBuilder.of("registrationName", "onError"),
                "onProgress", MapBuilder.of("registrationName", "onProgress"),
                "onBuffer", MapBuilder.of("registrationName", "onBuffer"),
                "onEnd", MapBuilder.of("registrationName", "onEnd")

        )
    }

    override fun receiveCommand(view: NativeVideoPlayerView, commandId: Int, args: ReadableArray?) {
        when (commandId) {
            1 -> {
                val positionSeconds = args?.getDouble(0) ?: 0.0
                val positionMs = (positionSeconds * 1000).toLong()
                view.seekTo(positionMs)
            }
            else -> super.receiveCommand(view, commandId, args)
        }
    }

    override fun receiveCommand(view: NativeVideoPlayerView, commandId: String, args: ReadableArray?) {
        when (commandId) {
            "seekTo" -> {
                val positionSeconds = args?.getDouble(0) ?: 0.0
                val positionMs = (positionSeconds * 1000).toLong()
                view.seekTo(positionMs)
            }
            else -> super.receiveCommand(view, commandId, args)
        }
    }

    override fun onDropViewInstance(view: NativeVideoPlayerView) {
        view.releasePlayer()
        super.onDropViewInstance(view)
    }
}