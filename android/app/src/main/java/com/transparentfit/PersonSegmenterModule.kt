/*
 * PersonSegmenterModule.kt — Android side of person segmentation.
 *
 * Uses Google ML Kit's SelfieSegmentation under the hood. Quality is comparable
 * to Apple Vision for full-body shots, and it ships with the Play Services so
 * the app binary stays small.
 *
 * Add to app/build.gradle:
 *   implementation 'com.google.mlkit:segmentation-selfie:16.0.0-beta6'
 */

package com.transparentfit

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
import com.google.mlkit.vision.segmentation.Segmentation
import java.io.ByteArrayOutputStream

class PersonSegmenterModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PersonSegmenter"

    @ReactMethod
    fun segmentImageBase64(base64: String, quality: String, promise: Promise) {
        try {
            val bytes = Base64.decode(base64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: return promise.reject("BAD_INPUT", "Cannot decode base64 image")

            val options = SelfieSegmenterOptions.Builder()
                .setDetectorMode(SelfieSegmenterOptions.SINGLE_IMAGE_MODE)
                .build()

            val segmenter = Segmentation.getClient(options)
            val inputImage = InputImage.fromBitmap(bitmap, 0)

            segmenter.process(inputImage)
                .addOnSuccessListener { segmentationMask ->
                    try {
                        val maskBuffer = segmentationMask.buffer
                        val maskW = segmentationMask.width
                        val maskH = segmentationMask.height

                        // ML Kit returns a float buffer (0..1 person confidence).
                        // Convert to ARGB bitmap where alpha = confidence * 255.
                        val maskBitmap = Bitmap.createBitmap(maskW, maskH, Bitmap.Config.ARGB_8888)
                        val pixels = IntArray(maskW * maskH)
                        maskBuffer.rewind()
                        for (i in 0 until maskW * maskH) {
                            val conf = maskBuffer.float.coerceIn(0f, 1f)
                            val alpha = (conf * 255).toInt()
                            // ARGB: alpha + white
                            pixels[i] = (alpha shl 24) or 0x00FFFFFF
                        }
                        maskBitmap.setPixels(pixels, 0, maskW, 0, 0, maskW, maskH)

                        // Encode the mask as PNG base64
                        val out = ByteArrayOutputStream()
                        maskBitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                        val base64Mask = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)

                        val result = Arguments.createMap().apply {
                            putInt("width", maskW)
                            putInt("height", maskH)
                            putString("base64Mask", base64Mask)
                        }
                        promise.resolve(result)
                    } catch (e: Exception) {
                        promise.reject("MASK_ENCODE", e.message, e)
                    }
                }
                .addOnFailureListener { e ->
                    promise.reject("ML_KIT_FAIL", e.message, e)
                }
        } catch (e: Exception) {
            promise.reject("EXCEPTION", e.message, e)
        }
    }
}
