import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../theme';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/forms';

export const ProfileScreen: React.FC = () => {
  const { user, logout, isLoading } = useAuthContext();
  
  // Estados para edición
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.contactInfo?.phone || '',
    companyName: user?.companyName || '',
  });

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Guardar cambios
      Alert.alert(
        'Guardar Cambios',
        '¿Deseas guardar los cambios realizados?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Guardar', 
            onPress: () => {
              // Aquí iría la lógica para guardar los cambios
              console.log('Guardando cambios:', editedUser);
              setIsEditing(false);
              Alert.alert('Éxito', 'Perfil actualizado correctamente');
            }
          },
        ]
      );
    } else {
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setEditedUser({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.contactInfo?.phone || '',
      companyName: user?.companyName || '',
    });
    setIsEditing(false);
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Cambiar Foto de Perfil',
      'Selecciona una opción',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar Foto', onPress: () => console.log('Tomar foto') },
        { text: 'Elegir de Galería', onPress: () => console.log('Elegir de galería') },
      ]
    );
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con foto de perfil */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.photoContainer}
            onPress={handleChangePhoto}
            activeOpacity={0.7}
          >
            <Image
              source={{ 
                uri: user.avatar || 'https://via.placeholder.com/120x120/E0E0E0/666666?text=👤'
              }}
              style={styles.profilePhoto}
            />
            <View style={styles.photoOverlay}>
              <Text style={styles.photoOverlayText}>📷</Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userType}>
            {user.userType === 'individual' ? 'Particular' :
             user.userType === 'agent' ? 'Corredor' : 'Inmobiliaria'}
          </Text>
          
          <View style={styles.subscriptionBadge}>
            <Text style={[
              styles.subscriptionText,
              user.subscription.type === 'premium' ? styles.premiumBadge : styles.freeBadge
            ]}>
              {user.subscription.type === 'premium' ? '⭐ Premium' : '🆓 Gratuita'}
            </Text>
          </View>
        </View>

        {/* Información Personal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditToggle}
            >
              <Text style={styles.editButtonText}>
                {isEditing ? '💾 Guardar' : '✏️ Editar'}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <Input
                label="Nombre completo"
                value={editedUser.name}
                onChangeText={(text) => setEditedUser(prev => ({ ...prev, name: text }))}
                placeholder="Ingresa tu nombre completo"
              />
              
              <Input
                label="Email"
                value={editedUser.email}
                onChangeText={(text) => setEditedUser(prev => ({ ...prev, email: text }))}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <Input
                label="Teléfono"
                value={editedUser.phone}
                onChangeText={(text) => setEditedUser(prev => ({ ...prev, phone: text }))}
                placeholder="+56 9 1234 5678"
                keyboardType="phone-pad"
              />
              
              {user.userType !== 'individual' && (
                <Input
                  label="Nombre de la empresa"
                  value={editedUser.companyName}
                  onChangeText={(text) => setEditedUser(prev => ({ ...prev, companyName: text }))}
                  placeholder="Nombre de tu empresa"
                />
              )}
              
              <View style={styles.editActions}>
                <Button
                  title="Cancelar"
                  onPress={handleCancelEdit}
                  variant="outline"
                  containerStyle={styles.cancelButton}
                />
                <Button
                  title="Guardar"
                  onPress={handleEditToggle}
                  containerStyle={styles.saveButton}
                />
              </View>
            </View>
          ) : (
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nombre:</Text>
                <Text style={styles.infoValue}>{user.name}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                <Text style={styles.infoValue}>
                  {user.contactInfo?.phone || 'No especificado'}
                </Text>
              </View>
              
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
          )}
        </View>

        {/* Estadísticas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Propiedades</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.properties?.length || 0}</Text>
              <Text style={styles.statLabel}>Publicadas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.savedProperties?.length || 0}</Text>
              <Text style={styles.statLabel}>Favoritas</Text>
            </View>
            {user.subscription.type === 'free' && (
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user.subscription.remainingListings || 0}</Text>
                <Text style={styles.statLabel}>Restantes</Text>
              </View>
            )}
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionText}>🔔 Notificaciones</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionText}>🔒 Privacidad</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionText}>❓ Ayuda</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          
          {user.subscription.type === 'free' && (
            <TouchableOpacity style={[styles.actionItem, styles.premiumAction]}>
              <Text style={styles.premiumActionText}>⭐ Actualizar a Premium</Text>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botón de cerrar sesión */}
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
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  photoOverlayText: {
    fontSize: 16,
  },
  userName: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  userType: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  subscriptionBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  subscriptionText: {
    ...typography.caption,
    fontWeight: '600',
  },
  premiumBadge: {
    color: colors.secondary,
  },
  freeBadge: {
    color: colors.text.secondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
  },
  editButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  editButtonText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  editForm: {
    gap: spacing.md,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  infoList: {
    gap: spacing.sm,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionText: {
    ...typography.body1,
    color: colors.text.primary,
  },
  actionArrow: {
    ...typography.h3,
    color: colors.text.light,
  },
  premiumAction: {
    backgroundColor: colors.secondary + '10',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderBottomWidth: 0,
  },
  premiumActionText: {
    ...typography.body1,
    color: colors.secondary,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: spacing.lg,
  },
});