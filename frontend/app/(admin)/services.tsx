import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdminServicesScreen() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      if (!user?.barbershop_id) return;
      const response = await axios.get(`${BACKEND_URL}/api/services?shop_id=${user.barbershop_id}`);
      setServices(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Servicios</Text>
      </View>
      <View style={styles.content}>
        <Button title="Agregar Servicio" onPress={() => {}} variant="primary" />
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>No hay servicios configurados</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1E293B' },
  content: { flex: 1, padding: 16 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 16 },
});
