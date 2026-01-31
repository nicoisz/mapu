import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { propertyService } from '../../services/propertyService';
import { Property } from '../../data/models';
import { colors, typography, spacing } from '../../theme';

interface DashboardScreenProps {
  navigation?: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserProperties();
    }
  }, [isAuthenticated, user]);

  const loadUserProperties = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const properties = await propertyService.getUserProperties(user.id);
      setUserProperties(properties);
    } catch (error) {
      console.error('Error loading user properties:', error);
      Alert.alert('Error', 'No se pudieron cargar las propiedades');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProperties();
    setRefreshing(false);
  };

  const getRemainingDays = (expiresAt?: Date): number => {
    if (!expiresAt) return 0;
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getActiveProperties = (): Property[] => {
    return userProperties.filter(p => p.status === 'active');
  };

  const getExpiredProperties = (): Property[] => {
    return userProperties.filter(p => p.status === 'expired');
  };

  const handleAddProperty = () => {
    // Navigate to property creation form
    if (navigation) {
      navigation.navigate('AddProperty');
    } else {
      // Fallback for demo purposes
      Alert.alert(
        'Agregar Propiedad',
        'Funcionalidad de creación de propiedades disponible',
        [
          { text: 'OK' }
        ]
      );
    }
  };

  const handleUpgradeToPremium = () => {
    Alert.alert(
      'Actualizar a Premium',
      '¿Deseas actualizar tu cuenta a Premium para obtener más beneficios?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Actualizar', onPress: () => console.log('Upgrade to premium') }
      ]
    );
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Debes iniciar sesión para ver tu dashboard</Text>
      </View>
    );
  }

  const activeProperties = getActiveProperties();
  const expiredProperties = getExpiredProperties();
  const isPremium = user.subscription.type === 'premium';
  const remainingListings = user.subscription.remainingListings || 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>
      </View>

      {/* Subscription Status Section */}
      <View style={styles.subscriptionSection}>
        <View style={styles.subscriptionHeader}>
          <Text style={styles.sectionTitle}>Estado de Suscripción</Text>
          <View style={[
            styles.subscriptionBadge,
            isPremium ? styles.premiumBadge : styles.freeBadge
          ]}>
            <Text style={[
              styles.subscriptionBadgeText,
              isPremium ? styles.premiumBadgeText : styles.freeBadgeText
            ]}>
              {isPremium ? 'PREMIUM' : 'GRATIS'}
            </Text>
          </View>
        </View>

        {!isPremium && (
          <View style={styles.freeUserInfo}>
            <Text style={styles.remainingListingsText}>
              Publicaciones gratuitas restantes: {remainingListings}
            </Text>
            {remainingListings === 0 && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgradeToPremium}
              >
                <Text style={styles.upgradeButtonText}>
                  Actualizar a Premium
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Properties Statistics */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Mis Propiedades</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userProperties.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.success }]}>
              {activeProperties.length}
            </Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>
              {expiredProperties.length}
            </Text>
            <Text style={styles.statLabel}>Expiradas</Text>
          </View>
        </View>
      </View>

      {/* Active Properties List */}
      {activeProperties.length > 0 && (
        <View style={styles.propertiesSection}>
          <Text style={styles.sectionTitle}>Propiedades Activas</Text>
          {activeProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              showRemainingDays={!isPremium}
            />
          ))}
        </View>
      )}

      {/* Expired Properties List */}
      {expiredProperties.length > 0 && (
        <View style={styles.propertiesSection}>
          <Text style={styles.sectionTitle}>Propiedades Expiradas</Text>
          {expiredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isExpired={true}
              onRenew={() => handleUpgradeToPremium()}
            />
          ))}
        </View>
      )}

      {/* Add Property Button */}
      <TouchableOpacity
        style={styles.addPropertyButton}
        onPress={handleAddProperty}
      >
        <Text style={styles.addPropertyButtonText}>+ Agregar Propiedad</Text>
      </TouchableOpacity>

      {/* Empty State */}
      {userProperties.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No tienes propiedades</Text>
          <Text style={styles.emptyStateText}>
            Comienza agregando tu primera propiedad
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

interface PropertyCardProps {
  property: Property;
  showRemainingDays?: boolean;
  isExpired?: boolean;
  onRenew?: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  showRemainingDays = false,
  isExpired = false,
  onRenew
}) => {
  const getRemainingDays = (expiresAt?: Date): number => {
    if (!expiresAt) return 0;
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const remainingDays = showRemainingDays && property.listing.expiresAt
    ? getRemainingDays(property.listing.expiresAt)
    : null;

  return (
    <View style={[styles.propertyCard, isExpired && styles.expiredPropertyCard]}>
      <View style={styles.propertyCardHeader}>
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {property.title}
        </Text>
        <Text style={styles.propertyPrice}>
          ${property.pricing.price.toLocaleString()} {property.pricing.currency}
        </Text>
      </View>
      
      <Text style={styles.propertyLocation} numberOfLines={1}>
        {property.location.address.city}, {property.location.address.region}
      </Text>
      
      <View style={styles.propertyStats}>
        <Text style={styles.propertyStat}>
          👁 {property.listing.views} vistas
        </Text>
        <Text style={styles.propertyStat}>
          ❤️ {property.listing.favorites} favoritos
        </Text>
        <Text style={styles.propertyStat}>
          📞 {property.listing.inquiries} consultas
        </Text>
      </View>

      {remainingDays !== null && (
        <View style={styles.remainingDaysContainer}>
          <Text style={[
            styles.remainingDaysText,
            remainingDays <= 3 && styles.urgentText
          ]}>
            {remainingDays > 0 
              ? `${remainingDays} días restantes`
              : 'Expirado'
            }
          </Text>
        </View>
      )}

      {isExpired && onRenew && (
        <TouchableOpacity style={styles.renewButton} onPress={onRenew}>
          <Text style={styles.renewButtonText}>Renovar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileSection: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.h2,
    color: colors.background,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  subscriptionSection: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  subscriptionBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  premiumBadge: {
    backgroundColor: colors.secondary,
  },
  freeBadge: {
    backgroundColor: colors.warning,
  },
  subscriptionBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  premiumBadgeText: {
    color: colors.background,
  },
  freeBadgeText: {
    color: colors.background,
  },
  freeUserInfo: {
    alignItems: 'center',
  },
  remainingListingsText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  upgradeButtonText: {
    ...typography.button,
    color: colors.background,
  },
  statsSection: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  propertiesSection: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  propertyCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expiredPropertyCard: {
    opacity: 0.7,
    borderColor: colors.warning,
  },
  propertyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  propertyTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  propertyPrice: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.primary,
  },
  propertyLocation: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  propertyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  propertyStat: {
    ...typography.caption,
    color: colors.text.light,
  },
  remainingDaysContainer: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  remainingDaysText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  urgentText: {
    color: colors.error,
    fontWeight: '600',
  },
  renewButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  renewButtonText: {
    ...typography.body2,
    color: colors.background,
    fontWeight: '600',
  },
  addPropertyButton: {
    backgroundColor: colors.primary,
    margin: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  addPropertyButtonText: {
    ...typography.button,
    color: colors.background,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body1,
    color: colors.error,
    textAlign: 'center',
    margin: spacing.lg,
  },
});