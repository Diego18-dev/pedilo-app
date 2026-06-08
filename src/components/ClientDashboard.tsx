import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/store/AuthContext';
import { useLocation } from '@/hooks/useLocation';
import * as Location from 'expo-location';
import { supabase } from '@/services/supabase';

export default function ClientDashboard() {
  const { orders, createOrder } = useOrders();
  const { profile } = useAuth();
  const { location, isLoadingLocation } = useLocation();

  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectingMode, setSelectingMode] = useState<'pickup' | 'dropoff'>('pickup');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [driverCoords, setDriverCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const activeOrder = orders.find(
    (o) => (o.status === 'pending' || o.status === 'accepted') && profile?.role === 'client',
  );

  useEffect(() => {
    if (!activeOrder || activeOrder.status !== 'accepted') return;

    const fetchDriverLocation = async () => {
      const { data } = await supabase.rpc('get_active_driver_location', {
        order_id: activeOrder.id,
      });
      if (data && data.length > 0) {
        setDriverCoords({ latitude: data[0].lat, longitude: data[0].lng });
      }
    };

    fetchDriverLocation();
    const interval = setInterval(fetchDriverLocation, 5000);

    return () => clearInterval(interval);
  }, [activeOrder?.id, activeOrder?.status]);

  const handleCreate = async () => {
    if (!description || !pickupCoords || !dropoffCoords) {
      Alert.alert('Faltan datos', 'Por favor ingresa qué llevamos y marca los puntos en el mapa.');
      return;
    }
    setIsSubmitting(true);
    const success = await createOrder(description, origin, destination, pickupCoords, dropoffCoords);
    if (success) {
      setDescription('');
      setOrigin('');
      setDestination('');
      setPickupCoords(null);
      setDropoffCoords(null);
      setSelectingMode('pickup');
    }
    setIsSubmitting(false);
  };

  const handleMapPress = async (e: any) => {
    if (activeOrder) return;

    const coords = e.nativeEvent.coordinate;
    setIsSubmitting(true);
    try {
      const geocode = await Location.reverseGeocodeAsync(coords);
      let addressText = 'Ubicación seleccionada';
      if (geocode.length > 0 && (geocode[0].street || geocode[0].name)) {
        addressText = `${geocode[0].street || geocode[0].name} ${geocode[0].streetNumber || ''}`.trim();
      }
      if (selectingMode === 'pickup') {
        setPickupCoords(coords);
        setOrigin(addressText);
        setSelectingMode('dropoff');
      } else {
        setDropoffCoords(coords);
        setDestination(addressText);
      }
    } catch {
      const fallbackText = 'Ubicación seleccionada en el mapa';
      if (selectingMode === 'pickup') {
        setPickupCoords(coords);
        setOrigin(fallbackText);
        setSelectingMode('dropoff');
      } else {
        setDropoffCoords(coords);
        setDestination(fallbackText);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {isLoadingLocation ? (
        <View style={styles.loadingMap}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Obteniendo tu ubicación...</Text>
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
          showsMyLocationButton={false}
          onPress={handleMapPress}
        >
          {pickupCoords && <Marker coordinate={pickupCoords} title="Recojo" pinColor="blue" />}
          {dropoffCoords && <Marker coordinate={dropoffCoords} title="Entrega" pinColor="red" />}
          {driverCoords && activeOrder?.status === 'accepted' && (
            <Marker coordinate={driverCoords} title="Tu Pedido" description="En camino" pinColor="green" />
          )}
        </MapView>
      ) : null}

      <View style={styles.topHeader}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>📍 Sucre, Bolivia</Text>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        {!activeOrder && (
          <View>
            <View style={styles.dragIndicator} />
            <Text style={styles.title}>¿Qué te llevamos hoy?</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Llaves, Documentos..."
              value={description}
              onChangeText={setDescription}
            />
            <View style={styles.instructionBox}>
              <Text style={styles.instructionText}>
                {selectingMode === 'pickup' ? '1️⃣ Toca el mapa para RECOJO' : '2️⃣ Ahora toca para ENTREGA'}
              </Text>
            </View>
            <View style={styles.addressPreview}>
              <Text style={styles.addressText} numberOfLines={1}>🔵 {origin || 'Esperando recojo...'}</Text>
              <Text style={styles.addressText} numberOfLines={1}>🔴 {destination || 'Esperando entrega...'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Calculando ruta...' : 'Solicitar Pedido'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeOrder?.status === 'pending' && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#3730a3" style={{ marginBottom: 15 }} />
            <Text style={styles.title}>Buscando repartidor...</Text>
            <Text style={styles.subtitle}>Enviando tu solicitud a conductores cercanos.</Text>
          </View>
        )}

        {activeOrder?.status === 'accepted' && (
          <View style={styles.statusContainer}>
            <View style={styles.driverCard}>
              <View style={styles.driverAvatar}>
                <Text style={{ fontSize: 24 }}>🛵</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>¡Repartidor en camino!</Text>
                <Text style={styles.subtitle}>Tu pedido ha sido aceptado.</Text>
              </View>
            </View>
            <View style={styles.etaBox}>
              <Text style={styles.etaText}>Sigue la ruta en el mapa en tiempo real</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  loadingMap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topHeader: { position: 'absolute', top: 50, width: '100%', alignItems: 'center', zIndex: 10 },
  pill: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, elevation: 5 },
  pillText: { fontWeight: 'bold', color: '#333' },
  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40, elevation: 20, zIndex: 10 },
  dragIndicator: { width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 5, alignSelf: 'center', marginBottom: 15 },
  title: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 15, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', padding: 15, borderRadius: 12, marginBottom: 15, backgroundColor: '#f9fafb', fontSize: 16 },
  instructionBox: { backgroundColor: '#eef2ff', padding: 12, borderRadius: 12, marginBottom: 15 },
  instructionText: { color: '#4338ca', fontWeight: 'bold', textAlign: 'center', fontSize: 15 },
  addressPreview: { marginBottom: 20 },
  addressText: { fontSize: 14, color: '#4b5563', marginVertical: 4 },
  button: { backgroundColor: '#000', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  statusContainer: { alignItems: 'center', paddingTop: 10 },
  driverCard: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 },
  driverAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  etaBox: { width: '100%', backgroundColor: '#f0fdf4', padding: 15, borderRadius: 12, alignItems: 'center' },
  etaText: { color: '#166534', fontWeight: 'bold' },
});
