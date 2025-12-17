import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    console.log('🔵 Index: Navigation check', { 
      user: user ? `${user.name} (${user.role})` : 'null', 
      isLoading 
    });
    
    if (!isLoading && !hasRedirected.current) {
      hasRedirected.current = true;
      if (user) {
        console.log('✅ Index: User authenticated, navigating to role screen...', { role: user.role });
        // Navigate based on user role
        switch (user.role) {
          case 'client':
            router.replace('/(client)/home');
            break;
          case 'barber':
            router.replace('/(barber)/schedule');
            break;
          case 'admin':
            router.replace('/(admin)/dashboard');
            break;
          default:
            router.replace('/(auth)/welcome');
        }
      } else {
        console.log('🔵 Index: No user, navigating to welcome');
        router.replace('/(auth)/welcome');
      }
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
