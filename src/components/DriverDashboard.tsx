import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView from 'react-native-maps';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/store/AuthContext';
import { useLocation } from '@/hooks/useLocation';
import { useDriverLocation } from '@/hooks/useDriverLocation';

export default function DriverDashboard() {
  const { orders, acceptOrder, updateOrderStatus } = useOrders();
  const { user } = useAuth();
  const { location, isLoadingLocation } = useLocation();
  useDriverLocation();

  const driverActiveOrder = orders.find((o) => o.status === 'accepted' && o.driver_id === user?.id);

  return (
    <View style={styles.container}>
      {isLoadingLocation ? (
        <View style={styles.loadingMap}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Obteniendo GPS...</Text>
        </View>
      ) : location ? (
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
        />
      ) : null}

      <View style={[styles.bottomSheet, { height: 'auto', maxHeight: '60%' }]}>
        {driverActiveOrder ? (
          <View>
            <View style={styles.dragIndicator} />
            <Text style={styles.title}>Viaje en Curso</Text>
            <Text style={styles.subtitle}>Dirígete a los puntos indicados.</Text>
            <View style={styles.addressPreview}>
              <Text style={styles.addressText} numberOfLines={2}>🔵 Recojo: {driverActiveOrder.origin_address}</Text>
              <Text style={styles.addressText} numberOfLines={2}>🔴 Entrega: {driverActiveOrder.destination_address}</Text>
            </View>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#166534', marginTop: 10 }]}
              onPress={() => updateOrderStatus(driverActiveOrder.id, 'completed')}
            >
              <Text style={styles.buttonText}>✅ Marcar como Completado</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.dragIndicator} />
            <Text style={styles.title}>Pedidos Cercanos</Text>
            {orders.length === 0 && (
              <Text style={{ color: '#666', marginTop: 10 }}>No hay pedidos en tu zona...</Text>
            )}
            {orders.map((item) => (
              <View key={item.id} style={styles.orderCard}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.description}</Text>
                <Text style={styles.addressText} numberOfLines={1}>📍 {item.origin_address}</Text>
                {item.status === 'pending' && (
                  <TouchableOpacity style={[styles.button, { marginTop: 15 }]} onPress={() => acceptOrder(item.id)}>
                    <Text style={styles.buttonText}>Aceptar Pedido</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  loadingMap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40, elevation: 20, zIndex: 10 },
  dragIndicator: { width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 5, alignSelf: 'center', marginBottom: 15 },
  title: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 15, lineHeight: 20 },
  addressPreview: { marginBottom: 20 },
  addressText: { fontSize: 14, color: '#4b5563', marginVertical: 4 },
  button: { backgroundColor: '#000', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  orderCard: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#eee' },
});
