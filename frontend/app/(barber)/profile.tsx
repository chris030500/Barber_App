import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export default function BarberProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="cut" size={48} color="#64748B" />
              </View>
            )}
          </View>
          <Text style={styles.name}>{user?.name || 'Barbero'}</Text>
          <Text style={styles.email}>{user?.email || 'email@ejemplo.com'}</Text>
          <View style={styles.badge}>
            <Ionicons name="cut" size={16} color="#2563EB" />
            <Text style={styles.badgeText}>Barbero Profesional</Text>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi Cuenta</Text>
          
          <Card style={styles.menuItem} onPress={() => Alert.alert('Próximamente', 'Editar perfil')}>
            <Ionicons name="person-outline" size={24} color="#1E293B" />
            <Text style={styles.menuText}>Editar perfil</Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" style={styles.menuArrow} />
          </Card>

          <Card style={styles.menuItem} onPress={() => Alert.alert('Próximamente', 'Horarios')}>
            <Ionicons name="time-outline" size={24} color="#1E293B" />
            <Text style={styles.menuText}>Horarios de trabajo</Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" style={styles.menuArrow} />
          </Card>

          <Card style={styles.menuItem} onPress={() => Alert.alert('Próximamente', 'Servicios')}>
            <Ionicons name="list-outline" size={24} color="#1E293B" />
            <Text style={styles.menuText}>Mis servicios</Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" style={styles.menuArrow} />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <Card style={styles.menuItem} onPress={() => Alert.alert('Próximamente', 'Notificaciones')}>
            <Ionicons name="notifications-outline" size={24} color="#1E293B" />
            <Text style={styles.menuText}>Notificaciones</Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" style={styles.menuArrow} />
          </Card>

          <Card style={styles.menuItem} onPress={() => Alert.alert('Próximamente', 'Ayuda')}>
            <Ionicons name="help-circle-outline" size={24} color="#1E293B" />
            <Text style={styles.menuText}>Ayuda y soporte</Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" style={styles.menuArrow} />
          </Card>
        </View>

        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="danger"
          size="large"
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 16,
  },
  menuArrow: {
    marginLeft: 'auto',
  },
  logoutButton: {
    marginTop: 16,
  },
});
