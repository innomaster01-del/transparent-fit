//
//  PersonSegmenter.swift
//  TransparentFit
//
//  Bridges Apple Vision's VNGeneratePersonSegmentationRequest to React Native.
//  Returns a base64-encoded grayscale alpha mask the JS side can render via Skia.
//
//  Performance notes:
//   - Uses .balanced quality level for ~30fps on iPhone 12+
//   - For one-shot (still photo) calls, use .accurate
//   - Vision runs on Neural Engine when available (free, no GPU energy cost)
//

import Foundation
import Vision
import UIKit
import CoreImage

@objc(PersonSegmenter)
class PersonSegmenter: NSObject {

  private let ciContext = CIContext(options: [.useSoftwareRenderer: false])

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  /// Segment a still image from a base64-encoded JPEG.
  /// Returns { width, height, base64Mask } via promise.
  @objc(segmentImageBase64:withQuality:resolver:rejecter:)
  func segmentImageBase64(
    _ base64: String,
    quality: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let data = Data(base64Encoded: base64),
          let image = UIImage(data: data),
          let cgImage = image.cgImage else {
      reject("BAD_INPUT", "Cannot decode base64 image", nil)
      return
    }

    let request = VNGeneratePersonSegmentationRequest()
    request.qualityLevel = (quality == "accurate")
      ? .accurate
      : (quality == "fast" ? .fast : .balanced)
    request.outputPixelFormat = kCVPixelFormatType_OneComponent8

    let handler = VNImageRequestHandler(cgImage: cgImage, orientation: .up)

    do {
      try handler.perform([request])
      guard let result = request.results?.first as? VNPixelBufferObservation else {
        reject("NO_RESULT", "Vision returned no observation", nil)
        return
      }

      let pixelBuffer = result.pixelBuffer
      guard let maskCG = self.cgImageFromMask(pixelBuffer: pixelBuffer) else {
        reject("MASK_RENDER", "Could not convert mask pixel buffer", nil)
        return
      }

      // Encode the mask as PNG (preserves alpha cleanly)
      let maskImage = UIImage(cgImage: maskCG)
      guard let pngData = maskImage.pngData() else {
        reject("ENCODE", "Could not encode mask to PNG", nil)
        return
      }

      resolve([
        "width": maskCG.width,
        "height": maskCG.height,
        "base64Mask": pngData.base64EncodedString(),
      ])
    } catch {
      reject("VISION_FAIL", error.localizedDescription, error)
    }
  }

  /// Convert a CVPixelBuffer (one-channel mask) to a CGImage that has its
  /// brightness moved into the alpha channel — usable directly as a mask
  /// in Skia / Canvas via destination-in.
  private func cgImageFromMask(pixelBuffer: CVPixelBuffer) -> CGImage? {
    let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
    // Vision returns a grayscale where bright = person. We map the red channel
    // to alpha so destination-in works without further JS post-processing.
    let colorMatrix = CIFilter(name: "CIColorMatrix")!
    colorMatrix.setValue(ciImage, forKey: kCIInputImageKey)
    colorMatrix.setValue(CIVector(x: 0, y: 0, z: 0, w: 0), forKey: "inputRVector")
    colorMatrix.setValue(CIVector(x: 0, y: 0, z: 0, w: 0), forKey: "inputGVector")
    colorMatrix.setValue(CIVector(x: 0, y: 0, z: 0, w: 0), forKey: "inputBVector")
    colorMatrix.setValue(CIVector(x: 1, y: 0, z: 0, w: 0), forKey: "inputAVector")
    colorMatrix.setValue(CIVector(x: 1, y: 1, z: 1, w: 0), forKey: "inputBiasVector")

    guard let output = colorMatrix.outputImage else { return nil }
    return ciContext.createCGImage(output, from: output.extent)
  }
}
