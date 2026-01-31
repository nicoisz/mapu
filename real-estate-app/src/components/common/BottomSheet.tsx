import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import BottomSheetComponent, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetProps as GorhomBottomSheetProps,
} from '@gorhom/bottom-sheet';
import { colors, spacing } from '../../theme';

/**
 * Props for the BottomSheet component
 */
export interface BottomSheetProps extends Omit<GorhomBottomSheetProps, 'snapPoints'> {
  /** Snap points as percentages or pixel values */
  snapPoints?: (string | number)[];
  /** Whether to show backdrop */
  enableBackdrop?: boolean;
  /** Whether backdrop is dismissible */
  backdropDismissible?: boolean;
  /** Custom backdrop opacity */
  backdropOpacity?: number;
  /** Children to render inside the bottom sheet */
  children: React.ReactNode;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Custom backdrop component with configurable opacity and dismissal
 */
const CustomBackdrop: React.FC<BottomSheetBackdropProps & { 
  dismissible?: boolean; 
  opacity?: number; 
}> = ({ dismissible = true, opacity = 0.5, ...props }) => {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={dismissible ? -1 : undefined}
      appearsOnIndex={0}
      opacity={opacity}
      enableTouchThrough={false}
    />
  );
};

/**
 * Bottom Sheet Component
 * 
 * A customizable bottom sheet component built on top of @gorhom/bottom-sheet
 * with swipe gestures, snap points, and smooth animations.
 */
export const BottomSheet = forwardRef<BottomSheetComponent, BottomSheetProps>(({
  snapPoints = ['25%', '50%', '90%'],
  enableBackdrop = true,
  backdropDismissible = true,
  backdropOpacity = 0.5,
  children,
  testID,
  ...props
}, ref) => {
  // Memoize snap points to prevent unnecessary re-renders
  const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

  // Custom backdrop renderer
  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <CustomBackdrop
        {...backdropProps}
        dismissible={backdropDismissible}
        opacity={backdropOpacity}
      />
    ),
    [backdropDismissible, backdropOpacity]
  );

  return (
    <BottomSheetComponent
      ref={ref}
      snapPoints={memoizedSnapPoints}
      backdropComponent={enableBackdrop ? renderBackdrop : undefined}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
      style={styles.container}
      {...props}
    >
      <BottomSheetView style={styles.contentContainer} testID={testID}>
        {children}
      </BottomSheetView>
    </BottomSheetComponent>
  );
});

const styles = StyleSheet.create({
  container: {
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  background: {
    backgroundColor: colors.background,
    borderTopLeftRadius: spacing.md,
    borderTopRightRadius: spacing.md,
  },
  handleIndicator: {
    backgroundColor: colors.border,
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});

export default BottomSheet;