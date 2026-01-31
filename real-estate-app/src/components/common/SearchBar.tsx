import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { PropertySearchQuery } from '../../data/models/property';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: PropertySearchQuery) => void;
  onClear?: () => void;
  isLoading?: boolean;
  showFilterButton?: boolean;
  onFilterPress?: () => void;
  initialValue?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Buscar propiedades, ubicación...',
  onSearch,
  onClear,
  isLoading = false,
  showFilterButton = true,
  onFilterPress,
  initialValue = '',
}) => {
  const [searchText, setSearchText] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = useCallback(() => {
    const query: PropertySearchQuery = {
      query: searchText.trim() || undefined,
    };
    onSearch(query);
  }, [searchText, onSearch]);

  const handleClear = useCallback(() => {
    setSearchText('');
    onClear?.();
  }, [onClear]);

  const handleChangeText = useCallback((text: string) => {
    setSearchText(text);
    
    // Auto-search after user stops typing (debounced)
    if (text.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        const query: PropertySearchQuery = {
          query: text.trim(),
        };
        onSearch(query);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [onSearch]);

  const handleSubmitEditing = useCallback(() => {
    handleSearch();
  }, [handleSearch]);

  return (
    <View style={styles.container}>
      <View style={[
        styles.searchContainer,
        isFocused && styles.searchContainerFocused,
      ]}>
        {/* Search Icon */}
        <View style={styles.searchIcon}>
          <Text style={styles.searchIconText}>🔍</Text>
        </View>

        {/* Search Input */}
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={colors.text.light}
          value={searchText}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {/* Clear Button */}
        {!isLoading && searchText.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Button */}
      {showFilterButton && (
        <TouchableOpacity
          style={styles.filterButton}
          onPress={onFilterPress}
          activeOpacity={0.7}
        >
          <Text style={styles.filterButtonText}>⚙️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  searchContainerFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  searchIcon: {
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  searchIconText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  searchInput: {
    flex: 1,
    ...typography.input,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
    paddingRight: spacing.xs,
  },
  loadingContainer: {
    paddingHorizontal: spacing.md,
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  clearButtonText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  filterButton: {
    marginLeft: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 18,
  },
});