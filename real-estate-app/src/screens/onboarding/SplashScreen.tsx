import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { colors, typography, spacing } from '../../theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  // Animation values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const backgroundOpacity = useSharedValue(1);

  // Start animations on mount
  useEffect(() => {
    // Logo animation: scale and fade in
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 600 }),
      withTiming(1, { duration: 200 })
    );
    logoOpacity.value = withTiming(1, { duration: 600 });

    // Title animation: fade in and slide up (delayed)
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(400, withTiming(0, { duration: 500 }));

    // Complete animation after 2.5 seconds
    const timer = setTimeout(() => {
      // Fade out animation
      backgroundOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(onAnimationComplete)();
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, backgroundAnimatedStyle]}>
      {/* Logo Container */}
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.logoCircle, logoAnimatedStyle]}>
          <Text style={styles.logoText}>RE</Text>
        </Animated.View>
        
        <Animated.Text style={[styles.title, titleAnimatedStyle]}>
          RealEstate
        </Animated.Text>
        
        <Animated.Text style={[styles.subtitle, titleAnimatedStyle]}>
          Encuentra tu hogar ideal
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    // Add subtle shadow
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    ...typography.h1,
    fontSize: 48,
    fontWeight: '700',
    color: colors.background,
    textAlign: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.background,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: colors.secondary,
    textAlign: 'center',
    opacity: 0.9,
  },
});