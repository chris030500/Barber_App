import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="cut" size={80} color="#2563EB" />
          <Text style={styles.title}>BarberShop</Text>
          <Text style={styles.subtitle}>
            Gestiona tu barbería o encuentra el corte perfecto
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="calendar" size={32} color="#2563EB" />
            <Text style={styles.featureText}>Agenda tus citas</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="camera" size={32} color="#2563EB" />
            <Text style={styles.featureText}>IA para recomendaciones</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="star" size={32} color="#2563EB" />
            <Text style={styles.featureText}>Califica barberos</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Iniciar Sesión"
            onPress={() => router.push('/(auth)/login')}
            size="large"
            style={styles.button}
          />
          <Text style={styles.firebaseNote}>
            🔧 Firebase en configuración
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  features: {
    gap: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  featureText: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '500',
  },
  actions: {
    gap: 16,
  },
  button: {
    width: '100%',
  },
  firebaseNote: {
    textAlign: 'center',
    fontSize: 14,
    color: '#F59E0B',
    marginTop: 8,
  },
});
