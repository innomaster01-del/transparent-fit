/*
 * PoseDetectorModule.kt — auto-detects body keypoints during photo calibration.
 *
 * Add to app/build.gradle:
 *   implementation 'com.google.mlkit:pose-detection:18.0.0-beta5'
 */

package com.transparentfit

import android.graphics.BitmapFactory
import android.util.Base64
import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions

class PoseDetectorModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PoseDetector"

    @ReactMethod
    fun detectPoseBase64(base64: String, promise: Promise) {
        try {
            val bytes = Base64.decode(base64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: return promise.reject("BAD_INPUT", "Cannot decode base64 image")

            val options = PoseDetectorOptions.Builder()
                .setDetectorMode(PoseDetectorOptions.SINGLE_IMAGE_MODE)
                .build()

            val poseDetector = PoseDetection.getClient(options)
            val inputImage = InputImage.fromBitmap(bitmap, 0)

            poseDetector.process(inputImage)
                .addOnSuccessListener { pose ->
                    val result = Arguments.createMap()
                    fun put(name: String, lm: PoseLandmark?) {
                        if (lm == null || lm.inFrameLikelihood < 0.4f) {
                            result.putNull(name)
                        } else {
                            val pt = Arguments.createMap().apply {
                                putDouble("x", lm.position.x.toDouble())
                                putDouble("y", lm.position.y.toDouble())
                                putDouble("confidence", lm.inFrameLikelihood.toDouble())
                            }
                            result.putMap(name, pt)
                        }
                    }
                    put("leftShoulder",  pose.getPoseLandmark(PoseLandmark.LEFT_SHOULDER))
                    put("rightShoulder", pose.getPoseLandmark(PoseLandmark.RIGHT_SHOULDER))
                    put("leftHip",       pose.getPoseLandmark(PoseLandmark.LEFT_HIP))
                    put("rightHip",      pose.getPoseLandmark(PoseLandmark.RIGHT_HIP))
                    put("leftAnkle",     pose.getPoseLandmark(PoseLandmark.LEFT_ANKLE))
                    put("rightAnkle",    pose.getPoseLandmark(PoseLandmark.RIGHT_ANKLE))
                    result.putInt("imageWidth", bitmap.width)
                    result.putInt("imageHeight", bitmap.height)
                    promise.resolve(result)
                }
                .addOnFailureListener { e ->
                    promise.reject("ML_KIT_FAIL", e.message, e)
                }
        } catch (e: Exception) {
            promise.reject("EXCEPTION", e.message, e)
        }
    }
}
