/**
 * Typed JavaScript wrappers around the native PersonSegmenter and PoseDetector
 * modules. The native side exposes the same method signatures on both iOS
 * (Swift) and Android (Kotlin), so this single file works for both.
 */

import { NativeModules } from 'react-native';
import type { PoseKeypoints, Point } from '../logic/types';

interface SegmenterResult {
  width: number;
  height: number;
  /** PNG-encoded mask, base64. White-with-alpha where the person is. */
  base64Mask: string;
}

type Quality = 'fast' | 'balanced' | 'accurate';

interface PersonSegmenterModule {
  segmentImageBase64(base64: string, quality: Quality): Promise<SegmenterResult>;
}

interface PoseDetectorRaw {
  leftShoulder:  { x: number; y: number; confidence: number } | null;
  rightShoulder: { x: number; y: number; confidence: number } | null;
  leftHip:       { x: number; y: number; confidence: number } | null;
  rightHip:      { x: number; y: number; confidence: number } | null;
  leftAnkle:     { x: number; y: number; confidence: number } | null;
  rightAnkle:    { x: number; y: number; confidence: number } | null;
  imageWidth:  number;
  imageHeight: number;
}

interface PoseDetectorModule {
  detectPoseBase64(base64: string): Promise<PoseDetectorRaw>;
}

const PersonSegmenter = NativeModules.PersonSegmenter as PersonSegmenterModule;
const PoseDetector = NativeModules.PoseDetector as PoseDetectorModule;

if (!PersonSegmenter) {
  console.warn(
    '[TransparentFit] PersonSegmenter native module is not linked. ' +
    'Rebuild the app after pod install / gradle sync.'
  );
}
if (!PoseDetector) {
  console.warn(
    '[TransparentFit] PoseDetector native module is not linked. ' +
    'Rebuild the app after pod install / gradle sync.'
  );
}

/**
 * Run person segmentation on a JPEG/PNG base64 image.
 * Quality 'fast' for live frame processing, 'accurate' for one-shot calibration.
 */
export async function segmentPerson(
  base64Image: string,
  quality: Quality = 'balanced',
): Promise<SegmenterResult> {
  return PersonSegmenter.segmentImageBase64(base64Image, quality);
}

/**
 * Detect a single body pose in an image and return keypoints in image
 * pixel coordinates. Returns nulls for joints below confidence threshold —
 * the caller should fall back to manual mark placement for missing ones.
 */
export async function detectPose(base64Image: string): Promise<{
  keypoints: PoseKeypoints;
  imageWidth: number;
  imageHeight: number;
}> {
  const raw = await PoseDetector.detectPoseBase64(base64Image);

  const lift = (
    p: { x: number; y: number; confidence: number } | null
  ): Point | null => p ? { x: p.x, y: p.y } : null;

  const confidences = [
    raw.leftShoulder?.confidence,
    raw.rightShoulder?.confidence,
    raw.leftHip?.confidence,
    raw.rightHip?.confidence,
  ].filter((c): c is number => typeof c === 'number');
  const avgConfidence = confidences.length
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;

  return {
    keypoints: {
      leftShoulder:  lift(raw.leftShoulder),
      rightShoulder: lift(raw.rightShoulder),
      leftHip:       lift(raw.leftHip),
      rightHip:      lift(raw.rightHip),
      leftAnkle:     lift(raw.leftAnkle),
      rightAnkle:    lift(raw.rightAnkle),
      confidence:    avgConfidence,
    },
    imageWidth:  raw.imageWidth,
    imageHeight: raw.imageHeight,
  };
}
