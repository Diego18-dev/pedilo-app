import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';

export const useOrders = () => {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. CARGAR PEDIDOS (El Tablero Inteligente)
  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (profile?.role === 'driver') {
        console.log('Buscando pedidos cercanos al repartidor...');
        // ¡HACK DE TESTING!: 50000 metros (50km). En producción cambiar a 3000.
        const { data, error } = await supabase.rpc('get_nearby_pending_orders', {
          radio_metros: 50000 
        });
        
        if (error) throw error;
        setOrders(data || []);
      } else {
        // El cliente solo ve sus propios pedidos
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

  // 2. CREAR PEDIDO (El Matching)
  const createOrder = async (
    description: string, 
    origin: string, 
    destination: string, 
    pickupCoords: { latitude: number, longitude: number }
  ) => {
    if (!user) return false;

    try {
      console.log('📡 1. Escaneando zona...');
      
      const { data: drivers, error: searchError } = await supabase.rpc('buscar_repartidores_cercanos', {
        pickup_lat: pickupCoords.latitude,
        pickup_lng: pickupCoords.longitude,
        radio_metros: 50000 // <-- Hack de 50km
      });

      if (searchError) throw searchError;

      console.log(`🛵 2. Repartidores encontrados: ${drivers?.length || 0}`);

      if (!drivers || drivers.length === 0) {
        Alert.alert(
          'Zona sin cobertura temporal', 
          'No hay repartidores cerca de tu punto de recogida. Intenta en unos minutos.'
        );
        return false;
      }

      console.log('🏆 El más cercano es:', drivers[0].full_name, 'a', Math.round(drivers[0].distancia_metros), 'metros');

      const { error } = await supabase
        .from('orders')
        .insert({
          client_id: user.id,
          description: description,
          origin_address: origin,
          destination_address: destination,
          status: 'pending',
          pickup_location: `POINT(${pickupCoords.longitude} ${pickupCoords.latitude})`
        });

      if (error) throw error;
      
      Alert.alert('¡Éxito!', `Buscando repartidor... Hay ${drivers.length} cerca de ti.`);
      fetchOrders(); // Refrescar la lista de inmediato
      return true;

    } catch (error: any) {
      console.error('Error creando pedido:', error.message);
      Alert.alert('Error', 'No se pudo procesar tu pedido');
      return false;
    }
  };

  // 3. ACEPTAR PEDIDO (Para el Driver)
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

  // 4. ACTUALIZAR ESTADO (En camino, Completado, etc)
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

  // Refrescar al cargar la pantalla
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, profile]);

  return { orders, loading, createOrder, acceptOrder, updateOrderStatus, fetchOrders };
};