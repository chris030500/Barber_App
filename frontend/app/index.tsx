import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('🔵 Index: Navigation check', { user: user ? `${user.name} (${user.role})` : 'null', isLoading });
    
    if (!isLoading) {
      if (user) {
        console.log('✅ Index: User authenticated, navigating to role screen...', { role: user.role });
        // Navigate based on user role
        switch (user.role) {
          case 'client':
            console.log('🔵 Index: Navigating to /(client)/home');
            router.replace('/(client)/home');
            break;
          case 'barber':
            console.log('🔵 Index: Navigating to /(barber)/schedule');
            router.replace('/(barber)/schedule');
            break;
          case 'admin':
            console.log('🔵 Index: Navigating to /(admin)/dashboard');
            router.replace('/(admin)/dashboard');
            break;
          default:
            console.log('⚠️ Index: Unknown role, navigating to welcome');
            router.replace('/(auth)/welcome');
        }
      } else {
        console.log('🔵 Index: No user, navigating to welcome');
        router.replace('/(auth)/welcome');
      }
    } else {
      console.log('🔵 Index: Still loading...');
    }
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.text}>Cargando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
});
