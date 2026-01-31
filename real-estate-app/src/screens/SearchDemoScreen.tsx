import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, typography, spacing } from '../theme';
import { SearchBar, FilterModal } from '../components/common';
import { useSearch } from '../hooks/useSearch';
import { Property } from '../data/models/property';

export const SearchDemoScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const {
    searchResults,
    isLoading,
    error,
    search,
    clearSearch,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
  } = useSearch();

  const handleSearch = (query: any) => {
    search(query);
  };

  const handleFilterPress = () => {
    setIsFilterModalVisible(true);
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  const handlePropertyPress = (property: Property) => {
    console.log('🔍 Search result pressed:', property.id, property.title);
    navigation.navigate('PropertyDetail', { propertyId: property.id });
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => handlePropertyPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.propertyPrice}>
          ${item.pricing.price.toLocaleString()} {item.pricing.currency}
        </Text>
        <Text style={styles.propertyLocation}>
          {item.location.address.city}, {item.location.address.region}
        </Text>
        <View style={styles.propertyDetails}>
          <Text style={styles.propertyDetail}>
            {item.type} • {item.operation}
          </Text>
          <Text style={styles.propertyDetail}>
            {item.features.area}m²
          </Text>
          {item.features.bedrooms && (
            <Text style={styles.propertyDetail}>
              {item.features.bedrooms} dorm.
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>
        {error ? 'Error en la búsqueda' : 'No se encontraron propiedades'}
      </Text>
      <Text style={styles.emptyStateMessage}>
        {error || 'Intenta ajustar tus filtros de búsqueda'}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.screenTitle}>Búsqueda de Propiedades</Text>
      {hasActiveFilters && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={handleClearFilters}
        >
          <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderResultsHeader = () => {
    if (searchResults.length === 0 && !isLoading) return null;
    
    return (
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {isLoading 
            ? 'Buscando...' 
            : `${searchResults.length} propiedades encontradas`
          }
        </Text>
        {hasActiveFilters && (
          <Text style={styles.filtersActive}>Filtros aplicados</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <SearchBar
        onSearch={handleSearch}
        onClear={clearSearch}
        isLoading={isLoading}
        onFilterPress={handleFilterPress}
      />

      {renderResultsHeader()}

      <FlatList
        data={searchResults}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
      />

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        initialFilters={filters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  screenTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  clearFiltersButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
  clearFiltersText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  resultsHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCount: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  filtersActive: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  propertyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  propertyPrice: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  propertyLocation: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  propertyDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  propertyDetail: {
    ...typography.caption,
    color: colors.text.light,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateMessage: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});