import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/store/AuthContext';
import { useLocation } from '@/hooks/useLocation';
import * as Location from 'expo-location';
import { useDriverLocation } from '@/hooks/useDriverLocation';

export default function OrdersScreen() {
  const { orders, loading, createOrder, acceptOrder, updateOrderStatus } = useOrders();
  const { profile, user } = useAuth();
  const { location, isLoadingLocation } = useLocation();
  useDriverLocation();
  
  // Estados para el formulario
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NUEVOS ESTADOS PARA EL MAPA
  const [pickupCoords, setPickupCoords] = useState<{latitude: number, longitude: number} | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{latitude: number, longitude: number} | null>(null);
  // Esta variable nos dice si el próximo toque en el mapa es para recojo o para entrega
  const [selectingMode, setSelectingMode] = useState<'pickup' | 'dropoff'>('pickup'); 

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  // Lógica para crear el pedido
  const handleCreate = async () => {
    if (!description || !pickupCoords || !dropoffCoords) {
      Alert.alert('Atención', 'Por favor ingresa qué llevamos y marca los dos puntos en el mapa.');
      return;
    }
    
    setIsSubmitting(true);

    // ENVIAMOS EL TEXTO TRADUCIDO Y LAS COORDENADAS DE RECOJO
    const success = await createOrder(description, origin, destination, pickupCoords);
    
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

  // Función BLINDADA que se dispara cuando el usuario toca el mapa
  const handleMapPress = async (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setIsSubmitting(true); 
    
    try {
      const geocode = await Location.reverseGeocodeAsync(coords);
      let addressText = "Ubicación seleccionada en el mapa"; // Valor por defecto seguro
      
      if (geocode.length > 0) {
        const place = geocode[0];
        // Intentamos armar la dirección si hay datos válidos
        if (place.street || place.name) {
          addressText = `${place.street || place.name || ''} ${place.streetNumber || ''}, ${place.city || place.subregion || 'Santa Cruz'}`.trim();
          // Limpieza de comas sueltas
          if (addressText === ',' || addressText.startsWith(',')) {
            addressText = place.subregion || place.region || 'Ubicación seleccionada en el mapa';
          }
        }
      }

      // Asignamos las coordenadas y el texto al estado correspondiente
      if (selectingMode === 'pickup') {
        setPickupCoords(coords);
        setOrigin(addressText); 
        setSelectingMode('dropoff');
      } else {
        setDropoffCoords(coords);
        setDestination(addressText);
      }

    } catch (error) {
      console.log("⚠️ Geocoding incompleto (calle sin nombre):", error);
      
      // FALLBACK DE EMERGENCIA: Si la API explota, igual guardamos el punto para no bloquear la app
      const fallbackText = "Ubicación seleccionada en el mapa";
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

  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderDescription}>{item.description}</Text>
        <Text style={[styles.orderStatus, item.status !== 'pending' && styles.statusAccepted]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.orderRoute}>📍 {item.origin_address}</Text>
      <Text style={styles.orderRoute}>🏁 {item.destination_address}</Text>
      
      {profile?.role === 'driver' && item.status === 'pending' && (
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#28a745', marginTop: 10 }]} onPress={() => acceptOrder(item.id)}>
          <Text style={styles.actionButtonText}>Aceptar Pedido</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {profile?.role === 'client' && (
        <View style={styles.formCard}>
          <Text style={styles.title}>¿Qué te llevamos?</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ej. Medicamentos, Documentos" 
            value={description} 
            onChangeText={setDescription} 
          />

          {/* INSTRUCCIONES DINÁMICAS */}
          <View style={styles.instructionBox}>
             <Text style={styles.instructionText}>
               {selectingMode === 'pickup' 
                 ? '📍 Toca el mapa para indicar el RECOJO' 
                 : '🏁 Ahora toca el mapa para la ENTREGA'}
             </Text>
          </View>

          {isLoadingLocation ? (
            <ActivityIndicator size="small" color="#000" style={{ marginVertical: 20 }} />
          ) : location ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.015,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                onPress={handleMapPress}
              >
                {pickupCoords && <Marker coordinate={pickupCoords} title="Punto de Recojo" pinColor="blue" />}
                {dropoffCoords && <Marker coordinate={dropoffCoords} title="Punto de Entrega" pinColor="red" />}
              </MapView>
            </View>
          ) : (
            <Text style={styles.errorText}>Esperando ubicación...</Text>
          )}

          <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={isSubmitting}>
            <Text style={styles.buttonText}>{isSubmitting ? 'Solicitando...' : 'Pedir ahora'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.listTitle}>{profile?.role === 'driver' ? 'Tablero' : 'Mis Pedidos Activos'}</Text>
      
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={renderOrderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 15 },
  formCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 20, elevation: 3 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: '#fafafa' },
  instructionBox: { backgroundColor: '#eef2ff', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#c7d2fe' },
  instructionText: { color: '#3730a3', fontWeight: 'bold', textAlign: 'center' },
  mapContainer: { height: 250, width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  map: { flex: 1 },
  button: { backgroundColor: '#000', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  orderCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderDescription: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  orderStatus: { backgroundColor: '#fff3cd', color: '#856404', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: 'bold' },
  statusAccepted: { backgroundColor: '#d4edda', color: '#155724' },
  orderRoute: { color: '#666', fontSize: 14, marginTop: 4 },
  actionButton: { padding: 12, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontWeight: 'bold' },
  errorText: { color: 'red', marginBottom: 15 }
});