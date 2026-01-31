import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/forms';

export const DemoScreen: React.FC = () => {
  const { user, logout, isLoading } = useAuthContext();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) {
    return null; // This should not happen as this screen is protected
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>¡Bienvenido!</Text>
          <Text style={styles.subtitle}>
            Has iniciado sesión correctamente
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.sectionTitle}>Información del Usuario</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre:</Text>
            <Text style={styles.infoValue}>{user.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo de usuario:</Text>
            <Text style={styles.infoValue}>
              {user.userType === 'individual' ? 'Particular' :
               user.userType === 'agent' ? 'Corredor' : 'Inmobiliaria'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Suscripción:</Text>
            <Text style={[
              styles.infoValue,
              user.subscription.type === 'premium' ? styles.premiumText : styles.freeText
            ]}>
              {user.subscription.type === 'premium' ? 'Premium' : 'Gratuita'}
            </Text>
          </View>

          {user.subscription.type === 'free' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Publicaciones restantes:</Text>
              <Text style={styles.infoValue}>
                {user.subscription.remainingListings || 0}
              </Text>
            </View>
          )}

          {user.companyName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Empresa:</Text>
              <Text style={styles.infoValue}>{user.companyName}</Text>
            </View>
          )}

          {user.licenseNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Licencia:</Text>
              <Text style={styles.infoValue}>{user.licenseNumber}</Text>
            </View>
          )}
        </View>

        <View style={styles.features}>
          <Text style={styles.sectionTitle}>Funcionalidades Disponibles</Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✅ Buscar propiedades</Text>
            <Text style={styles.featureItem}>✅ Guardar favoritos</Text>
            <Text style={styles.featureItem}>✅ Contactar propietarios</Text>
            
            {user.subscription.type === 'premium' ? (
              <>
                <Text style={styles.featureItem}>✅ Publicaciones ilimitadas</Text>
                <Text style={styles.featureItem}>✅ Destacar propiedades</Text>
                <Text style={styles.featureItem}>✅ Estadísticas avanzadas</Text>
              </>
            ) : (
              <>
                <Text style={styles.featureItem}>
                  📝 Publicar propiedades ({user.subscription.remainingListings || 0} restantes)
                </Text>
                <Text style={styles.featureItem}>⭐ Actualizar a Premium para más funciones</Text>
              </>
            )}
          </View>
        </View>

        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          loading={isLoading}
          variant="outline"
          fullWidth
          containerStyle={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  userInfo: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  infoValue: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  premiumText: {
    color: colors.secondary,
  },
  freeText: {
    color: colors.text.secondary,
  },
  features: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  featureList: {
    gap: spacing.sm,
  },
  featureItem: {
    ...typography.body2,
    color: colors.text.primary,
    lineHeight: 20,
  },
  logoutButton: {
    marginTop: spacing.lg,
  },
});