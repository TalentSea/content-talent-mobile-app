package com.cleanvideoapp

import android.content.Context
import android.net.Uri
import android.util.Log
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event

class NativeVideoPlayerView(context: Context) : FrameLayout(context) {
    private val player: ExoPlayer = ExoPlayer.Builder(context).build()
    private val playerView: PlayerView =
            LayoutInflater.from(context)
                    .inflate(R.layout.player_view_layout, this, false) as PlayerView

    private var hasSentLoadEvent = false
    private var currentVolume: Float = 1.0f
    private var isMuted: Boolean = false

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

                            Log.d("NativeVideoPlayer", "STATE_READY duration=${player.duration}")

                            sendEvent("onLoad", event)
                        }

                        val bufferEvent = Arguments.createMap().apply {
                            putBoolean("isBuffering", false)
                        }
                        sendEvent("onBuffer", bufferEvent)
                    }

                    Player.STATE_BUFFERING -> {
                        val event = Arguments.createMap().apply {
                            putBoolean("isBuffering", true)
                        }
                        sendEvent("onBuffer", event)
                    }

                    Player.STATE_ENDED -> {
                        sendEvent("onEnd", Arguments.createMap())
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
                Log.e("NativeVideoPlayer", "ERROR code=${error.errorCodeName}, message=${error.message}", error)

                val event = Arguments.createMap().apply {
                    putString("message", error.message ?: "Playback error")
                }

                sendEvent("onError", event)
            }
        })
    }

    override fun onLayout(
            changed: Boolean,
            left: Int,
            top: Int,
            right: Int,
            bottom: Int
    ) {
        super.onLayout(changed, left, top, right, bottom)
        playerView.layout(0, 0, right - left, bottom - top)
    }

    fun setSource(source: ReadableMap?) {
        val uri = source?.getString("uri")
        if (uri.isNullOrBlank()) return

        Log.d("NativeVideoPlayer", "View setSource: $uri")

        hasSentLoadEvent = false
        sendEvent("onLoadStart", Arguments.createMap())

        val builder = MediaItem.Builder()
                .setUri(Uri.parse(uri))

        if (source.hasKey("captions")) {
            val captions = source.getArray("captions")

            if (captions != null && captions.size() > 0) {
                val subtitleConfigs = mutableListOf<MediaItem.SubtitleConfiguration>()

                for (i in 0 until captions.size()) {
                    val caption = captions.getMap(i)
                    val captionUri = caption?.getString("uri")

                    if (!captionUri.isNullOrBlank()) {
                        val captionMimeType = when (caption?.getString("mimeType")) {
                            "application/x-subrip" -> MimeTypes.APPLICATION_SUBRIP
                            else -> MimeTypes.TEXT_VTT
                        }

                        val subtitleConfig =
                                MediaItem.SubtitleConfiguration.Builder(Uri.parse(captionUri))
                                        .setMimeType(captionMimeType)
                                        .setLanguage(caption?.getString("language") ?: "en")
                                        .setLabel(caption?.getString("label") ?: "English")
                                        .setSelectionFlags(C.SELECTION_FLAG_DEFAULT)
                                        .build()

                        subtitleConfigs.add(subtitleConfig)
                    }
                }

                builder.setSubtitleConfigurations(subtitleConfigs)
            }
        }

        player.setMediaItem(builder.build())
        player.prepare()
        player.playWhenReady = true
    }

    fun setPaused(paused: Boolean) {
        Log.d("NativeVideoPlayer", "View setPaused: $paused")
        player.playWhenReady = !paused
    }

    fun setMuted(muted: Boolean) {
        isMuted = muted
        player.volume = if (muted) 0f else currentVolume
    }

    fun setVolume(volume: Float) {
        currentVolume = volume.coerceIn(0f, 1f)

        if (!isMuted) {
            player.volume = currentVolume
        }
    }

    fun setLoop(loop: Boolean) {
        player.repeatMode = if (loop) {
            Player.REPEAT_MODE_ONE
        } else {
            Player.REPEAT_MODE_OFF
        }
    }

    fun setPlaybackRate(rate: Float) {
        val safeRate = rate.coerceIn(0.25f, 3.0f)
        player.playbackParameters = PlaybackParameters(safeRate)
    }

    fun setResizeMode(resizeMode: String) {
        playerView.resizeMode = when (resizeMode) {
            "cover" -> AspectRatioFrameLayout.RESIZE_MODE_ZOOM
            "stretch" -> AspectRatioFrameLayout.RESIZE_MODE_FILL
            else -> AspectRatioFrameLayout.RESIZE_MODE_FIT
        }
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