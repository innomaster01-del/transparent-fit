/*
 * TransparentFitPackage.kt — registers our two native modules with React Native.
 *
 * Then in MainApplication.kt add:
 *   override fun getPackages(): List<ReactPackage> =
 *     PackageList(this).packages.apply { add(TransparentFitPackage()) }
 */

package com.transparentfit

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class TransparentFitPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(
            PersonSegmenterModule(reactContext),
            PoseDetectorModule(reactContext),
        )

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
