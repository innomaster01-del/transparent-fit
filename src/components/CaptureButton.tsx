/**
 * Big white capture button with a soft purple highlight (reference Image 2).
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadow } from '../theme';

interface Props {
  onPress: () => void;
  size?: number;
}

export function CaptureButton({ onPress, size = 74 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Capture"
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 4,
          borderColor: 'rgba(255, 255, 255, 0.85)',
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
        shadow.soft,
      ]}>
      <LinearGradient
        colors={['#ffffff', '#ffffff', 'rgba(180, 140, 255, 0.4)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size - 14,
          height: size - 14,
          borderRadius: (size - 14) / 2,
        }}
      />
    </Pressable>
  );
}
