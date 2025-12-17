import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Constants from 'expo-constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Barbershop {
  shop_id: string;
  name: string;
  address: string;
  phone: string;
  description?: string;
  photos: string[];
}

interface Appointment {
  appointment_id: string;
  scheduled_time: string;
  status: string;
}

export default function ClientHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [shopsRes, apptsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/barbershops`),
        user ? axios.get(`${BACKEND_URL}/api/appointments`, { 
          params: { client_user_id: user.user_id, status: 'scheduled' } 
        }) : Promise.resolve({ data: [] })
      ]);
      
      setBarbershops(shopsRes.data);
      
      // Get next upcoming appointment
      if (apptsRes.data.length > 0) {
        const sorted = apptsRes.data.sort((a: Appointment, b: Appointment) => 
          new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
        );
        setNextAppointment(sorted[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderBarbershop = ({ item }: { item: Barbershop }) => (
    <Card style={styles.shopCard} onPress={() => Alert.alert('Próximamente', 'Ver detalles de barbería')}>
      <View style={styles.shopHeader}>
        <Ionicons name="cut" size={40} color="#2563EB" />
        <View style={styles.shopInfo}>
          <Text style={styles.shopName}>{item.name}</Text>
          <Text style={styles.shopAddress}>{item.address}</Text>
          <Text style={styles.shopPhone}>{item.phone}</Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.shopDescription}>{item.description}</Text>
      )}
      <View style={styles.shopActions}>
        <Button
          title="Ver Barberos"
          onPress={() => Alert.alert('Próximamente', 'Ver barberos')}
          variant="primary"
          size="small"
          style={styles.actionButton}
        />
        <Button
          title="Agendar"
          onPress={() => Alert.alert('Próximamente', 'Agendar cita')}
          variant="outline"
          size="small"
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name || 'Usuario'}</Text>
          <Text style={styles.subGreeting}>Encuentra tu barbería ideal</Text>
        </View>
        <Ionicons name="notifications-outline" size={28} color="#1E293B" />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#64748B" />
        <Text style={styles.searchPlaceholder}>Buscar barberías...</Text>
      </View>

      {barbershops.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Ionicons name="store-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No hay barberías registradas</Text>
          <Text style={styles.emptyText}>
            Pronto habrá barberías disponibles en tu área
          </Text>
        </View>
      ) : (
        <FlatList
          data={barbershops}
          renderItem={renderBarbershop}
          keyExtractor={(item) => item.shop_id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subGreeting: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: '#94A3B8',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  shopCard: {
    marginBottom: 16,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shopInfo: {
    flex: 1,
    marginLeft: 16,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  shopPhone: {
    fontSize: 14,
    color: '#64748B',
  },
  shopDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  shopActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});
