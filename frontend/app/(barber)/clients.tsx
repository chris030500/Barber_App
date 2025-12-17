import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Card from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Appointment {
  appointment_id: string;
  client_user_id: string;
  service_id: string;
  scheduled_time: string;
  status: string;
  notes?: string;
}

export default function BarberClientsScreen() {
  const { user } = useAuth();
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadCompletedAppointments();
    }
  }, [user]);

  const loadCompletedAppointments = async () => {
    try {
      // Get barber profile first
      const barberResponse = await axios.get(`${BACKEND_URL}/api/barbers?user_id=${user?.user_id}`);
      if (barberResponse.data && barberResponse.data.length > 0) {
        const barberId = barberResponse.data[0].barber_id;
        
        // Get completed appointments
        const appointmentsResponse = await axios.get(
          `${BACKEND_URL}/api/appointments?barber_id=${barberId}&status=completed`
        );
        setCompletedAppointments(appointmentsResponse.data);
      }
    } catch (error) {
      console.error('Error loading completed appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCompletedAppointments();
  };

  // Group appointments by client
  const clientsMap = new Map<string, Appointment[]>();
  completedAppointments.forEach(apt => {
    const existing = clientsMap.get(apt.client_user_id) || [];
    clientsMap.set(apt.client_user_id, [...existing, apt]);
  });
  const uniqueClients = Array.from(clientsMap.entries());

  const renderClient = ({ item }: { item: [string, Appointment[]] }) => {
    const [clientId, appointments] = item;
    const lastVisit = appointments.sort((a, b) => 
      new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime()
    )[0];

    return (
      <Card style={styles.clientCard}>
        <View style={styles.clientHeader}>
          <View style={styles.clientAvatar}>
            <Ionicons name="person" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>Cliente</Text>
            <Text style={styles.clientId}>{clientId.substring(0, 12)}...</Text>
          </View>
          <View style={styles.visitBadge}>
            <Text style={styles.visitCount}>{appointments.length}</Text>
            <Text style={styles.visitLabel}>visitas</Text>
          </View>
        </View>
        <View style={styles.clientDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" />
            <Text style={styles.detailText}>
              Última visita: {format(new Date(lastVisit.scheduled_time), "d MMM yyyy", { locale: es })}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Clientes</Text>
        <Text style={styles.subtitle}>Historial de clientes atendidos</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color="#2563EB" />
          <Text style={styles.statNumber}>{uniqueClients.length}</Text>
          <Text style={styles.statLabel}>Clientes</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.statNumber}>{completedAppointments.length}</Text>
          <Text style={styles.statLabel}>Servicios</Text>
        </View>
      </View>

      {uniqueClients.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Aún no has atendido clientes</Text>
          <Text style={styles.emptyText}>
            El historial de tus clientes aparecerá aquí cuando completes servicios
          </Text>
        </View>
      ) : (
        <FlatList
          data={uniqueClients}
          renderItem={renderClient}
          keyExtractor={(item) => item[0]}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  clientCard: {
    marginBottom: 12,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInfo: {
    flex: 1,
    marginLeft: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  clientId: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  visitBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  visitCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  visitLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  clientDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
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
