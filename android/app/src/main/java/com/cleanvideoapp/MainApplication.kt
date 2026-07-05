package com.cleanvideoapp

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

    override val reactHost: ReactHost by lazy {
        getDefaultReactHost(
                context = applicationContext,
                packageList = PackageList(this).packages.apply {
                    add(NativeVideoPlayerPackage())
                },
        )
    }

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
    }
}