package com.cleanvideoapp

import android.content.Context
import android.net.Uri
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView

class NativeVideoPlayerView(context: Context) : FrameLayout(context) {
    private val player: ExoPlayer = ExoPlayer.Builder(context).build()
    private val playerView: PlayerView = PlayerView(context)

    init {
        layoutParams = LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        )

        playerView.layoutParams = LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        )

        playerView.player = player
        playerView.useController = true

        addView(playerView)
    }

    fun setUri(uri: String?) {
        if (uri.isNullOrBlank()) return

        val mediaItem = MediaItem.fromUri(Uri.parse(uri))
        player.setMediaItem(mediaItem)
        player.prepare()
    }

    fun setPaused(paused: Boolean) {
        player.playWhenReady = !paused
    }

    fun releasePlayer() {
        player.release()
    }
}