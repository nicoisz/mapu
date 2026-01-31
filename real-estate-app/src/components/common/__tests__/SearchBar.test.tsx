import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  const mockOnSearch = jest.fn();
  const mockOnClear = jest.fn();
  const mockOnFilterPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default placeholder', () => {
    const { getByPlaceholderText } = render(
      <SearchBar onSearch={mockOnSearch} />
    );

    expect(getByPlaceholderText('Buscar propiedades, ubicación...')).toBeTruthy();
  });

  it('should render with custom placeholder', () => {
    const customPlaceholder = 'Buscar casas...';
    const { getByPlaceholderText } = render(
      <SearchBar 
        onSearch={mockOnSearch} 
        placeholder={customPlaceholder}
      />
    );

    expect(getByPlaceholderText(customPlaceholder)).toBeTruthy();
  });

  it('should call onSearch when text is entered', async () => {
    const { getByPlaceholderText } = render(
      <SearchBar onSearch={mockOnSearch} />
    );

    const input = getByPlaceholderText('Buscar propiedades, ubicación...');
    fireEvent.changeText(input, 'santiago');

    // Wait for debounced search
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith({
        query: 'santiago'
      });
    }, { timeout: 1000 });
  });

  it('should call onSearch when submit is pressed', () => {
    const { getByPlaceholderText } = render(
      <SearchBar onSearch={mockOnSearch} />
    );

    const input = getByPlaceholderText('Buscar propiedades, ubicación...');
    fireEvent.changeText(input, 'las condes');
    fireEvent(input, 'submitEditing');

    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'las condes'
    });
  });

  it('should show filter button by default', () => {
    const { getByText } = render(
      <SearchBar onSearch={mockOnSearch} onFilterPress={mockOnFilterPress} />
    );

    expect(getByText('⚙️')).toBeTruthy();
  });

  it('should hide filter button when showFilterButton is false', () => {
    const { queryByText } = render(
      <SearchBar 
        onSearch={mockOnSearch} 
        showFilterButton={false}
      />
    );

    expect(queryByText('⚙️')).toBeNull();
  });

  it('should call onFilterPress when filter button is pressed', () => {
    const { getByText } = render(
      <SearchBar onSearch={mockOnSearch} onFilterPress={mockOnFilterPress} />
    );

    fireEvent.press(getByText('⚙️'));
    expect(mockOnFilterPress).toHaveBeenCalled();
  });

  it('should show loading indicator when isLoading is true', () => {
    const { UNSAFE_getByType } = render(
      <SearchBar onSearch={mockOnSearch} isLoading={true} />
    );

    // Check if ActivityIndicator is rendered
    expect(() => UNSAFE_getByType(ActivityIndicator)).not.toThrow();
  });

  it('should call onClear when clear button is pressed', () => {
    const { getByPlaceholderText, getByText } = render(
      <SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />
    );

    const input = getByPlaceholderText('Buscar propiedades, ubicación...');
    fireEvent.changeText(input, 'test');

    // Clear button should appear
    const clearButton = getByText('✕');
    fireEvent.press(clearButton);

    expect(mockOnClear).toHaveBeenCalled();
  });

  it('should initialize with provided initial value', () => {
    const initialValue = 'providencia';
    const { getByDisplayValue } = render(
      <SearchBar onSearch={mockOnSearch} initialValue={initialValue} />
    );

    expect(getByDisplayValue(initialValue)).toBeTruthy();
  });
});