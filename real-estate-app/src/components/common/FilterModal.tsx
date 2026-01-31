import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../theme';
import { 
  PropertySearchFilters
} from '../../data/models/property';
import { PropertyType, PropertyOperation, Currency } from '../../data/models/enums';
import { Input } from '../forms/Input';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: PropertySearchFilters) => void;
  onClearFilters: () => void;
  initialFilters?: PropertySearchFilters;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  onClearFilters,
  initialFilters = {},
}) => {
  const [filters, setFilters] = useState<PropertySearchFilters>(initialFilters);

  const updateFilter = useCallback(<K extends keyof PropertySearchFilters>(
    key: K,
    value: PropertySearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleApply = useCallback(() => {
    onApplyFilters(filters);
    onClose();
  }, [filters, onApplyFilters, onClose]);

  const handleClear = useCallback(() => {
    setFilters({});
    onClearFilters();
  }, [onClearFilters]);

  const togglePropertyType = useCallback((type: PropertyType) => {
    const currentTypes = filters.type || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    updateFilter('type', newTypes.length > 0 ? newTypes : undefined);
  }, [filters.type, updateFilter]);

  const setPriceRange = useCallback((min?: number, max?: number) => {
    if (!min && !max) {
      updateFilter('priceRange', undefined);
    } else {
      updateFilter('priceRange', {
        min: min || 0,
        max: max || Number.MAX_SAFE_INTEGER,
        currency: Currency.CLP,
      });
    }
  }, [updateFilter]);

  const setAreaRange = useCallback((min?: number, max?: number) => {
    if (!min && !max) {
      updateFilter('areaRange', undefined);
    } else {
      updateFilter('areaRange', {
        min: min || 0,
        max: max || Number.MAX_SAFE_INTEGER,
      });
    }
  }, [updateFilter]);

  const setBedrooms = useCallback((min?: number, max?: number) => {
    if (!min && !max) {
      updateFilter('bedrooms', undefined);
    } else {
      updateFilter('bedrooms', { min, max });
    }
  }, [updateFilter]);

  const setBathrooms = useCallback((min?: number, max?: number) => {
    if (!min && !max) {
      updateFilter('bathrooms', undefined);
    } else {
      updateFilter('bathrooms', { min, max });
    }
  }, [updateFilter]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filtros</Text>
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Operation Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operación</Text>
            <View style={styles.buttonRow}>
              <FilterButton
                title="Venta"
                selected={filters.operation === PropertyOperation.SALE}
                onPress={() => updateFilter('operation', 
                  filters.operation === PropertyOperation.SALE ? undefined : PropertyOperation.SALE
                )}
              />
              <FilterButton
                title="Arriendo"
                selected={filters.operation === PropertyOperation.RENT}
                onPress={() => updateFilter('operation', 
                  filters.operation === PropertyOperation.RENT ? undefined : PropertyOperation.RENT
                )}
              />
            </View>
          </View>

          {/* Property Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Propiedad</Text>
            <View style={styles.buttonGrid}>
              <FilterButton
                title="Casa"
                selected={filters.type?.includes(PropertyType.HOUSE) || false}
                onPress={() => togglePropertyType(PropertyType.HOUSE)}
              />
              <FilterButton
                title="Departamento"
                selected={filters.type?.includes(PropertyType.APARTMENT) || false}
                onPress={() => togglePropertyType(PropertyType.APARTMENT)}
              />
              <FilterButton
                title="Oficina"
                selected={filters.type?.includes(PropertyType.OFFICE) || false}
                onPress={() => togglePropertyType(PropertyType.OFFICE)}
              />
              <FilterButton
                title="Local"
                selected={filters.type?.includes(PropertyType.COMMERCIAL) || false}
                onPress={() => togglePropertyType(PropertyType.COMMERCIAL)}
              />
              <FilterButton
                title="Terreno"
                selected={filters.type?.includes(PropertyType.LAND) || false}
                onPress={() => togglePropertyType(PropertyType.LAND)}
              />
              <FilterButton
                title="Bodega"
                selected={filters.type?.includes(PropertyType.WAREHOUSE) || false}
                onPress={() => togglePropertyType(PropertyType.WAREHOUSE)}
              />
            </View>
          </View>

          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rango de Precio (CLP)</Text>
            <View style={styles.rangeInputs}>
              <Input
                label="Precio mínimo"
                placeholder="0"
                keyboardType="numeric"
                value={filters.priceRange?.min?.toString() || ''}
                onChangeText={(text) => {
                  const min = text ? parseInt(text.replace(/[^0-9]/g, '')) : undefined;
                  setPriceRange(min, filters.priceRange?.max);
                }}
                containerStyle={styles.rangeInput}
              />
              <Input
                label="Precio máximo"
                placeholder="Sin límite"
                keyboardType="numeric"
                value={filters.priceRange?.max !== Number.MAX_SAFE_INTEGER 
                  ? filters.priceRange?.max?.toString() || '' 
                  : ''
                }
                onChangeText={(text) => {
                  const max = text ? parseInt(text.replace(/[^0-9]/g, '')) : undefined;
                  setPriceRange(filters.priceRange?.min, max);
                }}
                containerStyle={styles.rangeInput}
              />
            </View>
          </View>

          {/* Area Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Superficie (m²)</Text>
            <View style={styles.rangeInputs}>
              <Input
                label="Superficie mínima"
                placeholder="0"
                keyboardType="numeric"
                value={filters.areaRange?.min?.toString() || ''}
                onChangeText={(text) => {
                  const min = text ? parseInt(text.replace(/[^0-9]/g, '')) : undefined;
                  setAreaRange(min, filters.areaRange?.max);
                }}
                containerStyle={styles.rangeInput}
              />
              <Input
                label="Superficie máxima"
                placeholder="Sin límite"
                keyboardType="numeric"
                value={filters.areaRange?.max !== Number.MAX_SAFE_INTEGER 
                  ? filters.areaRange?.max?.toString() || '' 
                  : ''
                }
                onChangeText={(text) => {
                  const max = text ? parseInt(text.replace(/[^0-9]/g, '')) : undefined;
                  setAreaRange(filters.areaRange?.min, max);
                }}
                containerStyle={styles.rangeInput}
              />
            </View>
          </View>

          {/* Bedrooms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dormitorios</Text>
            <View style={styles.buttonRow}>
              {[1, 2, 3, 4, 5].map(count => (
                <FilterButton
                  key={count}
                  title={count.toString()}
                  selected={filters.bedrooms?.min === count}
                  onPress={() => setBedrooms(
                    filters.bedrooms?.min === count ? undefined : count,
                    undefined
                  )}
                  style={styles.numberButton}
                />
              ))}
              <FilterButton
                title="5+"
                selected={filters.bedrooms?.min === 5}
                onPress={() => setBedrooms(5, undefined)}
                style={styles.numberButton}
              />
            </View>
          </View>

          {/* Bathrooms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Baños</Text>
            <View style={styles.buttonRow}>
              {[1, 2, 3, 4].map(count => (
                <FilterButton
                  key={count}
                  title={count.toString()}
                  selected={filters.bathrooms?.min === count}
                  onPress={() => setBathrooms(
                    filters.bathrooms?.min === count ? undefined : count,
                    undefined
                  )}
                  style={styles.numberButton}
                />
              ))}
              <FilterButton
                title="4+"
                selected={filters.bathrooms?.min === 4}
                onPress={() => setBathrooms(4, undefined)}
                style={styles.numberButton}
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
            activeOpacity={0.8}
          >
            <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

interface FilterButtonProps {
  title: string;
  selected: boolean;
  onPress: () => void;
  style?: object;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  title,
  selected,
  onPress,
  style,
}) => (
  <TouchableOpacity
    style={[
      styles.filterButton,
      selected && styles.filterButtonSelected,
      style,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[
      styles.filterButtonText,
      selected && styles.filterButtonTextSelected,
    ]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearButtonText: {
    ...typography.body2,
    color: colors.accent,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  section: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    ...typography.body2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  filterButtonTextSelected: {
    color: colors.background,
    fontWeight: '600',
  },
  numberButton: {
    minWidth: 50,
  },
  rangeInputs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rangeInput: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  applyButtonText: {
    ...typography.button,
    color: colors.background,
  },
});