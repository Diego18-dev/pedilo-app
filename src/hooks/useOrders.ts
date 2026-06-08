import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import type { Order } from '@/types';

export const useOrders = () => {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (profile?.role === 'driver') {
        const { data: activeData, error: activeError } = await supabase
          .from('orders')
          .select('*')
          .eq('driver_id', user?.id)
          .eq('status', 'accepted');

        if (activeError) throw activeError;

        if (activeData && activeData.length > 0) {
          setOrders(activeData);
        } else {
          const { data, error } = await supabase.rpc('get_nearby_pending_orders', {
            radio_metros: 50000,
          });
          if (error) throw error;
          setOrders(data || []);
        }
      } else {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('client_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error obteniendo pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (
    description: string,
    origin: string,
    destination: string,
    pickupCoords: { latitude: number; longitude: number },
  ) => {
    if (!user) return false;

    try {
      const { data: drivers, error: searchError } = await supabase.rpc('buscar_repartidores_cercanos', {
        pickup_lat: pickupCoords.latitude,
        pickup_lng: pickupCoords.longitude,
        radio_metros: 50000,
      });

      if (searchError) throw searchError;

      if (!drivers || drivers.length === 0) {
        Alert.alert(
          'Zona sin cobertura temporal',
          'No hay repartidores cerca de tu punto de recogida. Intenta en unos minutos.',
        );
        return false;
      }

      const { error } = await supabase
        .from('orders')
        .insert({
          client_id: user.id,
          description,
          origin_address: origin,
          destination_address: destination,
          status: 'pending',
          pickup_location: `POINT(${pickupCoords.longitude} ${pickupCoords.latitude})`,
        });

      if (error) throw error;

      Alert.alert('¡Éxito!', `Buscando repartidor... Hay ${drivers.length} cerca de ti.`);
      fetchOrders();
      return true;
    } catch (error: any) {
      console.error('Error creando pedido:', error.message);
      Alert.alert('Error', 'No se pudo procesar tu pedido');
      return false;
    }
  };

  const acceptOrder = async (orderId: string) => {
    if (!user || profile?.role !== 'driver') return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'accepted', driver_id: user.id })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error aceptando pedido:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error actualizando pedido:', error);
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders(),
      )
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [user]);

  return { orders, loading, createOrder, acceptOrder, updateOrderStatus, fetchOrders };
};
