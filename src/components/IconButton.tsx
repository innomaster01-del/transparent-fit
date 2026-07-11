/**
 * Small circular icon button — used for flip / pause / back / close.
 */

import React from 'react';
import { Pressable, StyleSheet, ViewStyle, View } from 'react-native';
import { colors, radius } from '../theme';

interface Props {
  onPress: () => void;
  active?: boolean;
  size?: number;
  style?: ViewStyle;
  children: React.ReactNode;
  accessibilityLabel: string;
}

export function IconButton({ onPress, active, size = 42, style, children, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? colors.purple : colors.bgOverlay,
          borderColor: active ? 'transparent' : colors.border,
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
        style,
      ]}>
      <View style={styles.inner}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
