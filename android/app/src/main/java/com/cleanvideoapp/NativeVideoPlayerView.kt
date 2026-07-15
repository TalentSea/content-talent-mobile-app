package com.cleanvideoapp

import android.content.Context
import android.net.Uri
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event

class NativeVideoPlayerView(context: Context) : FrameLayout(context) {
    private val player: ExoPlayer = ExoPlayer.Builder(context).build()
    private val playerView: PlayerView = LayoutInflater.from(context).inflate(R.layout.player_view_layout, this, false) as PlayerView
    private var hasSentLoadEvent = false

    private val progressRunnable = object : Runnable {
        override fun run() {
            if (player.isPlaying) {
                sendProgressEvent()
            }
            postDelayed(this, 250)
        }
    }

    init {
        layoutParams = LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        )

        playerView.player = player

        addView(playerView)

        player.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                when (state) {
                    Player.STATE_READY -> {
                        if (!hasSentLoadEvent) {
                            hasSentLoadEvent = true
                            val event = Arguments.createMap().apply {
                                putDouble("duration", player.duration.toDouble() / 1000.0)
                            }
                            sendEvent("onLoad", event)
                        }
                    }
                    Player.STATE_BUFFERING -> {
                        val event = Arguments.createMap().apply {
                            putBoolean("isBuffering", true)
                        }
                        sendEvent("onBuffer", event)
                    }
                }
            }

            override fun onIsPlayingChanged(isPlaying: Boolean) {
                if (isPlaying) {
                    post(progressRunnable)
                } else {
                    removeCallbacks(progressRunnable)
                }
            }

            override fun onPlayerError(error: PlaybackException) {
                Log.e("NativeVideoPlayer", "onPlayerError: ${error.message}", error)
                val event = Arguments.createMap().apply {
                    putString("message", error.message)
                }
                sendEvent("onError", event)
            }
        })
    }

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)
        Log.d("NativeVideoPlayer", "onLayout: left=$left, top=$top, right=$right, bottom=$bottom, width=${right - left}, height=${bottom - top}")
        playerView.layout(0, 0, right - left, bottom - top)
    }

    fun setUri(uri: String?) {
        Log.d("NativeVideoPlayer", "View setUri: $uri")
        if (uri.isNullOrBlank()) return
        hasSentLoadEvent = false

        val event = Arguments.createMap()
        sendEvent("onLoadStart", event)

        val mediaItem = MediaItem.fromUri(Uri.parse(uri))
        player.setMediaItem(mediaItem)
        player.prepare()
    }

    fun setPaused(paused: Boolean) {
        Log.d("NativeVideoPlayer", "View setPaused: $paused")
        player.playWhenReady = !paused
    }

    fun seekTo(positionMs: Long) {
        player.seekTo(positionMs)
        sendProgressEvent()
    }

    private fun sendProgressEvent() {
        val duration = player.duration
        val currentPosition = player.currentPosition
        if (duration > 0) {
            val event = Arguments.createMap().apply {
                putDouble("currentTime", currentPosition.toDouble() / 1000.0)
                putDouble("duration", duration.toDouble() / 1000.0)
            }
            sendEvent("onProgress", event)
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        val reactContext = context as? ReactContext ?: return
        val surfaceId = UIManagerHelper.getSurfaceId(reactContext)
        val eventDispatcher = UIManagerHelper.getEventDispatcher(reactContext, surfaceId)
        eventDispatcher?.dispatchEvent(
            VideoPlayerEvent(surfaceId, id, eventName, params)
        )
    }

    fun releasePlayer() {
        removeCallbacks(progressRunnable)
        player.release()
    }
}

class VideoPlayerEvent(
    surfaceId: Int,
    viewId: Int,
    private val mEventName: String,
    private val eventData: WritableMap?
) : Event<VideoPlayerEvent>(surfaceId, viewId) {
    override fun getEventName(): String = mEventName
    override fun getEventData(): WritableMap? = eventData
}