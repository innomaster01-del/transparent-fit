/**
 * App-wide state store. Kept minimal — everything that's only relevant to
 * one screen lives in that screen's local state.
 */

import { create } from 'zustand';
import type { BodyMarks, Mode, SubStyle } from '../logic/types';

interface AppState {
  // Photo calibration
  photoBase64: string | null;
  photoWidth: number;
  photoHeight: number;
  marks: BodyMarks | null;
  /** Person-segmentation mask (base64 PNG, alpha = person) from calibration. */
  segmentationMask: string | null;
  setPhoto: (base64: string, w: number, h: number) => void;
  setMarks: (marks: BodyMarks) => void;
  setSegmentationMask: (mask: string | null) => void;
  clearPhoto: () => void;

  // Mode selection (per-mode sub-style memory)
  mode: Mode;
  subStyles: Record<Mode, SubStyle>;
  setMode: (mode: Mode) => void;
  setSubStyle: (mode: Mode, sub: SubStyle) => void;

  // Live try-on options
  outlineThickness: 'thin' | 'medium' | 'thick';
  outlineColor: string;
  showGlow: boolean;
  showFill: boolean;
  setOutlineThickness: (t: 'thin' | 'medium' | 'thick') => void;
  setOutlineColor: (c: string) => void;
  setShowGlow: (g: boolean) => void;
  setShowFill: (f: boolean) => void;

  // Live pose tracking — marks that update per-frame while the camera runs.
  // Falls back to the calibration `marks` when no live pose is available.
  liveMarks: BodyMarks | null;
  setLiveMarks: (m: BodyMarks | null) => void;

  // Camera
  cameraFacing: 'front' | 'back';
  toggleCameraFacing: () => void;
  isPaused: boolean;
  togglePaused: () => void;
  torchEnabled: boolean;
  toggleTorch: () => void;

  // App-wide
  hapticsEnabled: boolean;
  language: 'he' | 'en';
  setLanguage: (l: 'he' | 'en') => void;
  setHaptics: (h: boolean) => void;
}

export const useAppStore = create<AppState>(set => ({
  photoBase64: null,
  segmentationMask: null,
  photoWidth: 0,
  photoHeight: 0,
  marks: null,
  setPhoto: (base64, w, h) => set({
    photoBase64: base64, photoWidth: w, photoHeight: h, marks: null,
  }),
  setMarks: (marks) => set({ marks }),
  setSegmentationMask: (mask) => set({ segmentationMask: mask }),
  clearPhoto: () => set({ photoBase64: null, photoWidth: 0, photoHeight: 0, marks: null, segmentationMask: null }),

  mode: 'shirt',
  subStyles: { shirt: 'tshirt', pants: 'long', dress: 'knee', full: 'casual' },
  setMode: (mode) => set({ mode }),
  setSubStyle: (mode, sub) => set(state => ({
    subStyles: { ...state.subStyles, [mode]: sub },
  })),

  outlineThickness: 'medium',
  outlineColor: 'rgba(255, 255, 255, 0.95)',
  showGlow: true,
  showFill: true,
  setOutlineThickness: (t) => set({ outlineThickness: t }),
  setOutlineColor: (c) => set({ outlineColor: c }),
  setShowGlow: (g) => set({ showGlow: g }),
  setShowFill: (f) => set({ showFill: f }),

  liveMarks: null,
  setLiveMarks: (m) => set({ liveMarks: m }),

  cameraFacing: 'back',
  toggleCameraFacing: () => set(s => ({ cameraFacing: s.cameraFacing === 'back' ? 'front' : 'back' })),
  isPaused: false,
  togglePaused: () => set(s => ({ isPaused: !s.isPaused })),
  torchEnabled: false,
  toggleTorch: () => set(s => ({ torchEnabled: !s.torchEnabled })),

  hapticsEnabled: true,
  language: 'he',
  setHaptics: (h) => set({ hapticsEnabled: h }),
  setLanguage: (l) => set({ language: l }),
}));
