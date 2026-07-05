package com.cleanvideoapp

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class NativeVideoPlayerManager : SimpleViewManager<NativeVideoPlayerView>() {
    override fun getName(): String {
        return "NativeVideoPlayer"
    }

    override fun createViewInstance(reactContext: ThemedReactContext): NativeVideoPlayerView {
        return NativeVideoPlayerView(reactContext)
    }

    @ReactProp(name = "uri")
    fun setUri(view: NativeVideoPlayerView, uri: String?) {
        view.setUri(uri)
    }

    @ReactProp(name = "paused", defaultBoolean = true)
    fun setPaused(view: NativeVideoPlayerView, paused: Boolean) {
        view.setPaused(paused)
    }

    override fun onDropViewInstance(view: NativeVideoPlayerView) {
        view.releasePlayer()
        super.onDropViewInstance(view)
    }
}