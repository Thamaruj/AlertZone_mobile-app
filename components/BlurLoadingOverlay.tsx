import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/themeContext';

interface BlurLoadingOverlayProps {
  visible: boolean;
  statusText?: string;
  subStatusText?: string;
}

export default function BlurLoadingOverlay({
  visible,
  statusText = 'Submitting Report',
  subStatusText = 'Uploading details...',
}: BlurLoadingOverlayProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const { colors, isDark } = useTheme();

  useEffect(() => {
    let rotationAnimation: Animated.CompositeAnimation | null = null;
    let pulseAnimation: Animated.CompositeAnimation | null = null;

    if (visible) {
      // Start rotating animation
      rotationAnimation = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotationAnimation.start();

      // Start pulsing animation
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.15,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1.0,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    } else {
      // Reset values when hidden
      rotation.setValue(0);
      pulse.setValue(1);
    }

    return () => {
      if (rotationAnimation) rotationAnimation.stop();
      if (pulseAnimation) pulseAnimation.stop();
    };
  }, [visible, rotation, pulse]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const overlayBgColor = isDark ? 'rgba(13, 31, 45, 0.85)' : 'rgba(245, 245, 245, 0.85)';
  const blurTint = isDark ? 'dark' : 'light';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayBgColor }]}>
        {/* Quadruple-layered BlurView for extreme blur density */}
        <BlurView intensity={80} tint={blurTint} style={StyleSheet.absoluteFill} />
        <BlurView intensity={80} tint={blurTint} style={StyleSheet.absoluteFill} />
        <BlurView intensity={80} tint={blurTint} style={StyleSheet.absoluteFill} />
        <BlurView
          intensity={80}
          tint={blurTint}
          style={StyleSheet.absoluteFill}
          className="justify-center items-center px-8"
        >
          <View className="items-center justify-center">
            {/* Spinning & Pulsing Animation Container */}
            <View className="relative w-32 h-32 items-center justify-center mb-8">
              {/* Glowing background */}
              <View
                className="absolute w-24 h-24 rounded-full border shadow-2xl"
                style={{
                  backgroundColor: colors.primary + '1A',
                  borderColor: colors.primary + '33',
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              />

              {/* Rotating Crescent Ring */}
              <Animated.View
                style={[
                  styles.spinner,
                  {
                    transform: [{ rotate: spin }],
                    borderColor: colors.primary,
                    borderTopColor: 'transparent',
                    borderLeftColor: 'transparent',
                  },
                ]}
              />

              {/* Pulsing Icon */}
              <Animated.View style={{ transform: [{ scale: pulse }] }}>
                <Ionicons name="cloud-upload" size={44} color={colors.primary} />
              </Animated.View>
            </View>

            {/* Status Text Header */}
            <Text className="text-xl font-bold tracking-wide text-center mb-2" style={{ color: colors.text }}>
              {statusText}
            </Text>

            {/* Sub Status Text Description */}
            {subStatusText ? (
              <Text className="text-xs font-semibold text-center uppercase tracking-widest px-4" style={{ color: colors.primary }}>
                {subStatusText}
              </Text>
            ) : null}

            {/* Premium Instruction Label */}
            <Text className="text-sm text-center leading-5 mt-6 px-6" style={{ color: colors.textSecondary }}>
              Please keep the app open. We are encrypting and uploading your submission to AlertZone.
            </Text>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  spinner: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
  },
});
