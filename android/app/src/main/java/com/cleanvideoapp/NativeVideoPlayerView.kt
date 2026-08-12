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
import androidx.media3.common.TrackSelectionOverride
import androidx.media3.common.TrackSelectionParameters
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.ima.ImaAdsLoader
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event

class NativeVideoPlayerView(context: Context) : FrameLayout(context) {
    private var imaAdsLoader: ImaAdsLoader? = null
    private val playerView: PlayerView
    private val player: ExoPlayer

    private var hasSentLoadEvent = false
    private var hasSentTracksEvent = false
    private var currentVolume: Float = 1.0f
    private var isMuted: Boolean = false
    private var captionsEnabled: Boolean = false
    // Reflects the last value the "paused" prop was set to. setSource() must
    // respect this instead of unconditionally starting playback, otherwise
    // autoplay behaves inconsistently depending on which prop is applied first.
    private var desiredPaused: Boolean = false

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

        playerView = LayoutInflater.from(context)
                .inflate(R.layout.player_view_layout, this, false) as PlayerView

        imaAdsLoader = ImaAdsLoader.Builder(context).build()

        val mediaSourceFactory = DefaultMediaSourceFactory(context)
            .setLocalAdInsertionComponents({ imaAdsLoader }, playerView)

        player = ExoPlayer.Builder(context)
            .setMediaSourceFactory(mediaSourceFactory)
            .build()

        playerView.player = player
        imaAdsLoader?.setPlayer(player)
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

                        // Detect embedded subtitle tracks from HLS manifest
                        if (!hasSentTracksEvent) {
                            hasSentTracksEvent = true
                            sendTracksEvent()
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

            override fun onTracksChanged(tracks: androidx.media3.common.Tracks) {
                sendTracksEvent()
                if (pendingSelectedTextTrack != null) {
                    applySelectedTextTrack(pendingSelectedTextTrack)
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
                Log.e("NativeVideoPlayer", "ERROR code=${error.errorCodeName}, message=${error.message}, cause=${error.cause}", error)

                val detailedMessage = error.cause?.message ?: error.message ?: "Unknown error"

                val event = Arguments.createMap().apply {
                    putString("message", detailedMessage)
                    putString("errorCode", error.errorCodeName)
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
        hasSentTracksEvent = false
        sendEvent("onLoadStart", Arguments.createMap())

        val type = source.getString("type")
        val builder = MediaItem.Builder()
                .setUri(Uri.parse(uri))

        if (type == "m3u8" || uri.contains(".m3u8")) {
            builder.setMimeType(MimeTypes.APPLICATION_M3U8)
        }

        val adTagUrl = source.getString("adTagUrl")
        if (!adTagUrl.isNullOrBlank()) {
            builder.setAdsConfiguration(MediaItem.AdsConfiguration.Builder(Uri.parse(adTagUrl)).build())
        }

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
        player.playWhenReady = !desiredPaused
    }

    fun setPaused(paused: Boolean) {
        Log.d("NativeVideoPlayer", "View setPaused: $paused")
        desiredPaused = paused
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
        imaAdsLoader?.setPlayer(null)
        imaAdsLoader?.release()
        player.release()
    }

    private var pendingSelectedTextTrack: ReadableMap? = null

    fun setCaptionsEnabled(enabled: Boolean) {
        captionsEnabled = enabled
        Log.d("NativeVideoPlayer", "setCaptionsEnabled: $enabled")

        if (!enabled) {
            val builder = player.trackSelectionParameters.buildUpon()
            builder.setTrackTypeDisabled(C.TRACK_TYPE_TEXT, true)
            builder.clearOverridesOfType(C.TRACK_TYPE_TEXT)
            player.trackSelectionParameters = builder.build()
        } else if (pendingSelectedTextTrack != null) {
            applySelectedTextTrack(pendingSelectedTextTrack)
        }
    }

    fun setSelectedTextTrack(selectedTrack: ReadableMap?) {
        pendingSelectedTextTrack = selectedTrack
        applySelectedTextTrack(selectedTrack)
    }

    private fun applySelectedTextTrack(selectedTrack: ReadableMap?) {
        if (selectedTrack == null) return
        val type = selectedTrack.getString("type")
        val builder = player.trackSelectionParameters.buildUpon()

        if (type == "disabled") {
            captionsEnabled = false
            builder.setTrackTypeDisabled(C.TRACK_TYPE_TEXT, true)
            builder.clearOverridesOfType(C.TRACK_TYPE_TEXT)
            player.trackSelectionParameters = builder.build()
            return
        }

        captionsEnabled = true
        builder.setTrackTypeDisabled(C.TRACK_TYPE_TEXT, false)
        builder.clearOverridesOfType(C.TRACK_TYPE_TEXT)

        val lang = selectedTrack.getString("value")
        val targetIndex = if (selectedTrack.hasKey("index")) selectedTrack.getInt("index") else 0

        if (!lang.isNullOrEmpty()) {
            builder.setPreferredTextLanguage(lang)
        }

        var globalIndex = 0
        var matched = false

        for (group in player.currentTracks.groups) {
            if (group.type == C.TRACK_TYPE_TEXT) {
                for (i in 0 until group.length) {
                    if (globalIndex == targetIndex) {
                        builder.setOverrideForType(
                            TrackSelectionOverride(group.mediaTrackGroup, i)
                        )
                        matched = true
                        Log.d("NativeVideoPlayer", "applySelectedTextTrack matched track: globalIndex=$globalIndex, groupTrack=$i, language=${group.getTrackFormat(i).language}")
                        break
                    }
                    globalIndex++
                }
                if (matched) break
            }
        }

        if (!matched && player.currentTracks.groups.any { it.type == C.TRACK_TYPE_TEXT }) {
            for (group in player.currentTracks.groups) {
                if (group.type == C.TRACK_TYPE_TEXT && group.length > 0) {
                    builder.setOverrideForType(
                        TrackSelectionOverride(group.mediaTrackGroup, 0)
                    )
                    matched = true
                    break
                }
            }
        }

        player.trackSelectionParameters = builder.build()
        playerView.subtitleView?.let { subView ->
            subView.visibility = android.view.View.VISIBLE
            subView.setPadding(0, 0, 0, 100)
        }
        Log.d("NativeVideoPlayer", "applySelectedTextTrack finished: targetIndex=$targetIndex, matched=$matched, textGroups=${player.currentTracks.groups.count { it.type == C.TRACK_TYPE_TEXT }}")
    }

    /**
     * Enumerate available text tracks (from HLS manifest or sidecar)
     * and send an onTracksAvailable event to JS with the count + details.
     */
    private fun sendTracksEvent() {
        var textTrackCount = 0
        val tracksArray = Arguments.createArray()

        for (group in player.currentTracks.groups) {
            if (group.type == C.TRACK_TYPE_TEXT) {
                for (i in 0 until group.length) {
                    val format = group.getTrackFormat(i)
                    textTrackCount++

                    val trackMap = Arguments.createMap().apply {
                        putString("language", format.language ?: "und")
                        putString("label", format.label ?: "Track $textTrackCount")
                        putString("mimeType", format.sampleMimeType ?: "")
                    }
                    tracksArray.pushMap(trackMap)
                }
            }
        }

        Log.d("NativeVideoPlayer", "sendTracksEvent: $textTrackCount text tracks found")

        val event = Arguments.createMap().apply {
            putInt("textTrackCount", textTrackCount)
            putArray("textTracks", tracksArray)
        }
        sendEvent("onTracksAvailable", event)
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