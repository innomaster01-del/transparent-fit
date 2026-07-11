//
//  PoseDetector.swift
//  TransparentFit
//
//  Uses VNDetectHumanBodyPoseRequest to extract shoulder/hip/ankle keypoints
//  from a still image. Used during photo calibration to auto-place the marks.
//

import Foundation
import Vision
import UIKit

@objc(PoseDetector)
class PoseDetector: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @objc(detectPoseBase64:resolver:rejecter:)
  func detectPoseBase64(
    _ base64: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let data = Data(base64Encoded: base64),
          let image = UIImage(data: data),
          let cgImage = image.cgImage else {
      reject("BAD_INPUT", "Cannot decode base64 image", nil)
      return
    }

    let request = VNDetectHumanBodyPoseRequest()
    let handler = VNImageRequestHandler(cgImage: cgImage, orientation: .up)

    do {
      try handler.perform([request])
      guard let observation = request.results?.first else {
        // No body detected — return null keypoints, app falls back to manual placement
        resolve(self.emptyResult())
        return
      }

      let recognizedPoints = try observation.recognizedPoints(.all)
      let w = Double(cgImage.width)
      let h = Double(cgImage.height)

      // Vision normalized coords: origin bottom-left, [0,1]. Convert to top-left pixel.
      let pt: (VNHumanBodyPoseObservation.JointName) -> [String: Any]? = { name in
        guard let p = recognizedPoints[name], p.confidence > 0.4 else { return nil }
        return [
          "x": p.location.x * w,
          "y": (1.0 - p.location.y) * h,
          "confidence": Double(p.confidence)
        ]
      }

      resolve([
        "leftShoulder":  pt(.leftShoulder)  as Any,
        "rightShoulder": pt(.rightShoulder) as Any,
        "leftHip":       pt(.leftHip)       as Any,
        "rightHip":      pt(.rightHip)      as Any,
        "leftAnkle":     pt(.leftAnkle)     as Any,
        "rightAnkle":    pt(.rightAnkle)    as Any,
        "imageWidth":    cgImage.width,
        "imageHeight":   cgImage.height,
      ])
    } catch {
      reject("POSE_FAIL", error.localizedDescription, error)
    }
  }

  private func emptyResult() -> [String: Any] {
    return [
      "leftShoulder":  NSNull(),
      "rightShoulder": NSNull(),
      "leftHip":       NSNull(),
      "rightHip":      NSNull(),
      "leftAnkle":     NSNull(),
      "rightAnkle":    NSNull(),
      "imageWidth":    0,
      "imageHeight":   0,
    ]
  }
}
