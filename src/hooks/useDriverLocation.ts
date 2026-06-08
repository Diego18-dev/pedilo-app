import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';

export const useDriverLocation = () => {
  const { user, profile } = useAuth();
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!user || profile?.role !== 'driver') return;

    const startTracking = async () => {
      try {
        let { status } = await Location.getForegroundPermissionsAsync();

        if (status !== 'granted') {
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
          status = newStatus;
          if (status !== 'granted') return;
        }

        try {
          await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        } catch {
          // GPS no disponible inmediatamente, watchPositionAsync lo manejará
        }

        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
          },
          async (newLocation) => {
            const { latitude, longitude } = newLocation.coords;

            const { error } = await supabase.rpc('update_driver_location', {
              lat: latitude,
              lng: longitude,
            });

            if (error) console.error('Error actualizando ubicación:', error.message);
          },
        );
      } catch (error) {
        console.error('Error iniciando tracking:', error);
      }
    };

    const timeoutId = setTimeout(startTracking, 1000);

    return () => {
      clearTimeout(timeoutId);
      locationSubscription.current?.remove();
    };
  }, [user, profile]);
};
