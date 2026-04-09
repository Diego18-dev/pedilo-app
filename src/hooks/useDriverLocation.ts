import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';

export const useDriverLocation = () => {
  const { user, profile } = useAuth();
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  console.log("🛠️ ESTADO DEL RADAR -> Usuario:", user?.email, "| Rol:", profile?.role);

  useEffect(() => {
    if (!user || profile?.role !== 'driver') {
      console.log("🛑 Radar apagado: No es repartidor o no hay sesión.");
      return; 
    }

    const startTracking = async () => {
      try {
        console.log('🔍 1. Verificando permisos...');
        let { status } = await Location.getForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
          status = newStatus;
          if (status !== 'granted') return; 
        }

        console.log('✅ 3. Permisos listos. Haciendo prueba de PING al GPS...');

        // --- INICIO DEL DESFIBRILADOR ---
        try {
          // Forzamos al emulador a darnos 1 sola ubicación con máxima precisión
          const ping = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          console.log(`🎯 PING EXITOSO: Lat ${ping.coords.latitude}, Lng ${ping.coords.longitude}`);
        } catch (pingError) {
          console.log('⚠️ EL PING FALLÓ. El emulador está sordo:', pingError);
        }
        // --- FIN DEL DESFIBRILADOR ---

        console.log('🔄 Iniciando radar continuo...');

        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High, // <-- CAMBIADO A HIGH
            timeInterval: 5000, 
            distanceInterval: 0, // <-- OBLIGAMOS a que avise aunque no se mueva
          },
          async (newLocation) => {
            const { latitude, longitude } = newLocation.coords;
            console.log(`📡 4. RADAR DETECTÓ MOVIMIENTO: Lat ${latitude}, Lng ${longitude}`);
            
            const { error } = await supabase.rpc('update_driver_location', {
              lat: latitude,
              lng: longitude
            });

            if (error) {
              console.error('❌ Error guardando en BD:', error.message);
            } else {
              console.log('💾 5. RPC Exitoso: Ubicación en Supabase');
            }
          }
        );
      } catch (error) {
        console.error('Error catastrófico:', error);
      }
    };

    const timeoutId = setTimeout(() => {
      startTracking();
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [user, profile]);
};