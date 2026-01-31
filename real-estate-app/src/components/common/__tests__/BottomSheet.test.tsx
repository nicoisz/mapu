import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BottomSheet } from '../BottomSheet';

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const MockBottomSheet = React.forwardRef(({ children, testID, ...props }: any, ref: any) => (
    <View testID={testID} {...props}>
      {children}
    </View>
  ));
  
  const MockBottomSheetView = ({ children, ...props }: any) => (
    <View {...props}>{children}</View>
  );
  
  const MockBottomSheetBackdrop = ({ ...props }: any) => (
    <View testID="bottom-sheet-backdrop" {...props} />
  );

  return {
    __esModule: true,
    default: MockBottomSheet,
    BottomSheetView: MockBottomSheetView,
    BottomSheetBackdrop: MockBottomSheetBackdrop,
  };
});

describe('BottomSheet', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <BottomSheet>
        <Text>Test Content</Text>
      </BottomSheet>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies testID correctly', () => {
    const { getByTestId } = render(
      <BottomSheet testID="test-bottom-sheet">
        <Text>Test Content</Text>
      </BottomSheet>
    );

    expect(getByTestId('test-bottom-sheet')).toBeTruthy();
  });

  it('renders with custom snap points', () => {
    const customSnapPoints = ['30%', '70%'];
    
    const { getByTestId } = render(
      <BottomSheet snapPoints={customSnapPoints} testID="custom-bottom-sheet">
        <Text>Custom Content</Text>
      </BottomSheet>
    );

    expect(getByTestId('custom-bottom-sheet')).toBeTruthy();
  });

  it('renders without backdrop when disabled', () => {
    const { queryByTestId } = render(
      <BottomSheet enableBackdrop={false}>
        <Text>No Backdrop Content</Text>
      </BottomSheet>
    );

    expect(queryByTestId('bottom-sheet-backdrop')).toBeFalsy();
  });
});