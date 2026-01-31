import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button } from '../components/forms';
import { colors, typography, spacing } from '../theme';

export const TestInputScreen: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Test de Inputs</Text>
        
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="test@example.com"
          keyboardType="email-address"
        />

        <Input
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Tu contraseña"
          isPassword
        />

        <Input
          label="Confirmar Contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirma tu contraseña"
          isPassword
        />

        <Button
          title="Test"
          onPress={() => {
            console.log('Email:', email);
            console.log('Password:', password);
            console.log('Confirm Password:', confirmPassword);
          }}
          fullWidth
        />

        <View style={styles.debug}>
          <Text style={styles.debugText}>Debug Info:</Text>
          <Text style={styles.debugText}>Email: {email}</Text>
          <Text style={styles.debugText}>Password: {password}</Text>
          <Text style={styles.debugText}>Confirm: {confirmPassword}</Text>
        </View>
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
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  debug: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  debugText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
});