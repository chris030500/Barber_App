import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [navigationAttempted, setNavigationAttempted] = React.useState(false);

  useEffect(() => {
    console.log('🔵 Index: Navigation check', { 
      user: user ? `${user.name} (${user.role})` : 'null', 
      isLoading,
      navigationAttempted 
    });
    
    if (!isLoading && !navigationAttempted) {
      console.log('🔵 Index: Conditions met for navigation');
      setNavigationAttempted(true);
      
      if (user) {
        console.log('✅ Index: User authenticated, navigating to role screen...', { role: user.role });
        // Navigate based on user role
        switch (user.role) {
          case 'client':
            console.log('🔵 Index: Navigating to /(client)/home');
            setTimeout(() => router.replace('/(client)/home'), 100);
            break;
          case 'barber':
            console.log('🔵 Index: Navigating to /(barber)/schedule');
            setTimeout(() => router.replace('/(barber)/schedule'), 100);
            break;
          case 'admin':
            console.log('🔵 Index: Navigating to /(admin)/dashboard');
            setTimeout(() => router.replace('/(admin)/dashboard'), 100);
            break;
          default:
            console.log('⚠️ Index: Unknown role, navigating to welcome');
            setTimeout(() => router.replace('/(auth)/welcome'), 100);
        }
      } else {
        console.log('🔵 Index: No user, navigating to welcome');
        setTimeout(() => router.replace('/(auth)/welcome'), 100);
      }
    } else {
      console.log('🔵 Index: Waiting...', { isLoading, navigationAttempted });
    }
  }, [user, isLoading, navigationAttempted]);

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
