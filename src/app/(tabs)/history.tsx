import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import type { Order } from '@/types';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completado', color: '#166534' },
  cancelled: { label: 'Cancelado', color: '#991b1b' },
  pending: { label: 'Pendiente', color: '#92400e' },
  accepted: { label: 'Aceptado', color: '#1e40af' },
  in_progress: { label: 'En camino', color: '#5b21b6' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function HistoryScreen() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const column = profile?.role === 'driver' ? 'driver_id' : 'client_id';
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq(column, user.id)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  }, [user, profile]);

  useEffect(() => {
    setLoading(true);
    fetchHistory().finally(() => setLoading(false));
  }, [fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Historial</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={orders.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Sin pedidos aún</Text>
            <Text style={styles.emptySubtitle}>
              {profile?.role === 'driver'
                ? 'Los pedidos que completes aparecerán aquí.'
                : 'Los pedidos que realices aparecerán aquí.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = STATUS_LABEL[item.status] ?? { label: item.status, color: '#374151' };
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
                <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
                  <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <Text style={styles.address} numberOfLines={1}>🔵 {item.origin_address}</Text>
              <Text style={styles.address} numberOfLines={1}>🔴 {item.destination_address}</Text>
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 28, fontWeight: '900', color: '#111', padding: 20, paddingBottom: 10, backgroundColor: '#f4f4f4' },
  list: { padding: 16, paddingTop: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyBox: { alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  description: { fontSize: 16, fontWeight: 'bold', color: '#111', flex: 1, marginRight: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  address: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
});
