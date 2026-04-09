import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { Order, OrderStatus } from '@/types';

export const useOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Obtener todos los pedidos
  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error al cargar pedidos', error.message);
    } else {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  // 2. Crear un pedido nuevo (Cliente)
  const createOrder = async (description: string, origin: string, destination: string) => {
    if (!user) return false;
    
    const { error } = await supabase
      .from('orders')
      .insert([
        {
          client_id: user.id,
          description: description,
          origin_address: origin,
          destination_address: destination,
        }
      ]);

    if (error) {
      Alert.alert('Error al crear pedido', error.message);
      return false;
    }
    
    fetchOrders(); 
    return true;
  };

  // 3. Aceptar un pedido (Repartidor)
  const acceptOrder = async (orderId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('orders')
      .update({ status: 'accepted', driver_id: user.id })
      .eq('id', orderId)
      .eq('status', 'pending');

    if (error) {
      Alert.alert('Error al aceptar', error.message);
      return false;
    }

    fetchOrders();
    return true;
  };

  // 4. Actualizar el estado de un pedido (Repartidor)
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!user) return false;

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      Alert.alert('Error', error.message);
      return false;
    }

    fetchOrders();
    return true;
  };

  // 5. El Radar: Carga inicial y Tiempo Real
  useEffect(() => {
    fetchOrders(); 

    if (!user) return;

    const channel = supabase
      .channel('mis_pedidos_en_vivo')
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('¡Cambio detectado en la BD!', payload);
          fetchOrders(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Exponemos todas las funciones para que la pantalla pueda usarlas
  return { orders, loading, createOrder, acceptOrder, updateOrderStatus, fetchOrders };
};